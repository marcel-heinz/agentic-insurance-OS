import { Handle, Node, NodeProps, Position } from "@xyflow/react";

export type ProcessNodeVariant = "start" | "task" | "decision" | "end";

export type ProcessNodeData = {
  label: string;
  caption: string;
  variant: ProcessNodeVariant;
};

export type ProcessFlowNode = Node<ProcessNodeData, "process">;

export function ProcessNode({ data, selected }: NodeProps<ProcessFlowNode>) {
  return (
    <div
      className={`process-node process-node--${data.variant} ${
        selected ? "is-selected" : ""
      }`}
    >
      <Handle className="process-handle" type="target" position={Position.Top} />
      <div className="process-node__title">{data.label}</div>
      <div className="process-node__caption">{data.caption}</div>
      <Handle
        className="process-handle"
        type="source"
        position={Position.Bottom}
      />
    </div>
  );
}
