import { Handle, Position, type NodeProps } from "reactflow";

import type { OrData } from "../types";

const OrNode = ({ selected }: NodeProps<OrData>) => {
  return (
    <div
      className={`rounded-lg border px-4 py-3 text-center text-sm font-semibold uppercase tracking-wide transition-colors ${
        selected ? "border-sky-400 bg-sky-500/10 text-sky-200" : "border-slate-700 bg-slate-900/90 text-slate-200"
      }`}
    >
      Parallel (OR)
      <Handle type="source" position={Position.Right} className="h-2 w-2 bg-sky-400" />
    </div>
  );
};

export default OrNode;
