"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DragEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addEdge,
  Background,
  Connection,
  Controls,
  Edge,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow
} from "@xyflow/react";
import {
  agentCatalog,
  connectorCatalog,
  logicCatalog,
  valueChainAccent,
  valueChainOrder
} from "@/lib/mock-data";
import {
  consumeMarketplaceAgentQueue,
  getStoredProcessById,
  loadBuilderDraft,
  saveBuilderDraft,
  upsertStoredProcess
} from "@/lib/storage";
import type { BuilderDraft, StoredProcess, ValueChain } from "@/lib/types";
import {
  ProcessFlowNode,
  ProcessNode,
  ProcessNodeData
} from "@/components/process-builder/process-node";

type PaletteTab = "agents" | "data" | "logic";

type PaletteTemplate = {
  templateId: string;
  label: string;
  subtitle: string;
  kind: ProcessNodeData["kind"];
  accent: string;
  tags: string[];
  status?: string;
  branchLabels?: string[];
};

type SubmissionStatus =
  | "New Intake"
  | "Needs Data"
  | "Waiting on Broker"
  | "Ready for Underwriter";

type SubmissionDocument = {
  name: string;
  kind: string;
  pages: number;
};

type SubmissionField = {
  label: string;
  value: string;
  confidence: number;
  source: string;
};

type SubmissionRecord = {
  id: string;
  broker: string;
  insured: string;
  product: string;
  receivedAt: string;
  status: SubmissionStatus;
  appetiteSignal: "In Appetite" | "Borderline" | "Out of Appetite";
  premiumHint: string;
  documents: SubmissionDocument[];
  missingFields: string[];
  extractedFields: SubmissionField[];
  riskFlags: string[];
  nextAction: string;
  followUpCount: number;
};

type AuditEntry = {
  id: string;
  timestamp: string;
  actor: string;
  event: string;
};

const edgeColor = "#406785";

const submissionQueueSeed: SubmissionRecord[] = [
  {
    id: "SUB-24031",
    broker: "Northline Brokers",
    insured: "Atlas Cold Storage LLC",
    product: "Commercial Property",
    receivedAt: "2026-02-23T10:17:00.000Z",
    status: "Needs Data",
    appetiteSignal: "In Appetite",
    premiumHint: "$184k - $212k",
    documents: [
      { name: "Acord125.pdf", kind: "ACORD 125", pages: 8 },
      { name: "SOV_Q1.xlsx", kind: "Statement of Values", pages: 4 },
      { name: "LossRuns_5yr.pdf", kind: "Loss Run", pages: 12 }
    ],
    missingFields: ["Roof update year", "Fire suppression certification"],
    extractedFields: [
      {
        label: "TIV",
        value: "$46,700,000",
        confidence: 0.96,
        source: "SOV_Q1.xlsx > row 14"
      },
      {
        label: "Primary occupancy",
        value: "Cold storage",
        confidence: 0.92,
        source: "Acord125.pdf > page 3"
      },
      {
        label: "Last major loss",
        value: "Water damage - 2022",
        confidence: 0.81,
        source: "LossRuns_5yr.pdf > page 2"
      }
    ],
    riskFlags: ["High insured value concentration", "Prior water damage"],
    nextAction: "Send targeted broker follow-up request",
    followUpCount: 1
  },
  {
    id: "SUB-24029",
    broker: "Cityline Risk Partners",
    insured: "Meridian Foods Group",
    product: "General Liability",
    receivedAt: "2026-02-23T08:42:00.000Z",
    status: "Ready for Underwriter",
    appetiteSignal: "In Appetite",
    premiumHint: "$92k - $107k",
    documents: [
      { name: "GL_App.pdf", kind: "Application", pages: 11 },
      { name: "Operations_Schedule.pdf", kind: "Supplemental", pages: 3 }
    ],
    missingFields: [],
    extractedFields: [
      {
        label: "Annual revenue",
        value: "$31,200,000",
        confidence: 0.98,
        source: "GL_App.pdf > page 2"
      },
      {
        label: "Payroll",
        value: "$8,700,000",
        confidence: 0.94,
        source: "GL_App.pdf > page 5"
      },
      {
        label: "Operations class",
        value: "Food processing",
        confidence: 0.95,
        source: "Operations_Schedule.pdf > page 1"
      }
    ],
    riskFlags: ["Multi-state operations"],
    nextAction: "Queue packet for senior underwriter approval",
    followUpCount: 0
  },
  {
    id: "SUB-24027",
    broker: "Harbor Specialty",
    insured: "Trident Fabrication",
    product: "Commercial Auto",
    receivedAt: "2026-02-22T15:11:00.000Z",
    status: "Waiting on Broker",
    appetiteSignal: "Borderline",
    premiumHint: "$244k - $290k",
    documents: [
      { name: "Fleet_List.xlsx", kind: "Fleet schedule", pages: 5 },
      { name: "DriverRoster.pdf", kind: "Driver roster", pages: 9 }
    ],
    missingFields: ["Telematics score export", "DOT violations summary"],
    extractedFields: [
      {
        label: "Vehicle count",
        value: "74",
        confidence: 0.99,
        source: "Fleet_List.xlsx > row 3"
      },
      {
        label: "Primary radius",
        value: "Regional",
        confidence: 0.87,
        source: "DriverRoster.pdf > page 2"
      },
      {
        label: "Power units > 10 years",
        value: "13",
        confidence: 0.89,
        source: "Fleet_List.xlsx > row 27"
      }
    ],
    riskFlags: ["Aging fleet profile", "Borderline appetite score"],
    nextAction: "Await broker attachments before appetite escalation",
    followUpCount: 2
  },
  {
    id: "SUB-24026",
    broker: "Apex Program Partners",
    insured: "Summit Health Clinics",
    product: "Professional Liability",
    receivedAt: "2026-02-22T13:03:00.000Z",
    status: "New Intake",
    appetiteSignal: "In Appetite",
    premiumHint: "$128k - $154k",
    documents: [
      { name: "Application.pdf", kind: "Application", pages: 10 },
      { name: "Claims_History.pdf", kind: "Claims history", pages: 6 }
    ],
    missingFields: ["Retro date confirmation"],
    extractedFields: [
      {
        label: "Provider count",
        value: "19",
        confidence: 0.91,
        source: "Application.pdf > page 4"
      },
      {
        label: "Prior acts requested",
        value: "Yes",
        confidence: 0.82,
        source: "Application.pdf > page 7"
      },
      {
        label: "Open claims",
        value: "1",
        confidence: 0.9,
        source: "Claims_History.pdf > page 1"
      }
    ],
    riskFlags: ["Retro date pending"],
    nextAction: "Run completeness gate and package for referral",
    followUpCount: 0
  }
];

