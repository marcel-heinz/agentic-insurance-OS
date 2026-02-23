# Process Builder (Next.js)

Lean drag-and-drop process editor built with Next.js + React Flow.

## Why this structure

- **React Flow** handles node movement, zoom/pan, and edge connections reliably.
- **Palette + canvas split** keeps the UI focused: choose a block, drop it, connect only when needed.
- **Minimal node model** (`label`, `caption`, `variant`) makes it easy to extend node types later.

## Features

- Drag node templates (`Start`, `Task`, `Decision`, `End`) onto a canvas.
- Connect nodes using top/bottom handles.
- Move, pan, zoom, and inspect the flow with controls + minimap.
- Responsive layout for desktop and mobile.

## Run

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.
