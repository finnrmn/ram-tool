import { Handle, Position, type NodeProps } from "reactflow";

import type { ComponentData } from "../types";

const formatNumber = (value?: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }
  return value.toExponential(2);
};

const ComponentNode = ({ data, selected }: NodeProps<ComponentData>) => {
  return (
    <div
      className={`rounded-lg border bg-slate-900/90 px-3 py-2 text-sm shadow-md transition-colors ${
        selected ? "border-sky-400" : "border-slate-700"
      }`}
    >
      <div className="text-xs uppercase tracking-wide text-slate-500">Komponente</div>
      <div className="font-semibold text-slate-100">{data.name || "Unbenannt"}</div>
      <div className="mt-1 flex flex-col gap-0.5 text-[11px] text-slate-400">
        <span>
          lambda: <span className="text-slate-200">{formatNumber(data.lambda)}</span>
        </span>
        <span>
          MTBF: <span className="text-slate-200">{formatNumber(data.mtbf)}</span>
        </span>
      </div>
      <Handle type="target" position={Position.Left} className="h-2 w-2 bg-sky-400" />
      <Handle type="source" position={Position.Right} className="h-2 w-2 bg-sky-400" />
    </div>
  );
};

export default ComponentNode;
