import type { CSSProperties } from "react";
import { Handle, Node, NodeProps, Position } from "@xyflow/react";

export type ProcessNodeKind = "agent" | "data" | "logic" | "event";

export type ProcessNodeData = {
  label: string;
  subtitle: string;
  kind: ProcessNodeKind;
  accent: string;
  tags: string[];
  status?: string;
  branchLabels?: string[];
};

export type ProcessFlowNode = Node<ProcessNodeData, "process">;

export function ProcessNode({ data, selected }: NodeProps<ProcessFlowNode>) {
  const style = {
    "--node-accent": data.accent
  } as CSSProperties;

  return (
    <div
      style={style}
      className={`process-node process-node--${data.kind} ${
        selected ? "is-selected" : ""
      }`}
    >
      <Handle className="process-handle" type="target" position={Position.Top} />
      <div className="process-node__eyebrow">{data.kind}</div>
      <div className="process-node__title">{data.label}</div>
      <div className="process-node__caption">{data.subtitle}</div>

      <div className="process-node__meta">
        {data.status ? <span className="process-chip">{data.status}</span> : null}
        {data.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="process-chip process-chip--muted">
            {tag}
          </span>
        ))}
      </div>

      {data.kind === "logic" && data.branchLabels?.length ? (
        <div className="process-node__branches">
          {data.branchLabels.slice(0, 3).map((label) => (
            <span key={label} className="process-branch-pill">
              {label}
            </span>
          ))}
        </div>
      ) : null}

      <Handle
        className="process-handle"
        type="source"
        position={Position.Bottom}
      />
    </div>
  );
}
