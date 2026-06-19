# JCI JSON Comparer

A web-based tool for semantically comparing two AHU (Air Handling Unit) JSON model files from Johnson Controls. Deployed live at [jasontiw.github.io/ahu-json-comparer](https://jasontiw.github.io/ahu-json-comparer).

## The Problem

AHU model JSON files (~17K lines) contain hundreds of GUIDs that **change on every export**. Comparing by ID or array position doesn't work — the same logical entity appears with different GUIDs and in different order between versions.

## The Solution

**Semantic matching by business keys**: instead of comparing by GUID or index, the tool:

1. Matches segments by `segmentType + segmentTypeSuffix`
2. Inside each list, matches items using all non-ID properties as a **business key**
3. Recursively compares down to the deepest nesting level
4. Ignores volatile fields (`id`, `$type`, `*_ID`)

### Structural Reorganization (reorganize toggle)

AHU JSON files have flat lists like `openingList` and `bulkheadList` that reference segments via `associatedUISegmentID`. With the **Reorganize** toggle, the tool restructures the JSON before comparing, nesting each list under its corresponding segment:

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

### Web App Features

- **Two input methods**: file drag & drop / click-to-select, or paste JSON directly
- **Interactive diff tree** with color coding: yellow (changed), green (added), red (removed)
- **JMESPath query support** — filter and transform the diff tree in real time
- **Reorganize toggle** — nest related lists under their segments
- **Search filter** on paths
- **"Changes only" toggle** to hide unchanged nodes
- **Expand / Collapse all** and **breadcrumb navigation**
- **Change counter** in the header
- **Left/Right values** side-by-side with strikethrough for changed items

## Stack

- **Vanilla JS** — no frameworks, no dependencies
- **JMESPath.js** — embedded for query support
- **GitHub Pages** — zero-infrastructure deployment

## Usage

1. Open the [live site](https://jasontiw.github.io/ahu-json-comparer) or open `index.html` locally
2. Drop or paste your **Left** (baseline) and **Right** (new) JSON files
3. Browse the interactive diff tree

## Project Structure

```
jci-json-comparer/
├── index.html   # HTML structure
├── style.css    # Dark theme, tree view, drop zones, responsive layout
├── app.js       # JMESPath.js + all app logic
├── .gitignore
└── README.md
```

Three clean layers:
- **`index.html`** — document structure only
- **`style.css`** — all visual styling (dark theme, interactive tree, responsive)
- **`app.js`** — JSON loading, reorganizer, semantic matcher, differ, tree rendering, JMESPath queries

## License

Internal use.
