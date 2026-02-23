# Agentic Insurance OS

Agentic Insurance OS is a platform to design, connect, and operate insurance-specific AI workers across the full insurance value chain.

Instead of hardcoding brittle workflows, teams compose reusable agents (ingestion, underwriting, settlement, compliance, payments, etc.) into production processes using a visual process graph.

## Vision

Build the operating system for insurance work.

Our long-term vision is a marketplace plus orchestration platform where insurers, MGAs, brokers, TPAs, and startups can:

- publish and discover specialized insurance agents,
- connect those agents to real enterprise systems,
- compose them into reliable end-to-end processes,
- govern and monitor outcomes with clear operational controls.

The goal is not a single "all-knowing" model. The goal is a coordinated network of purpose-built workers that each own a clear task and can be upgraded independently.

## What We Aim To Do

1. Productize insurance work as modular agents
Create a standard way to package tasks like OCR intake, policy checks, fraud signals, claims triage, settlement, and payments.

2. Turn process design into composition, not coding
Allow teams to drag, connect, branch, and iterate workflows in a process builder without rebuilding integrations from scratch each time.

3. Make connectivity first-class
Every agent should be connectable to systems like Gmail, S3, policy admin, claims platforms, payment rails, data warehouses, and APIs.

4. Map automation to the insurance value chain
Processes are grouped by real business domains: Sales, Underwriting, Claims, Policy Admin, Finance/Payments, Compliance.

5. Enable safe autonomy
Decisions, routing logic, and human-in-the-loop checkpoints should be explicit and configurable, not hidden in prompts.

## Product Goal

Create a tangible, measurable platform where teams can launch and maintain insurance workflows faster, with better quality and lower operational cost.

A successful product state means:

- Teams can assemble a new process in hours, not months.
- Agents are reusable across multiple lines of business.
- Process logic is visible, auditable, and versioned.
- Data source connections are standardized.
- Human review is inserted where confidence is low or regulation requires it.

## Why This Is Useful

Insurance operations are fragmented across systems, documents, and manual handoffs. Most organizations face the same issues:

- high document volume and unstructured intake,
- repetitive decision tasks with inconsistent quality,
- slow handoffs between teams,
- expensive custom integrations per workflow,
- poor transparency into why a process succeeded or failed.

Agentic Insurance OS addresses this by combining:

- a domain marketplace (what can be done),
- a process builder (how tasks are orchestrated),
- connectors (where data comes from and goes),
- process library and versioning (how workflows evolve safely).

## Example Outcome

Broker intake flow:

1. Gmail Subscription Agent detects new applications.
2. Ingestion Agent extracts and classifies information.
3. Validation Decision checks completeness and consistency.
4. If incomplete, Broker Feedback Agent requests missing data and loops back.
5. If complete, Coverage or Underwriting Agent continues to quote path.

This turns a manual email-driven workflow into an explicit, reusable, and improvable process.

## Who This Serves

- Carriers modernizing underwriting and claims operations.
- MGAs scaling specialty workflows without large ops headcount.
- Brokers and distribution teams accelerating quote turnaround.
- Insurtech builders publishing vertical agents into a marketplace.
- Internal innovation teams standardizing agent orchestration patterns.

## Product Surfaces

- Marketplace
Discover agents by capability, value chain, and readiness status.

- Process Builder
Compose workflows with agents, connectors, and logic nodes.

- Process Library
Store, version, and reopen flows grouped by insurance domain.

- Node Configuration
Define per-node metadata, tags, routing labels, and process context.

## Current Scope (Frontend MVP)

This repository currently contains the frontend MVP with mocked data and local persistence:

- `/marketplace`
- `/builder`
- `/process-library`

Included today:

- agent catalog,
- connector catalog,
- logic nodes,
- drag-and-drop flow composition,
- local save/load in browser storage.

Not included yet:

- backend orchestration runtime,
- auth and tenant isolation,
- execution logs and observability,
- production connector auth flows,
- policy and compliance controls.

## Roadmap Direction

1. Platform foundation
API, auth, organizations, workspace and process persistence.

2. Runtime and execution
Background orchestration, retries, queueing, human tasks, and audit trails.

3. Connector framework
Secure credentials, connector SDK, and deployment-safe integration lifecycle.

4. Agent lifecycle
Publishing standards, testing harnesses, quality gates, and version compatibility.

5. Governance
Policy controls, approval workflows, explainability artifacts, and compliance reporting.

## Design Principles

- Domain-first: Insurance workflows and terminology are first-class.
- Explicit over implicit: Routing and decisions are visible in the graph.
- Composable architecture: Agents and connectors are reusable building blocks.
- Human + AI collaboration: Human checkpoints are native, not bolted on.
- Operational rigor: Versioning, auditability, and reliability are required, not optional.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.
