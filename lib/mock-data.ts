import type {
  AgentCatalogItem,
  ConnectorCatalogItem,
  LogicCatalogItem,
  ValueChain
} from "@/lib/types";

export const valueChainOrder: ValueChain[] = [
  "Sales",
  "Underwriting",
  "Claims",
  "Policy Admin",
  "Finance/Payments",
  "Compliance"
];

export const valueChainAccent: Record<ValueChain, string> = {
  Sales: "#2A7A9E",
  Underwriting: "#7056A6",
  Claims: "#B05A31",
  "Policy Admin": "#2B8F6E",
  "Finance/Payments": "#8C4F9D",
  Compliance: "#6D7788"
};

export const agentCatalog: AgentCatalogItem[] = [
  {
    id: "gmail-subscription-agent",
    name: "Gmail Subscription Agent",
    summary: "Monitors broker inboxes and creates policy-application events.",
    valueChains: ["Sales"],
    capabilities: [
      "Mailbox watch",
      "Attachment detection",
      "Policy-intake eventing"
    ],
    requiredConnectors: ["gmail", "webhook-api"],
    outputs: ["Application event", "Document links"],
    status: "Beta"
  },
  {
    id: "ingestion-agent",
    name: "Ingestion Agent",
    summary: "Runs OCR, classification, and key-value extraction on submissions.",
    valueChains: ["Sales", "Underwriting"],
    capabilities: ["OCR", "Document classification", "Tax data extraction"],
    requiredConnectors: ["s3-bucket", "webhook-api"],
    outputs: ["Normalized submission JSON"],
    status: "Verified"
  },
  {
    id: "application-truth-check-agent",
    name: "Application Truth Check Agent",
    summary: "Validates consistency and flags missing evidence before underwriting.",
    valueChains: ["Underwriting", "Compliance"],
    capabilities: ["Cross-field checks", "Rule validation", "Fraud signals"],
    requiredConnectors: ["policy-core", "risk-db"],
    outputs: ["Validation report", "Decision hints"],
    status: "Mock"
  },
  {
    id: "broker-feedback-agent",
    name: "Broker Feedback Agent",
    summary: "Sends structured requests back to brokers for missing information.",
    valueChains: ["Sales"],
    capabilities: ["Email drafting", "Task generation", "SLA tracking"],
    requiredConnectors: ["gmail", "webhook-api"],
    outputs: ["Feedback thread", "Resubmission task"],
    status: "Beta"
  },
  {
    id: "coverage-check-agent",
    name: "Coverage Check Agent",
    summary: "Matches requests to product rules and coverage eligibility constraints.",
    valueChains: ["Underwriting", "Compliance"],
    capabilities: [
      "Coverage mapping",
      "Exclusion checks",
      "Policy fit scoring"
    ],
    requiredConnectors: ["policy-core", "product-rules-api"],
    outputs: ["Coverage recommendation"],
    status: "Verified"
  },
  {
    id: "underwriting-agent",
    name: "Underwriting Agent",
    summary: "Packages risk context and produces quote recommendations.",
    valueChains: ["Underwriting", "Sales"],
    capabilities: ["Risk synthesis", "Pricing hints", "Quote packet generation"],
    requiredConnectors: ["policy-core", "risk-db", "snowflake"],
    outputs: ["Quote proposal", "Risk summary"],
    status: "Mock"
  },
  {
    id: "claim-settlement-agent",
    name: "Claim Settlement Agent",
    summary: "Coordinates claim resolution flow and settlement recommendations.",
    valueChains: ["Claims"],
    capabilities: ["Liability assessment", "Reserve suggestions", "Settlement path"],
    requiredConnectors: ["claims-db", "policy-core"],
    outputs: ["Settlement package"],
    status: "Beta"
  },
  {
    id: "payment-orchestration-agent",
    name: "Payment Orchestration Agent",
    summary: "Triggers payouts and reconciles payment events back into claims.",
    valueChains: ["Claims", "Finance/Payments"],
    capabilities: ["Payout orchestration", "Ledger updates", "Payment retries"],
    requiredConnectors: ["stripe", "erp-api"],
    outputs: ["Payment event", "Reconciliation status"],
    status: "Verified"
  },
  {
    id: "policy-issuance-agent",
    name: "Policy Issuance Agent",
    summary: "Generates policy artifacts and pushes records to policy admin.",
    valueChains: ["Policy Admin", "Sales"],
    capabilities: ["Document generation", "Policy numbering", "Activation checks"],
    requiredConnectors: ["policy-core", "s3-bucket"],
    outputs: ["Issued policy docs"],
    status: "Mock"
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
    id: "s3-bucket",
    name: "S3 Bucket",
    type: "Storage",
    summary: "Store raw and processed documents."
  },
  {
    id: "snowflake",
    name: "Snowflake",
    type: "Database",
    summary: "Query actuarial and historical policy datasets."
  },
  {
    id: "claims-db",
    name: "Claims DB",
    type: "Database",
    summary: "Access active claim records and case status."
  },
  {
    id: "policy-core",
    name: "Policy Core",
    type: "Core System",
    summary: "Policy administration API and contract source of truth."
  },
  {
    id: "webhook-api",
    name: "Webhook API",
    type: "API",
    summary: "Push events into internal orchestration systems."
  },
  {
    id: "stripe",
    name: "Stripe",
    type: "API",
    summary: "Issue and reconcile claim-related payments."
  },
  {
    id: "erp-api",
    name: "ERP API",
    type: "API",
    summary: "Send accounting entries into finance systems."
  },
  {
    id: "product-rules-api",
    name: "Product Rules API",
    type: "API",
    summary: "Resolve eligibility and limit rules per line of business."
  },
  {
    id: "risk-db",
    name: "Risk DB",
    type: "Database",
    summary: "Fraud signals and historical risk patterns."
  }
];

export const logicCatalog: LogicCatalogItem[] = [
  {
    id: "decision-table",
    name: "Decision Table",
    summary: "Route based on deterministic conditions.",
    branchLabels: ["Pass", "Needs Info", "Reject"]
  },
  {
    id: "dynamic-router",
    name: "Dynamic Router",
    summary: "LLM-assisted selection of the next best agent.",
    branchLabels: ["Primary Path", "Escalate", "Fallback"]
  },
  {
    id: "human-review",
    name: "Human Review",
    summary: "Pause automation and hand over to an operator.",
    branchLabels: ["Approved", "Rework"]
  },
  {
    id: "wait-timer",
    name: "Wait / SLA Timer",
    summary: "Add delay windows and timeout branches.",
    branchLabels: ["Timeout", "Continue"]
  }
];
