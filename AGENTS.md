# AGENTS.md

## TypeScript guardrails

- Do not assign a nullable `map()` result directly to a strongly typed array (for example `ProcessFlowNode[]`).
- If items may be skipped, use `reduce<T[]>` (or an explicit typed helper) and push only valid items.
- For React Flow nodes, create an explicitly typed object first (for example `const node: ProcessFlowNode = { ... }`) before adding it to collections.

## Pre-push checks

- Run `npm run build` before pushing changes that touch TypeScript types in UI state logic.
- If local dependency install is not available, call that out in the PR/commit notes and keep type transformations explicit.

## Next.js App Router guardrails

- If a client component uses `useSearchParams()` in a route that can be prerendered, wrap that client tree in `Suspense` from the page layer.
- Prefer passing `searchParams` from the server page component into clients when possible to reduce CSR bailout issues.
- Do not mount a `useSearchParams()` client component directly in `app/**/page.tsx` without a `Suspense` boundary.

## Vercel build safety checklist

- For any route using `next/navigation` client hooks (`useSearchParams`, `usePathname`, `useRouter`), review whether the page is statically prerendered.
- If prerendered, add `Suspense` at the page boundary with a small fallback UI.
- Before push, run `npm run build` and confirm no `missing-suspense-with-csr-bailout` errors.
