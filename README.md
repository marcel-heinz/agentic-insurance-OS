# GenTech Insurance OS

GenTech Insurance OS is building the operating system for insurance work.

The long-term vision is broad: a governed platform where insurers, MGAs, brokers, and partners can compose specialized AI workers into production processes.

The go-to-market wedge is narrow and deliberate:
**Submission Underwriting Intake OS**.

We start where insurers feel the pain every day: broker email intake, document chaos, missing-data loops, and slow handoffs to underwriters.

## Product Vision

Insurance teams should not need to rebuild brittle workflow automations for every product line.

GenTech Insurance OS aims to become a platform with four durable layers:

1. **Execution Layer**
A governed runtime for insurance agents and workers.

2. **Process Layer**
A visual process graph for composing intake, validation, routing, and handoff logic.

3. **Connector Layer**
Reusable integrations to mailboxes, storage, policy/AMS systems, rules engines, and downstream workbenches.

4. **Marketplace Layer**
A catalog of reusable, domain-specific workers and process modules.

## Why We Start with Submission Intake

Submission underwriting intake is the highest-frequency operational bottleneck:

- inbound applications arrive via unstructured email and attachments,
- key fields are incomplete or inconsistent,
- teams spend time chasing brokers for missing data,
- underwriters lose cycle time before actual risk judgment starts.

By solving intake first, we can prove tangible ROI quickly while building platform primitives that generalize later.

## Wedge Outcome (What Success Looks Like)

A carrier or MGA can run an intake flow that:

1. captures broker submissions from shared inboxes,
2. normalizes and extracts submission data,
3. flags missing or conflicting evidence,
4. drafts and sends targeted follow-up requests,
5. assembles a decision-ready packet for underwriter handoff.

## Why This Is Useful

### For underwriting teams
- faster triage and cleaner submission packets,
- fewer repetitive follow-up emails,
- clearer confidence and evidence trails.

### For operations leaders
- lower intake operating cost,
- measurable cycle-time improvements,
- standardized workflows across teams.

### For platform strategy
- builds the control plane foundation for future claims, servicing, and distribution workflows,
- creates reusable connectors and module standards,
- opens a path from product wedge to platform moat.

## Frontend MVP Scope (Current Repository)

This repo currently contains the **frontend MVP** with mocked data and local browser persistence.

### Included now
- `/marketplace` -> Intake Modules catalog + ROI panel
- `/builder` -> Underwriting Intake Builder + queue, detail drawer, follow-up generator, packet and audit panel
- `/process-library` -> Saved intake playbooks grouped by intake stage

### Included interactions
- drag-and-drop flow composition,
- logic branching and loop design,
- local save/load versioned playbooks,
- mock submission queue operations,
- mock audit timeline and packet generation surfaces.

### Not included yet
- backend execution runtime,
- tenant auth and organization boundaries,
- connector credential vault and token lifecycle,
- production messaging/integration workflows,
- policy governance and compliance enforcement.

## Product Narrative

### Today
Submission Underwriting Intake OS.

### Next
Governed agent execution + connector SDK.

### Later
Full GenTech Insurance OS across broader insurance value chains.

## Design Principles

- **Wedge-first**: solve one painful workflow deeply before expanding horizontally.
- **Explicit flows**: routing and control logic must be visible, editable, and versioned.
- **Source-grounded outputs**: extracted data should trace back to evidence.
- **Governed automation**: human checkpoints and operational controls are first-class.
- **Composable systems**: modules and connectors should be reusable across workflows.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.
