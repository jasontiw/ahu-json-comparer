# JCI JSON Comparer

A CLI tool for semantically comparing two AHU (Air Handling Unit) JSON model files from Johnson Controls.

## The Problem

AHU model JSON files (~17K lines) contain hundreds of GUIDs that **change on every export**. Comparing by ID or array position doesn't work — the same logical entity appears with different GUIDs and in different order between versions.

## The Solution

**Semantic matching by business keys**: instead of comparing by GUID or index, the tool:

1. Matches segments by `segmentType + segmentTypeSuffix`
2. Inside each list, matches items using all non-ID properties as a **business key**
3. Recursively compares down to the deepest nesting level
4. Ignores volatile fields (`id`, `$type`, `*_ID`)

### Structural Reorganization (--reorganize)

AHU JSON files have flat lists like `openingList` (27 items) and `bulkheadList` (8 items) that reference segments via `associatedUISegmentID`. With `--reorganize`, the tool restructures the JSON before comparing, nesting each list under its corresponding segment:

```
Before:                         After:
unit/                           unit/
├── segmentList[15]             ├── segmentList[15]/
├── openingList[27]             │   └── IP-1/
├── bulkheadList[8]             │       ├── openings[2]
├── coilPanelList[2]            │       ├── bulkheads[1]
├── airPathList[2]              │       ├── coilPanels[...]
├── cabinetList[2]              │       └── relatedReferences[...]
├── ...                          ├── airPathList[2]    ← multi-segment, stays top-level
                                └── ...
```

This makes diffs show changes like `unit.segmentList[match:IP/0].openings[added:...]` instead of `unit.openingList[match:...]`, providing immediate structural context.

## Stack

- **Python 3.10+** — zero external dependencies (stdlib only)
- **pytest** — unit and integration tests
- **ruff** — linter and formatter

## Installation

```bash
pip install pytest ruff
```

No project install required — runs directly from the repo root.

## Usage

### Full Pipeline (single command)

```bash
# All-in-one: reorganize -> diff.json -> diff.html
python run_diff.py

# Without reorganization
python run_diff.py --no-reorganize

# With custom files
python run_diff.py file1.json file2.json
```

### Direct CLI — JSON diff

```bash
# Pretty-printed output
python -m src.cli file1.json file2.json --pretty

# Reorganize before comparing (nests openings, bulkheads, etc. under each segment)
python -m src.cli file1.json file2.json --reorganize --pretty

# Reorganize and also save reorganized JSON files as _reorganized.json
python -m src.cli file1.json file2.json --reorganize --output-reorganized
```

| Flag | Description |
|------|-------------|
| `--pretty` / `-p` | Human-readable indented output |
| `--reorganize` / `-r` | Restructures JSON nesting lists under their segments before diffing |
| `--output-reorganized` / `-o` | Saves reorganized JSONs as `{name}_reorganized.json` (implies `--reorganize`) |

### HTML Report — visual analysis

```bash
python generate_report.py diff.json
# Generates diff.html — open in browser
```

## HTML Report

The `diff.html` report is an interactive tree with:

- **Color coding**: yellow (changed), green (added), red (removed)
- **Search filter** on paths
- **"Changes only" toggle** to hide unchanged nodes
- **Expand/Collapse all**
- **Change counter** in the header
- **Left/Right values** side-by-side with strikethrough for changed items

## Diff JSON Structure

Each node:

```json
{
  "path": "$.unit.segmentList[3].weight",
  "type": "integer",
  "status": "changed",
  "has_changes": true,
  "left": 1900,
  "right": 1925
}
```

| Field | Description |
|---|---|
| `path` | JSON path to the node (`$` JMESPath-style notation) |
| `type` | Value type (`object`, `array`, `string`, `integer`, `number`, `boolean`) |
| `status` | `unchanged`, `changed`, `added`, `removed` |
| `has_changes` | `true` if the node or any child has changes |
| `left` | Value from the **first file** (original / baseline) — only on `changed`, `removed` |
| `right` | Value from the **second file** (new / variant) — only on `changed`, `added` |
| `value` | Single value (only on `added`, `removed`) |
| `children` | Child nodes (only on `object` and `array`) |

## Tests

```bash
python -m pytest tests/ -v
```

Includes unit tests (`test_matcher.py`, `test_differ.py`, `test_reorganizer.py`) and integration tests against real files (`test_integration.py`).

## Project Structure

```
jci-json-comparer/
├── src/
│   ├── __init__.py
│   ├── cli.py          # Entry point
│   ├── types.py        # DiffNode, DiffStatus, utilities
│   ├── loader.py       # JSON loading (utf-8 / cp1252)
│   ├── reorganizer.py  # Reorganization: nest lists under segments
│   ├── matcher.py      # Semantic matching by business keys
│   └── differ.py       # Recursive comparison
├── tests/
│   ├── __init__.py
│   ├── test_matcher.py
│   ├── test_differ.py
│   ├── test_reorganizer.py
│   └── test_integration.py
├── generate_report.py  # Generates HTML report from diff.json
├── run_diff.py         # Helper: runs the comparer
├── pyproject.toml
├── .gitignore
└── README.md
```

## Architecture

```
┌──────────┐    ┌──────────────┐    ┌──────────┐    ┌──────────┐
│  Loader  │ → │ Reorganizer  │ → │ Matcher  │ → │  Differ  │ → JSON
│ (parse)  │    │ (--reorg)    │    │ (match)  │    │ (diff)   │
└──────────┘    └──────────────┘    └──────────┘    └──────────┘
```

Four independent layers:
- **Loader**: loads and parses the JSON files
- **Reorganizer**: [optional] restructures JSON nesting lists under their segments (only with `--reorganize`)
- **Matcher**: pairs segments by `segmentType + segmentTypeSuffix` and list items by business keys
- **Differ**: traverses and compares recursively, producing a `DiffNode` tree

## License

Internal use.
