"use client";

import { DragEvent, useCallback, useMemo, useRef } from "react";
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
  ProcessFlowNode,
  ProcessNode,
  ProcessNodeVariant
} from "@/components/process-builder/process-node";

type NodeTemplate = {
  label: string;
  caption: string;
  variant: ProcessNodeVariant;
};

const nodeTemplates: NodeTemplate[] = [
  { label: "Start", caption: "Trigger or entry point", variant: "start" },
  { label: "Task", caption: "Action to complete", variant: "task" },
  { label: "Decision", caption: "Branching condition", variant: "decision" },
  { label: "End", caption: "Outcome or stop", variant: "end" }
];

const initialNodes: ProcessFlowNode[] = [
  {
    id: "node-0",
    type: "process",
    data: {
      label: "Start",
      caption: "Drop more steps from the left panel",
      variant: "start"
    },
    position: { x: 180, y: 120 }
  }
];

const initialEdges: Edge[] = [];

const edgeColor = "#4D5C73";

function BuilderCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<ProcessFlowNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const nodeId = useRef(1);

  const { screenToFlowPosition } = useReactFlow<ProcessFlowNode, Edge>();

  const nodeTypes = useMemo(
    () => ({
      process: ProcessNode
    }),
    []
  );

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

      const rawTemplate = event.dataTransfer.getData("application/process-node");
      if (!rawTemplate) {
        return;
      }

      const template = JSON.parse(rawTemplate) as NodeTemplate;
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      });

      const newNode: ProcessFlowNode = {
        id: `node-${nodeId.current++}`,
        type: "process",
        position,
        data: {
          label: template.label,
          caption: template.caption,
          variant: template.variant
        }
      };

      setNodes((currentNodes) => [...currentNodes, newNode]);
    },
    [screenToFlowPosition, setNodes]
  );

  const handleTemplateDragStart = (
    event: DragEvent<HTMLButtonElement>,
    template: NodeTemplate
  ) => {
    event.dataTransfer.setData("application/process-node", JSON.stringify(template));
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="builder-shell">
      <aside className="builder-panel">
        <p className="panel-eyebrow">Process</p>
        <h1 className="panel-title">Builder</h1>
        <p className="panel-copy">
          Drag blocks to the canvas, then connect steps only where flow control is
          needed.
        </p>

        <div className="template-list">
          {nodeTemplates.map((template) => (
            <button
              key={template.variant}
              type="button"
              className={`template-card template-card--${template.variant}`}
              draggable
              onDragStart={(event) => handleTemplateDragStart(event, template)}
            >
              <span className="template-card__title">{template.label}</span>
              <span className="template-card__caption">{template.caption}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="builder-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
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
          <Background color="#C7CFDA" gap={20} size={0.9} />
          <MiniMap
            pannable
            zoomable
            nodeBorderRadius={12}
            nodeColor="#7F90AA"
            maskColor="rgba(245, 243, 238, 0.58)"
          />
          <Controls showInteractive={false} position="bottom-right" />
        </ReactFlow>
      </section>
    </div>
  );
}

export function ProcessBuilder() {
  return (
    <ReactFlowProvider>
      <BuilderCanvas />
    </ReactFlowProvider>
  );
}
