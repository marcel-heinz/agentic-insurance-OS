# Agentic Insurance OS (Frontend MVP)

Next.js frontend MVP for an insurance-agent marketplace plus a drag-and-drop process builder.

## Pages

- `/marketplace`: Browse insurance agents, filter by value chain/status, inspect details, and queue agents for the builder.
- `/builder`: Build flows by dragging `Agents`, `Data Sources`, and `Logic` blocks onto a canvas and connecting them.
- `/process-library`: View locally saved processes grouped by value chain and reopen them in the builder.

## MVP capabilities

- Catalog of mocked insurance agents (ingestion, settlement, underwriting, etc.).
- Connector catalog (Gmail, S3, APIs, databases, policy core, payments).
- React Flow canvas with custom nodes, branching labels, and connections.
- Right-side node/process configuration panel.
- Local save/load via `localStorage` (no backend business logic).

## Run

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.