const initialAudit: AuditEntry[] = [
  {
    id: "audit-1",
    timestamp: "2026-02-23T10:19:00.000Z",
    actor: "Intake OS",
    event: "SUB-24031 extracted to canonical submission object"
  },
  {
    id: "audit-2",
    timestamp: "2026-02-23T10:21:00.000Z",
    actor: "Completeness Checker",
    event: "SUB-24031 flagged 2 missing fields"
  },
  {
    id: "audit-3",
    timestamp: "2026-02-23T10:24:00.000Z",
    actor: "Broker Loop Agent",
    event: "Drafted follow-up for SUB-24031"
  }
];

function nextNodeCounter(nodes: ProcessFlowNode[]) {
  const highest = nodes.reduce((max, node) => {
    const match = node.id.match(/node-(\d+)/);
    if (!match) {
      return max;
    }

    return Math.max(max, Number(match[1]));
  }, 0);

  return highest + 1;
}

function parseCommaSeparated(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toClassName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function averageConfidence(fields: SubmissionField[]) {
  if (fields.length === 0) {
    return 0;
  }

  const total = fields.reduce((sum, field) => sum + field.confidence, 0);
  return total / fields.length;
}

function buildFollowUpDraft(submission: SubmissionRecord) {
  if (submission.missingFields.length === 0) {
    return `Hi ${submission.broker},\n\nThank you. We currently have all required items for ${submission.id}. We are moving the submission to underwriter review and will share updates shortly.\n\nBest,\nGenTech Intake Ops`;
  }

  const numbered = submission.missingFields
    .map((field, index) => `${index + 1}. ${field}`)
    .join("\n");

  return `Hi ${submission.broker},\n\nWe completed intake for ${submission.id} (${submission.insured}) and still need the items below to continue underwriting:\n${numbered}\n\nPlease share these in this thread and keep original file formats if possible.\n\nBest,\nGenTech Intake Ops`;
}

function createUnderwritingTemplate() {
  const nodes: ProcessFlowNode[] = [
    {
      id: "node-1",
      type: "process",
      position: { x: 70, y: 180 },
      data: {
        label: "Email Intake Listener",
        subtitle: "Detect new broker submissions in shared underwriting mailbox",
        kind: "agent",
        accent: valueChainAccent["Inbox Intake"],
        tags: ["Inbox Intake", "Broker thread"],
        status: "Production"
      }
    },
    {
      id: "node-2",
      type: "process",
      position: { x: 350, y: 180 },
      data: {
        label: "Attachment Normalizer",
        subtitle: "Normalize PDFs and spreadsheets into a canonical bundle",
        kind: "agent",
        accent: valueChainAccent["Document Parsing"],
        tags: ["Document Parsing"],
        status: "Production"
      }
    },
    {
      id: "node-3",
      type: "process",
      position: { x: 640, y: 180 },
      data: {
        label: "Submission Extractor",
        subtitle: "Extract ACORD and supplemental fields into submission graph",
        kind: "agent",
        accent: valueChainAccent["Submission Structuring"],
        tags: ["Submission Structuring"],
        status: "Pilot"
      }
    },
    {
      id: "node-4",
      type: "process",
      position: { x: 935, y: 180 },
      data: {
        label: "Completeness Gate",
        subtitle: "Route complete, missing, and conflicting data paths",
        kind: "logic",
        accent: valueChainAccent.Validation,
        tags: ["Validation"],
        branchLabels: ["Complete", "Missing Info", "Conflict"]
      }
    },
    {
      id: "node-5",
      type: "process",
      position: { x: 1230, y: 100 },
      data: {
        label: "Appetite Pre-Check Agent",
        subtitle: "Evaluate appetite and eligibility before handoff",
        kind: "agent",
        accent: valueChainAccent.Validation,
        tags: ["Validation", "Underwriter Handoff"],
        status: "Production"
      }
    },
    {
      id: "node-6",
      type: "process",
      position: { x: 1230, y: 265 },
      data: {
        label: "Broker Loop Agent",
        subtitle: "Request missing details and re-enter intake flow",
        kind: "agent",
        accent: valueChainAccent["Broker Follow-Up"],
        tags: ["Broker Follow-Up"],
        status: "Pilot"
      }
    },
    {
      id: "node-7",
      type: "process",
      position: { x: 1525, y: 100 },
      data: {
        label: "Underwriter Packet Assembler",
        subtitle: "Publish decision-ready packet with source-grounded evidence",
        kind: "agent",
        accent: valueChainAccent["Underwriter Handoff"],
        tags: ["Underwriter Handoff"],
        status: "Pilot"
      }
    }
  ];

  const edges: Edge[] = [
    {
      id: "edge-1-2",
      source: "node-1",
      target: "node-2",
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
      style: { stroke: edgeColor, strokeWidth: 1.8 },
      label: "New submission"
    },
    {
      id: "edge-2-3",
      source: "node-2",
      target: "node-3",
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
      style: { stroke: edgeColor, strokeWidth: 1.8 },
      label: "Normalized bundle"
    },
    {
      id: "edge-3-4",
      source: "node-3",
      target: "node-4",
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
      style: { stroke: edgeColor, strokeWidth: 1.8 }
    },
    {
      id: "edge-4-5",
      source: "node-4",
      target: "node-5",
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
      style: { stroke: edgeColor, strokeWidth: 1.8 },
      label: "Complete"
    },
    {
      id: "edge-4-6",
      source: "node-4",
      target: "node-6",
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
      style: { stroke: edgeColor, strokeWidth: 1.8 },
      label: "Missing info"
    },
    {
      id: "edge-6-2",
      source: "node-6",
      target: "node-2",
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
      style: { stroke: edgeColor, strokeWidth: 1.8 },
      label: "Broker response"
    },
    {
      id: "edge-5-7",
      source: "node-5",
      target: "node-7",
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
      style: { stroke: edgeColor, strokeWidth: 1.8 },
      label: "Ready for UW"
    }
  ];

  return { nodes, edges };
}

function BuilderWorkbench() {
  const searchParams = useSearchParams();
  const initialTemplate = useMemo(() => createUnderwritingTemplate(), []);

  const [nodes, setNodes, onNodesChange] = useNodesState<ProcessFlowNode>(
    initialTemplate.nodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialTemplate.edges);

  const [activeTab, setActiveTab] = useState<PaletteTab>("agents");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [processId, setProcessId] = useState<string | null>(null);
  const [processName, setProcessName] = useState(
    "Underwriting Inbox Autopilot - Commercial Property"
  );
  const [valueChain, setValueChain] = useState<ValueChain>("Submission Structuring");
  const [version, setVersion] = useState(1);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const [submissionQueue, setSubmissionQueue] = useState<SubmissionRecord[]>(
    submissionQueueSeed
  );
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(
    submissionQueueSeed[0]?.id ?? ""
  );
  const [followUpDraft, setFollowUpDraft] = useState(
    buildFollowUpDraft(submissionQueueSeed[0])
  );
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>(initialAudit);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const nodeId = useRef(nextNodeCounter(initialTemplate.nodes));

  const { screenToFlowPosition } = useReactFlow<ProcessFlowNode, Edge>();

  const nodeTypes = useMemo(
    () => ({
      process: ProcessNode
    }),
    []
  );

  const agentTemplates = useMemo<PaletteTemplate[]>(() => {
    return agentCatalog.map((agent) => ({
      templateId: agent.id,
      label: agent.name,
      subtitle: agent.summary,
      kind: "agent",
      accent: valueChainAccent[agent.valueChains[0]],
      tags: agent.valueChains,
      status: agent.status
    }));
  }, []);

  const dataTemplates = useMemo<PaletteTemplate[]>(() => {
    return connectorCatalog.map((connector) => ({
      templateId: connector.id,
      label: connector.name,
      subtitle: connector.summary,
      kind: "data",
      accent: "#2D8A80",
      tags: [connector.type]
    }));
  }, []);

  const logicTemplates = useMemo<PaletteTemplate[]>(() => {
    return logicCatalog.map((logic) => ({
      templateId: logic.id,
      label: logic.name,
      subtitle: logic.summary,
      kind: "logic",
      accent: "#A26C39",
      tags: ["Control"],
      branchLabels: logic.branchLabels
    }));
  }, []);

  const templatesByTab = useMemo(
    () => ({
      agents: agentTemplates,
      data: dataTemplates,
      logic: logicTemplates
    }),
    [agentTemplates, dataTemplates, logicTemplates]
  );

  const agentTemplateById = useMemo(() => {
    return new Map(agentTemplates.map((template) => [template.templateId, template]));
  }, [agentTemplates]);

  const selectedNode = useMemo(() => {
    return nodes.find((node) => node.id === selectedNodeId) ?? null;
  }, [nodes, selectedNodeId]);

  const selectedSubmission = useMemo(() => {
    return submissionQueue.find((item) => item.id === selectedSubmissionId) ?? null;
  }, [submissionQueue, selectedSubmissionId]);

  const queueStats = useMemo(() => {
    const ready = submissionQueue.filter(
      (item) => item.status === "Ready for Underwriter"
    ).length;
    const needsData = submissionQueue.filter((item) => item.status === "Needs Data").length;
    const waiting = submissionQueue.filter(
      (item) => item.status === "Waiting on Broker"
    ).length;

    const outstanding = submissionQueue.reduce(
      (sum, item) => sum + item.missingFields.length,
      0
    );

    return { ready, needsData, waiting, outstanding };
  }, [submissionQueue]);

  const pushAudit = useCallback((event: string, actor = "Intake OS") => {
    setAuditEntries((current) => [
      {
        id: `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        timestamp: new Date().toISOString(),
        actor,
        event
      },
      ...current
    ]);
  }, []);

  useEffect(() => {
    if (isReady) {
      return;
    }

    const loadFromDraft = (draft: BuilderDraft) => {
      const draftNodes = draft.nodes as ProcessFlowNode[];
      const draftEdges = draft.edges as Edge[];

      if (draftNodes.length > 0) {
        setNodes(draftNodes);
        nodeId.current = nextNodeCounter(draftNodes);
      }

      setEdges(draftEdges);
      setProcessName(draft.name);
      setValueChain(draft.valueChain);
      setVersion(draft.version);
      setProcessId(draft.id ?? null);
    };

    const processFromSearch = searchParams.get("id");
    if (processFromSearch) {
      const storedProcess = getStoredProcessById(processFromSearch);
      if (storedProcess) {
        loadFromDraft({
          id: storedProcess.id,
          name: storedProcess.name,
          valueChain: storedProcess.valueChain,
          version: storedProcess.version,
          nodes: storedProcess.nodes,
          edges: storedProcess.edges
        });
        setSaveNotice(`Loaded playbook "${storedProcess.name}".`);
      }
    } else {
      const draft = loadBuilderDraft();
      if (draft) {
        loadFromDraft(draft);
      }
    }

    const queuedAgents = consumeMarketplaceAgentQueue();
    if (queuedAgents.length > 0) {
      setNodes((currentNodes) => {
        const additions = queuedAgents.reduce<ProcessFlowNode[]>((acc, queuedId, index) => {
          const template = agentTemplateById.get(queuedId);
          if (!template) {
            return acc;
          }

          const id = `node-${nodeId.current++}`;
          const queuedNode: ProcessFlowNode = {
            id,
            type: "process",
            position: { x: 220 + index * 250, y: 430 },
            data: {
              label: template.label,
              subtitle: template.subtitle,
              kind: template.kind,
              accent: template.accent,
              tags: template.tags,
              status: template.status,
              branchLabels: template.branchLabels
            }
          };

          acc.push(queuedNode);
          return acc;
        }, []);

        const merged = [...currentNodes, ...additions];
        nodeId.current = nextNodeCounter(merged);
        return merged;
      });

      setSaveNotice(`Added ${queuedAgents.length} module(s) from Intake Modules.`);
    }

    setIsReady(true);
  }, [agentTemplateById, isReady, searchParams, setEdges, setNodes]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (selectedNodeId && !nodes.some((node) => node.id === selectedNodeId)) {
      setSelectedNodeId(null);
    }

    saveBuilderDraft({
      id: processId ?? undefined,
      name: processName,
      valueChain,
      version,
      nodes,
      edges
    });
  }, [
    edges,
    isReady,
    nodes,
    processId,
    processName,
    selectedNodeId,
    valueChain,
    version
  ]);

  useEffect(() => {
    if (!selectedSubmission) {
      return;
    }

    setFollowUpDraft(buildFollowUpDraft(selectedSubmission));
  }, [selectedSubmission]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((currentEdges) =>
        addEdge(
          {
            ...connection,
            type: "smoothstep",
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: edgeColor
            },
            style: {
              stroke: edgeColor,
              strokeWidth: 1.8
            }
          },
          currentEdges
        )
      );
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const rawTemplate = event.dataTransfer.getData("application/process-template");
      if (!rawTemplate) {
        return;
      }

      const template = JSON.parse(rawTemplate) as PaletteTemplate;
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const id = `node-${nodeId.current++}`;

      const newNode: ProcessFlowNode = {
        id,
        type: "process",
        position,
        data: {
          label: template.label,
          subtitle: template.subtitle,
          kind: template.kind,
          accent: template.accent,
          tags: template.tags,
          status: template.status,
          branchLabels: template.branchLabels
        }
      };

      setNodes((currentNodes) => [...currentNodes, newNode]);
      setSelectedNodeId(id);
    },
    [screenToFlowPosition, setNodes]
  );

  const handleTemplateDragStart = (
    event: DragEvent<HTMLButtonElement>,
    template: PaletteTemplate
  ) => {
    event.dataTransfer.setData("application/process-template", JSON.stringify(template));
    event.dataTransfer.effectAllowed = "move";
  };

  const updateSelectedNode = (patch: Partial<ProcessNodeData>) => {
    if (!selectedNodeId) {
      return;
    }

    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id !== selectedNodeId) {
          return node;
        }

        return {
          ...node,
          data: {
            ...node.data,
            ...patch
          }
        };
      })
    );
  };

  const handleDeleteSelected = () => {
    if (!selectedNodeId) {
      return;
    }

    setNodes((currentNodes) =>
      currentNodes.filter((node) => node.id !== selectedNodeId)
    );
    setEdges((currentEdges) =>
      currentEdges.filter(
        (edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId
      )
    );
    setSelectedNodeId(null);
  };

  const handleResetToTemplate = () => {
    const template = createUnderwritingTemplate();
    setNodes(template.nodes);
    setEdges(template.edges);
    setSelectedNodeId(null);
    setProcessId(null);
    setProcessName("Underwriting Inbox Autopilot - Commercial Property");
    setValueChain("Submission Structuring");
    setVersion(1);
    setSubmissionQueue(submissionQueueSeed);
    setSelectedSubmissionId(submissionQueueSeed[0].id);
    setAuditEntries(initialAudit);
    nodeId.current = nextNodeCounter(template.nodes);
    setSaveNotice("Reset to underwriting intake blueprint.");
  };

  const handleSaveProcess = () => {
    const id = processId ?? `process-${Date.now()}`;
    const nextVersion = processId ? version + 1 : version;

    const processRecord: StoredProcess = {
      id,
      name: processName,
      valueChain,
      version: nextVersion,
      updatedAt: new Date().toISOString(),
      nodeCount: nodes.length,
      edgeCount: edges.length,
      nodes,
      edges
    };

    upsertStoredProcess(processRecord);
    setProcessId(id);
    setVersion(nextVersion);
    setSaveNotice(`Saved ${processName} (v${nextVersion}).`);
  };

  const selectSubmission = (submissionId: string) => {
    setSelectedSubmissionId(submissionId);
    setIsDrawerOpen(true);
  };

  const handleGenerateFollowUp = () => {
    if (!selectedSubmission) {
      return;
    }

    const draft = buildFollowUpDraft(selectedSubmission);
    setFollowUpDraft(draft);
    pushAudit(`Generated missing-info draft for ${selectedSubmission.id}`, "Broker Loop Agent");
    setSaveNotice(`Draft refreshed for ${selectedSubmission.id}.`);
  };

  const handleSendFollowUp = () => {
    if (!selectedSubmission) {
      return;
    }

    setSubmissionQueue((current) =>
      current.map((item) => {
        if (item.id !== selectedSubmission.id) {
          return item;
        }

        return {
          ...item,
          status: "Waiting on Broker",
          followUpCount: item.followUpCount + 1,
          nextAction: "Await broker response and re-run completeness gate"
        };
      })
    );

    pushAudit(`Sent follow-up request for ${selectedSubmission.id}`, "Broker Loop Agent");
    setSaveNotice(`Follow-up sent for ${selectedSubmission.id}.`);
  };

  const handleMarkReady = () => {
    if (!selectedSubmission) {
      return;
    }

    setSubmissionQueue((current) =>
      current.map((item) => {
        if (item.id !== selectedSubmission.id) {
          return item;
        }

        return {
          ...item,
          status: "Ready for Underwriter",
          nextAction: "Push underwriter packet into workbench queue"
        };
      })
    );

    pushAudit(
      `${selectedSubmission.id} marked ready for underwriter handoff`,
      "Underwriter Packet Assembler"
    );
    setSaveNotice(`${selectedSubmission.id} is ready for underwriter handoff.`);
  };

  const packetConfidence = selectedSubmission
    ? Math.round(averageConfidence(selectedSubmission.extractedFields) * 100)
    : 0;

  return (
    <main className="builder-workspace">
      <section className="builder-hero card-surface">
        <div>
          <p className="page-eyebrow">Intake Builder</p>
          <h1 className="page-title">Underwriting Inbox Autopilot</h1>
          <p className="page-copy">
            Design, operate, and validate the submission intake flow from broker inbox to
            decision-ready underwriter packet.
          </p>
        </div>
        <div className="builder-metric-grid">
          <div className="builder-metric">
            <span className="builder-metric__value">{nodes.length}</span>
            <span className="builder-metric__label">Flow modules</span>
          </div>
          <div className="builder-metric">
            <span className="builder-metric__value">{edges.length}</span>
            <span className="builder-metric__label">Transitions</span>
          </div>
          <div className="builder-metric">
            <span className="builder-metric__value">{queueStats.ready}</span>
            <span className="builder-metric__label">Ready for UW</span>
          </div>
          <div className="builder-metric">
            <span className="builder-metric__value">{queueStats.outstanding}</span>
            <span className="builder-metric__label">Open requirements</span>
          </div>
        </div>
      </section>

      <section className="builder-layout">
        <aside className="builder-pane builder-pane--palette">
          <p className="pane-eyebrow">Modules</p>
          <h2 className="pane-title">Intake Palette</h2>
          <p className="pane-copy">
            Drag modules into the canvas, then wire transitions and loop behavior.
          </p>

          <div className="palette-tabs" role="tablist" aria-label="Palette tabs">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "agents"}
              className={`palette-tab ${activeTab === "agents" ? "is-active" : ""}`}
              onClick={() => setActiveTab("agents")}
            >
              Modules
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "data"}
              className={`palette-tab ${activeTab === "data" ? "is-active" : ""}`}
              onClick={() => setActiveTab("data")}
            >
              Connectors
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "logic"}
              className={`palette-tab ${activeTab === "logic" ? "is-active" : ""}`}
              onClick={() => setActiveTab("logic")}
            >
              Control
            </button>
          </div>

          <div className="palette-list">
            {templatesByTab[activeTab].map((template) => (
              <button
                key={template.templateId}
                type="button"
                draggable
                onDragStart={(event) => handleTemplateDragStart(event, template)}
                className={`palette-card palette-card--${template.kind}`}
              >
                <span className="palette-card__title">{template.label}</span>
                <span className="palette-card__subtitle">{template.subtitle}</span>
                <span className="palette-card__meta">{template.tags.join(" | ")}</span>
              </button>
            ))}
          </div>

          <div className="queue-panel">
            <div className="queue-panel__header">
              <h3 className="pane-title pane-title--small">Submission Queue</h3>
              <span>{submissionQueue.length} cases</span>
            </div>
            <ul className="queue-list">
              {submissionQueue.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`queue-item ${
                      selectedSubmissionId === item.id ? "is-active" : ""
                    }`}
                    onClick={() => selectSubmission(item.id)}
                  >
                    <div className="queue-item__row">
                      <span className="queue-item__id">{item.id}</span>
                      <span className={`queue-status queue-status--${toClassName(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="queue-item__meta">{item.broker}</p>
                    <p className="queue-item__meta">{item.product}</p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="builder-canvas-stack">
          <section className="builder-canvas-surface">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={(_, node) => setSelectedNodeId(node.id)}
              onPaneClick={() => setSelectedNodeId(null)}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              proOptions={{ hideAttribution: true }}
              defaultEdgeOptions={{
                type: "smoothstep",
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: edgeColor
                },
                style: {
                  stroke: edgeColor,
                  strokeWidth: 1.8
                }
              }}
            >
              <Background color="#B7C4D5" gap={20} size={1.1} />
              <MiniMap
                pannable
                zoomable
                nodeBorderRadius={10}
                nodeColor={(node) =>
                  ((node.data as ProcessNodeData | undefined)?.accent ?? "#6E829A")
                }
                maskColor="rgba(226, 233, 242, 0.64)"
              />
              <Controls showInteractive={false} position="bottom-right" />
            </ReactFlow>
          </section>

          <section className="packet-panel card-surface">
            <div className="packet-panel__header">
              <div>
                <p className="pane-eyebrow">Underwriter Packet</p>
                <h2 className="pane-title pane-title--small">Decision-ready summary</h2>
              </div>
              <button
                type="button"
                className="btn btn--ghost btn--compact"
                onClick={handleMarkReady}
                disabled={!selectedSubmission}
              >
                Mark Ready
              </button>
            </div>

            {selectedSubmission ? (
              <>
                <div className="packet-kpis">
                  <div className="packet-kpi">
                    <span>Submission</span>
                    <strong>{selectedSubmission.id}</strong>
                  </div>
                  <div className="packet-kpi">
                    <span>Appetite signal</span>
                    <strong>{selectedSubmission.appetiteSignal}</strong>
                  </div>
                  <div className="packet-kpi">
                    <span>Avg confidence</span>
                    <strong>{packetConfidence}%</strong>
                  </div>
                  <div className="packet-kpi">
                    <span>Premium hint</span>
                    <strong>{selectedSubmission.premiumHint}</strong>
                  </div>
                </div>

                <p className="pane-copy">{selectedSubmission.nextAction}</p>

                <div className="pill-row">
                  {selectedSubmission.riskFlags.map((flag) => (
                    <span key={flag} className="process-branch-pill">
                      {flag}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="pane-copy">Select a submission to generate a packet summary.</p>
            )}
          </section>
        </section>

        <aside className="builder-pane builder-pane--config">
          <p className="pane-eyebrow">Control Panel</p>
          <h2 className="pane-title pane-title--small">Playbook Settings</h2>

          <label className="form-label">
            Playbook name
            <input
              type="text"
              className="text-input"
              value={processName}
              onChange={(event) => setProcessName(event.target.value)}
            />
          </label>

          <label className="form-label">
            Primary intake stage
            <select
              className="select-input"
              value={valueChain}
              onChange={(event) => setValueChain(event.target.value as ValueChain)}
            >
              {valueChainOrder.map((chain) => (
                <option key={chain} value={chain}>
                  {chain}
                </option>
              ))}
            </select>
          </label>

          <div className="stats-row">
            <span>{queueStats.needsData} need data</span>
            <span>{queueStats.waiting} waiting</span>
            <span>v{version}</span>
          </div>

          <div className="builder-actions">
            <button type="button" className="btn btn--primary" onClick={handleSaveProcess}>
              Save Playbook
            </button>
            <button type="button" className="btn btn--ghost" onClick={handleResetToTemplate}>
              Reset Intake Blueprint
            </button>
            <Link href="/process-library" className="btn btn--ghost">
              Open Playbook Library
            </Link>
          </div>

          {saveNotice ? <p className="inline-notice">{saveNotice}</p> : null}

          <h2 className="pane-title pane-title--small">Missing-Info Generator</h2>

          <label className="form-label">
            Broker follow-up draft
            <textarea
              className="text-input text-area"
              rows={7}
              value={followUpDraft}
              onChange={(event) => setFollowUpDraft(event.target.value)}
            />
          </label>

          <div className="builder-actions builder-actions--row">
            <button type="button" className="btn btn--ghost" onClick={handleGenerateFollowUp}>
              Regenerate Draft
            </button>
            <button type="button" className="btn btn--primary" onClick={handleSendFollowUp}>
              Send Follow-Up
            </button>
          </div>

          <h2 className="pane-title pane-title--small">Audit Timeline</h2>
          <ul className="audit-list">
            {auditEntries.slice(0, 10).map((entry) => (
              <li key={entry.id} className="audit-item">
                <p className="audit-item__event">{entry.event}</p>
                <p className="audit-item__meta">
                  {entry.actor} | {new Date(entry.timestamp).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>

          <h2 className="pane-title pane-title--small">Selected node</h2>

          {selectedNode ? (
            <div className="node-editor">
              <label className="form-label">
                Label
                <input
                  type="text"
                  className="text-input"
                  value={selectedNode.data.label}
                  onChange={(event) => updateSelectedNode({ label: event.target.value })}
                />
              </label>

              <label className="form-label">
                Subtitle
                <input
                  type="text"
                  className="text-input"
                  value={selectedNode.data.subtitle}
                  onChange={(event) => updateSelectedNode({ subtitle: event.target.value })}
                />
              </label>

              <label className="form-label">
                Tags
                <input
                  type="text"
                  className="text-input"
                  value={selectedNode.data.tags.join(", ")}
                  onChange={(event) =>
                    updateSelectedNode({ tags: parseCommaSeparated(event.target.value) })
                  }
                />
              </label>

              {selectedNode.data.kind === "logic" ? (
                <label className="form-label">
                  Branch labels
                  <input
                    type="text"
                    className="text-input"
                    value={(selectedNode.data.branchLabels ?? []).join(", ")}
                    onChange={(event) =>
                      updateSelectedNode({
                        branchLabels: parseCommaSeparated(event.target.value)
                      })
                    }
                  />
                </label>
              ) : null}

              <button type="button" className="btn btn--ghost" onClick={handleDeleteSelected}>
                Delete Node
              </button>
            </div>
          ) : (
            <p className="pane-copy">Select a node on the canvas to edit its metadata.</p>
          )}
        </aside>
      </section>

      {isDrawerOpen && selectedSubmission ? (
        <aside className="submission-drawer" aria-label="Submission details">
          <div className="submission-drawer__header">
            <div>
              <p className="pane-eyebrow">Submission Detail</p>
              <h2>{selectedSubmission.id}</h2>
            </div>
            <button
              type="button"
              className="btn btn--ghost btn--compact"
              onClick={() => setIsDrawerOpen(false)}
            >
              Close
            </button>
          </div>

          <div className="submission-drawer__meta-grid">
            <div>
              <span>Broker</span>
              <strong>{selectedSubmission.broker}</strong>
            </div>
            <div>
              <span>Insured</span>
              <strong>{selectedSubmission.insured}</strong>
            </div>
            <div>
              <span>Product</span>
              <strong>{selectedSubmission.product}</strong>
            </div>
            <div>
              <span>Received</span>
              <strong>{new Date(selectedSubmission.receivedAt).toLocaleString()}</strong>
            </div>
          </div>

          <h3 className="modal-subtitle">Documents</h3>
          <ul className="modal-list">
            {selectedSubmission.documents.map((document) => (
              <li key={document.name}>
                {document.name} ({document.kind}, {document.pages} pages)
              </li>
            ))}
          </ul>

          <h3 className="modal-subtitle">Extracted fields</h3>
          <ul className="detail-list">
            {selectedSubmission.extractedFields.map((field) => (
              <li key={field.label} className="detail-list__item">
                <div>
                  <p className="detail-list__label">{field.label}</p>
                  <p className="detail-list__value">{field.value}</p>
                </div>
                <div className="detail-list__meta">
                  <span>{Math.round(field.confidence * 100)}%</span>
                  <span>{field.source}</span>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </main>
  );
}

export function ProcessBuilder() {
  return (
    <ReactFlowProvider>
      <BuilderWorkbench />
    </ReactFlowProvider>
  );
}
