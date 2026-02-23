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

const edgeColor = "#53657E";

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

function createBrokerTemplate() {
  const nodes: ProcessFlowNode[] = [
    {
      id: "node-1",
      type: "process",
      position: { x: 140, y: 200 },
      data: {
        label: "Gmail Subscription Agent",
        subtitle: "Watch broker inbox for policy applications",
        kind: "agent",
        accent: valueChainAccent.Sales,
        tags: ["Sales", "Broker Intake"],
        status: "Beta"
      }
    },
    {
      id: "node-2",
      type: "process",
      position: { x: 430, y: 200 },
      data: {
        label: "Ingestion Agent",
        subtitle: "OCR, classification, and tax extraction",
        kind: "agent",
        accent: valueChainAccent.Underwriting,
        tags: ["Underwriting", "Data Intake"],
        status: "Verified"
      }
    },
    {
      id: "node-3",
      type: "process",
      position: { x: 730, y: 200 },
      data: {
        label: "Decision Table",
        subtitle: "Check if submitted data is complete and coherent",
        kind: "logic",
        accent: "#8B6A2E",
        tags: ["Routing"],
        branchLabels: ["Complete", "Missing Info"]
      }
    },
    {
      id: "node-4",
      type: "process",
      position: { x: 1030, y: 120 },
      data: {
        label: "Underwriting Agent",
        subtitle: "Run eligibility and quote recommendation",
        kind: "agent",
        accent: valueChainAccent.Underwriting,
        tags: ["Underwriting"],
        status: "Mock"
      }
    },
    {
      id: "node-5",
      type: "process",
      position: { x: 1030, y: 300 },
      data: {
        label: "Broker Feedback Agent",
        subtitle: "Ask broker for missing details",
        kind: "agent",
        accent: valueChainAccent.Sales,
        tags: ["Feedback Loop"],
        status: "Beta"
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
      label: "New application"
    },
    {
      id: "edge-2-3",
      source: "node-2",
      target: "node-3",
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
      style: { stroke: edgeColor, strokeWidth: 1.8 }
    },
    {
      id: "edge-3-4",
      source: "node-3",
      target: "node-4",
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
      style: { stroke: edgeColor, strokeWidth: 1.8 },
      label: "Complete"
    },
    {
      id: "edge-3-5",
      source: "node-3",
      target: "node-5",
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
      style: { stroke: edgeColor, strokeWidth: 1.8 },
      label: "Missing info"
    },
    {
      id: "edge-5-2",
      source: "node-5",
      target: "node-2",
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
      style: { stroke: edgeColor, strokeWidth: 1.8 },
      label: "Resubmission"
    }
  ];

  return { nodes, edges };
}

function BuilderWorkbench() {
  const searchParams = useSearchParams();
  const initialTemplate = useMemo(() => createBrokerTemplate(), []);

  const [nodes, setNodes, onNodesChange] = useNodesState<ProcessFlowNode>(
    initialTemplate.nodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialTemplate.edges);

  const [activeTab, setActiveTab] = useState<PaletteTab>("agents");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [processId, setProcessId] = useState<string | null>(null);
  const [processName, setProcessName] = useState("Broker Intake - New Business");
  const [valueChain, setValueChain] = useState<ValueChain>("Sales");
  const [version, setVersion] = useState(1);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

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
      accent: "#2E7D7D",
      tags: [connector.type]
    }));
  }, []);

  const logicTemplates = useMemo<PaletteTemplate[]>(() => {
    return logicCatalog.map((logic) => ({
      templateId: logic.id,
      label: logic.name,
      subtitle: logic.summary,
      kind: "logic",
      accent: "#8B6A2E",
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
        setSaveNotice(`Loaded process \"${storedProcess.name}\".`);
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
        const additions = queuedAgents.reduce<ProcessFlowNode[]>(
          (acc, queuedId, index) => {
            const template = agentTemplateById.get(queuedId);
            if (!template) {
              return acc;
            }

            const id = `node-${nodeId.current++}`;
            const queuedNode: ProcessFlowNode = {
              id,
              type: "process",
              position: { x: 180 + index * 260, y: 460 },
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
          },
          []
        );

        const merged = [...currentNodes, ...additions];
        nodeId.current = nextNodeCounter(merged);
        return merged;
      });

      setSaveNotice(`Added ${queuedAgents.length} agent(s) from marketplace.`);
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

  const handleResetToBrokerTemplate = () => {
    const template = createBrokerTemplate();
    setNodes(template.nodes);
    setEdges(template.edges);
    setSelectedNodeId(null);
    setProcessId(null);
    setProcessName("Broker Intake - New Business");
    setValueChain("Sales");
    setVersion(1);
    nodeId.current = nextNodeCounter(template.nodes);
    setSaveNotice("Reset to broker intake template.");
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

  return (
    <main className="builder-workspace">
      <section className="builder-hero card-surface">
        <div>
          <p className="page-eyebrow">Process Studio</p>
          <h1 className="page-title">Compose autonomous insurance flows visually.</h1>
          <p className="page-copy">
            Build reusable processes from agents, data connectors, and logic controls.
            Version each flow and route it by value chain.
          </p>
        </div>
        <div className="builder-hero__stats">
          <div className="builder-stat">
            <span className="builder-stat__value">{nodes.length}</span>
            <span className="builder-stat__label">Nodes</span>
          </div>
          <div className="builder-stat">
            <span className="builder-stat__value">{edges.length}</span>
            <span className="builder-stat__label">Connections</span>
          </div>
          <div className="builder-stat">
            <span className="builder-stat__value">v{version}</span>
            <span className="builder-stat__label">Version</span>
          </div>
        </div>
      </section>

      <section className="builder-layout">
        <aside className="builder-pane builder-pane--palette">
          <p className="pane-eyebrow">Palette</p>
          <h2 className="pane-title">Process Blocks</h2>
          <p className="pane-copy">
            Drag from agents, connectors, and logic controls into the canvas.
          </p>

          <div className="palette-tabs" role="tablist" aria-label="Palette tabs">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "agents"}
              className={`palette-tab ${activeTab === "agents" ? "is-active" : ""}`}
              onClick={() => setActiveTab("agents")}
            >
              Agents
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "data"}
              className={`palette-tab ${activeTab === "data" ? "is-active" : ""}`}
              onClick={() => setActiveTab("data")}
            >
              Data Sources
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "logic"}
              className={`palette-tab ${activeTab === "logic" ? "is-active" : ""}`}
              onClick={() => setActiveTab("logic")}
            >
              Logic
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
        </aside>

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
            <Background color="#CAD3DE" gap={20} size={1.1} />
            <MiniMap
              pannable
              zoomable
              nodeBorderRadius={10}
              nodeColor={(node) =>
                ((node.data as ProcessNodeData | undefined)?.accent ?? "#7F90AA")
              }
              maskColor="rgba(244, 242, 236, 0.7)"
            />
            <Controls showInteractive={false} position="bottom-right" />
          </ReactFlow>
        </section>

        <aside className="builder-pane builder-pane--config">
          <p className="pane-eyebrow">Configuration</p>
          <h2 className="pane-title pane-title--small">Process</h2>

          <label className="form-label">
            Process name
            <input
              type="text"
              className="text-input"
              value={processName}
              onChange={(event) => setProcessName(event.target.value)}
            />
          </label>

          <label className="form-label">
            Value chain
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
            <span>{nodes.length} nodes</span>
            <span>{edges.length} connections</span>
            <span>v{version}</span>
          </div>

          <div className="builder-actions">
            <button type="button" className="btn btn--primary" onClick={handleSaveProcess}>
              Save Process
            </button>
            <button type="button" className="btn btn--ghost" onClick={handleResetToBrokerTemplate}>
              Reset Broker Template
            </button>
            <Link href="/process-library" className="btn btn--ghost">
              Open Library
            </Link>
          </div>

          {saveNotice ? <p className="inline-notice">{saveNotice}</p> : null}

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
