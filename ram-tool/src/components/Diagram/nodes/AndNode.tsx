import { Handle, Position, type NodeProps } from "reactflow";

import type { AndData } from "../types";

const AndNode = ({ selected }: NodeProps<AndData>) => {
  return (
    <div
      className={`rounded-lg border px-4 py-3 text-center text-sm font-semibold uppercase tracking-wide transition-colors ${
        selected ? "border-emerald-400 bg-emerald-500/10 text-emerald-200" : "border-slate-700 bg-slate-900/90 text-slate-200"
      }`}
    >
      Serie (AND)
      <Handle type="source" position={Position.Right} className="h-2 w-2 bg-emerald-400" />
    </div>
  );
};

export default AndNode;
