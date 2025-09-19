import { Handle, Position, type NodeProps } from "reactflow";

import type { KofNData } from "../types";

const KofNNode = ({ data, selected }: NodeProps<KofNData>) => {
  return (
    <div
      className={`rounded-lg border px-4 py-3 text-center text-sm font-semibold uppercase tracking-wide transition-colors ${
        selected ? "border-amber-400 bg-amber-500/10 text-amber-200" : "border-slate-700 bg-slate-900/90 text-slate-200"
      }`}
    >
      k-of-n
      <div className="mt-1 text-xs font-normal normal-case text-amber-200">
        k = {data.k}, n = {data.n}
      </div>
      <Handle type="source" position={Position.Right} className="h-2 w-2 bg-amber-400" />
    </div>
  );
};

export default KofNNode;


