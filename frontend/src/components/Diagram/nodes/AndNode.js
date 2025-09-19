import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Handle, Position } from "reactflow";
const AndNode = ({ selected }) => {
    return (_jsxs("div", { className: `rounded-lg border px-4 py-3 text-center text-sm font-semibold uppercase tracking-wide transition-colors ${selected ? "border-emerald-400 bg-emerald-500/10 text-emerald-200" : "border-slate-700 bg-slate-900/90 text-slate-200"}`, children: ["Serie (AND)", _jsx(Handle, { type: "source", position: Position.Right, className: "h-2 w-2 bg-emerald-400" })] }));
};
export default AndNode;
