import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Handle, Position } from "reactflow";
const KofNNode = ({ data, selected }) => {
    return (_jsxs("div", { className: `rounded-lg border px-4 py-3 text-center text-sm font-semibold uppercase tracking-wide transition-colors ${selected ? "border-amber-400 bg-amber-500/10 text-amber-200" : "border-slate-700 bg-slate-900/90 text-slate-200"}`, children: ["k-of-n", _jsxs("div", { className: "mt-1 text-xs font-normal normal-case text-amber-200", children: ["k = ", data.k, ", n = ", data.n] }), _jsx(Handle, { type: "source", position: Position.Right, className: "h-2 w-2 bg-amber-400" })] }));
};
export default KofNNode;
