import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Handle, Position } from "reactflow";
const OrNode = ({ selected }) => {
    return (_jsxs("div", { className: `rounded-lg border px-4 py-3 text-center text-sm font-semibold uppercase tracking-wide transition-colors ${selected ? "border-sky-400 bg-sky-500/10 text-sky-200" : "border-slate-700 bg-slate-900/90 text-slate-200"}`, children: ["Parallel (OR)", _jsx(Handle, { type: "source", position: Position.Right, className: "h-2 w-2 bg-sky-400" })] }));
};
export default OrNode;
