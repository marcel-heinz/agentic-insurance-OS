# AGENTS.md

## TypeScript guardrails

- Do not assign a nullable `map()` result directly to a strongly typed array (for example `ProcessFlowNode[]`).
- If items may be skipped, use `reduce<T[]>` (or an explicit typed helper) and push only valid items.
- For React Flow nodes, create an explicitly typed object first (for example `const node: ProcessFlowNode = { ... }`) before adding it to collections.

## Pre-push checks

- Run `npm run build` before pushing changes that touch TypeScript types in UI state logic.
- If local dependency install is not available, call that out in the PR/commit notes and keep type transformations explicit.
