export type ValueChain =
  | "Sales"
  | "Underwriting"
  | "Claims"
  | "Policy Admin"
  | "Finance/Payments"
  | "Compliance";

export type AgentStatus = "Mock" | "Beta" | "Verified";

export type ConnectorType =
  | "Email"
  | "Storage"
  | "API"
  | "Database"
  | "Core System";

export type AgentCatalogItem = {
  id: string;
  name: string;
  summary: string;
  valueChains: ValueChain[];
  capabilities: string[];
  requiredConnectors: string[];
  outputs: string[];
  status: AgentStatus;
};

export type ConnectorCatalogItem = {
  id: string;
  name: string;
  type: ConnectorType;
  summary: string;
};

export type LogicCatalogItem = {
  id: string;
  name: string;
  summary: string;
  branchLabels?: string[];
};

export type StoredProcess = {
  id: string;
  name: string;
  valueChain: ValueChain;
  version: number;
  updatedAt: string;
  nodeCount: number;
  edgeCount: number;
  nodes: unknown[];
  edges: unknown[];
};

export type BuilderDraft = {
  id?: string;
  name: string;
  valueChain: ValueChain;
  version: number;
  nodes: unknown[];
  edges: unknown[];
};
