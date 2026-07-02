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
- **Reorganize toggle** — nest related lists under their segments for semantic context
- **Sort by geometry.x** — reorder segments by X position when reorganize is active (persisted in localStorage)
- **Search filter** on paths (debounced)
- **Skip fields** — exclude fields from diff comparison, supports wildcard patterns like `*_ID` (persisted in localStorage)
- **Change navigation** — next/previous buttons and keyboard shortcuts (`n` / `p`) to jump between diffs
- **Expand / Collapse all**
- **Breadcrumb navigation** — shows current path hierarchy with clickable segments
- **Left/Right values** side-by-side with strikethrough for changed items
- **Help modals** for Search, JMESPath, and Skip fields
- **Dark theme** with custom scrollbar styling

## Stack

- **Vite 5** — fast dev server and optimized production builds
- **Vanilla JS (ES Modules)** — no frameworks, 12 focused modules under `src/`
- **JMESPath.js** — runtime query engine
- **GitHub Pages** — zero-infrastructure deployment

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The dev server starts at `http://localhost:5173` by default.

## Usage

1. Open the [live site](https://jasontiw.github.io/ahu-json-comparer) or run `npm run dev` and open the local URL
2. Drop or paste your **Left** (baseline) and **Right** (new) JSON files
3. Browse the interactive diff tree
4. Toggle **Reorganize** for a semantically nested view
5. Use **Skip fields** to exclude volatile fields like `id`, `$type`, `*_ID`

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `n` | Next change |
| `p` | Previous change |
| `Escape` | Clear search / exclude input |

## Project Structure

```
jci-json-comparer/
├── src/
│   ├── main.js           # Entry point — wires all modules
│   ├── state.js          # Central state object
│   ├── diff-engine.js    # Recursive diff and change index
│   ├── tree-renderer.js  # Lazy DOM builder for the diff tree
│   ├── reorganizer.js    # AHU JSON structural reorganizer
│   ├── file-loader.js    # File drag-drop + paste handling
│   ├── change-nav.js     # Change navigation (next/prev, scroll, highlight)
│   ├── help-modal.js     # Help modals for Search / JMESPath / Skip fields
│   ├── scroll-sync.js    # Synchronised panel scrolling
│   ├── breadcrumb.js     # Sticky breadcrumb path hierarchy
│   ├── keyboard.js       # Keyboard shortcut registration
│   └── utils.js          # Utility functions (escape, exclude, format)
├── index.html            # Document structure
├── style.css             # Dark theme, tree view, drop zones, responsive
├── vite.config.js        # Vite configuration
├── package.json          # Dependencies and scripts
└── README.md
```

## License

Internal use.
