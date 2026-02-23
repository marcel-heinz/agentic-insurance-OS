import type {
  AgentCatalogItem,
  ConnectorCatalogItem,
  LogicCatalogItem,
  ValueChain
} from "@/lib/types";

export const valueChainOrder: ValueChain[] = [
  "Inbox Intake",
  "Document Parsing",
  "Submission Structuring",
  "Validation",
  "Broker Follow-Up",
  "Underwriter Handoff"
];

export const valueChainAccent: Record<ValueChain, string> = {
  "Inbox Intake": "#3D6B8A",
  "Document Parsing": "#3B8C7A",
  "Submission Structuring": "#2E7CA0",
  Validation: "#A26C39",
  "Broker Follow-Up": "#7F5D9A",
  "Underwriter Handoff": "#244D6E"
};

export const agentCatalog: AgentCatalogItem[] = [
  {
    id: "email-intake-listener",
    name: "Email Intake Listener",
    summary: "Monitors broker inboxes and opens a submission case with thread context.",
    valueChains: ["Inbox Intake"],
    capabilities: [
      "Mailbox watch",
      "Broker thread detection",
      "Submission case creation"
    ],
    requiredConnectors: ["gmail", "outlook", "workflow-queue"],
    outputs: ["Intake case", "Document pointers", "SLA timestamp"],
    status: "Production"
  },
  {
    id: "attachment-normalizer",
    name: "Attachment Normalizer",
    summary: "Converts inbound PDFs, spreadsheets, and scans into normalized document bundles.",
    valueChains: ["Document Parsing"],
    capabilities: ["File normalization", "Versioning", "Attachment indexing"],
    requiredConnectors: ["s3-bucket", "sharepoint", "workflow-queue"],
    outputs: ["Normalized files", "Document inventory"],
    status: "Production"
  },
  {
    id: "submission-extractor",
    name: "Submission Extractor",
    summary: "Extracts ACORD and supplemental fields into a structured submission object.",
    valueChains: ["Submission Structuring"],
    capabilities: [
      "OCR",
      "Table extraction",
      "Canonical submission graph mapping"
    ],
    requiredConnectors: ["s3-bucket", "acord-parser-api", "webhook-api"],
    outputs: ["Submission JSON", "Field confidence map"],
    status: "Pilot"
  },
  {
    id: "risk-enrichment-worker",
    name: "Risk Enrichment Worker",
    summary: "Adds third-party firmographics and risk context before triage.",
    valueChains: ["Submission Structuring", "Validation"],
    capabilities: ["Registry lookup", "Address enrichment", "Entity matching"],
    requiredConnectors: ["company-registry-api", "loss-run-db"],
    outputs: ["Enrichment profile", "Risk hints"],
    status: "Pilot"
  },
  {
    id: "completeness-checker",
    name: "Completeness Checker",
    summary: "Validates required fields and flags missing or conflicting evidence.",
    valueChains: ["Validation"],
    capabilities: ["Required-field checks", "Consistency tests", "Confidence gating"],
    requiredConnectors: ["rules-engine-api", "ams-api"],
    outputs: ["Completeness score", "Missing info checklist"],
    status: "Production"
  },
  {
    id: "broker-loop-agent",
    name: "Broker Loop Agent",
    summary: "Drafts targeted broker follow-ups and tracks outstanding requirements.",
    valueChains: ["Broker Follow-Up"],
    capabilities: ["Email drafting", "Follow-up reminders", "SLA tracking"],
    requiredConnectors: ["gmail", "outlook", "workflow-queue"],
    outputs: ["Follow-up draft", "Open requirement list"],
    status: "Pilot"
  },
  {
    id: "appetite-precheck-agent",
    name: "Appetite Pre-Check Agent",
    summary: "Runs appetite and eligibility checks before underwriter review.",
    valueChains: ["Validation", "Underwriter Handoff"],
    capabilities: ["Appetite fit", "Rule lookups", "Decline routing"],
    requiredConnectors: ["rules-engine-api", "ams-api"],
    outputs: ["Appetite decision", "Referral recommendation"],
    status: "Production"
  },
  {
    id: "underwriter-packet-assembler",
    name: "Underwriter Packet Assembler",
    summary: "Builds a decision-ready packet with summary, flags, and source evidence links.",
    valueChains: ["Underwriter Handoff"],
    capabilities: ["Packet generation", "Risk summary", "Evidence linking"],
    requiredConnectors: ["underwriter-workbench-api", "s3-bucket"],
    outputs: ["Underwriter packet", "Referral brief"],
    status: "Pilot"
  },
  {
    id: "referral-routing-agent",
    name: "Referral Routing Agent",
    summary: "Routes complex or low-confidence submissions to the right underwriting queue.",
    valueChains: ["Underwriter Handoff"],
    capabilities: ["Queue routing", "Skill-based assignment", "Priority scoring"],
    requiredConnectors: ["workflow-queue", "underwriter-workbench-api"],
    outputs: ["Queue assignment", "Escalation reason"],
    status: "Design"
  }
];

export const connectorCatalog: ConnectorCatalogItem[] = [
  {
    id: "gmail",
    name: "Gmail",
    type: "Email",
    summary: "Read and send broker communication threads."
  },
  {
    id: "outlook",
    name: "Microsoft Outlook",
    type: "Email",
    summary: "Ingest shared underwriting mailboxes and deliver follow-up drafts."
  },
  {
    id: "sharepoint",
    name: "SharePoint",
    type: "Storage",
    summary: "Store broker packets and intake artifacts with version history."
  },
  {
    id: "s3-bucket",
    name: "S3 Bucket",
    type: "Storage",
    summary: "Persist raw and normalized submission documents."
  },
  {
    id: "acord-parser-api",
    name: "ACORD Parser API",
    type: "API",
    summary: "Parse and map standard insurance application fields."
  },
  {
    id: "ams-api",
    name: "Agency Management API",
    type: "Core System",
    summary: "Check account history, prior submissions, and broker metadata."
  },
  {
    id: "rules-engine-api",
    name: "Rules Engine API",
    type: "API",
    summary: "Evaluate appetite and required-data policies per line of business."
  },
  {
    id: "loss-run-db",
    name: "Loss Run Database",
    type: "Database",
    summary: "Lookup historical claims patterns and severity signals."
  },
  {
    id: "company-registry-api",
    name: "Company Registry API",
    type: "API",
    summary: "Enrich legal entity and business profile information."
  },
  {
    id: "workflow-queue",
    name: "Workflow Queue",
    type: "Workflow",
    summary: "Track submission states and task ownership across teams."
  },
  {
    id: "underwriter-workbench-api",
    name: "Underwriter Workbench API",
    type: "Core System",
    summary: "Publish decision-ready packets into underwriter work queues."
  },
  {
    id: "webhook-api",
    name: "Webhook API",
    type: "API",
    summary: "Send downstream events for orchestration and analytics."
  }
];

export const logicCatalog: LogicCatalogItem[] = [
  {
    id: "completeness-gate",
    name: "Completeness Gate",
    summary: "Route based on required-field completeness by product.",
    branchLabels: ["Complete", "Missing Info", "Conflicting Data"]
  },
  {
    id: "confidence-threshold",
    name: "Confidence Threshold",
    summary: "Escalate low-confidence extractions for manual confirmation.",
    branchLabels: ["Auto-accept", "Review", "Reject"]
  },
  {
    id: "broker-loop-router",
    name: "Broker Loop Router",
    summary: "Determine follow-up cadence and reminder sequence.",
    branchLabels: ["Send Follow-Up", "Wait", "Escalate Broker"]
  },
  {
    id: "appetite-router",
    name: "Appetite Router",
    summary: "Direct submissions to quote path, referral, or decline path.",
    branchLabels: ["Quote", "Refer", "Decline"]
  },
  {
    id: "human-review",
    name: "Human Review",
    summary: "Pause execution and hand over to underwriting operations.",
    branchLabels: ["Approved", "Rework", "Closed"]
  }
];
