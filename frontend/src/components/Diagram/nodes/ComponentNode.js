import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Handle, Position } from "reactflow";
const formatNumber = (value) => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return "-";
    }
    return value.toExponential(2);
};
const ComponentNode = ({ data, selected }) => {
    return (_jsxs("div", { className: `rounded-lg border bg-slate-900/90 px-3 py-2 text-sm shadow-md transition-colors ${selected ? "border-sky-400" : "border-slate-700"}`, children: [_jsx("div", { className: "text-xs uppercase tracking-wide text-slate-500", children: "Komponente" }), _jsx("div", { className: "font-semibold text-slate-100", children: data.name || "Unbenannt" }), _jsxs("div", { className: "mt-1 flex flex-col gap-0.5 text-[11px] text-slate-400", children: [_jsxs("span", { children: ["lambda: ", _jsx("span", { className: "text-slate-200", children: formatNumber(data.lambda) })] }), _jsxs("span", { children: ["MTBF: ", _jsx("span", { className: "text-slate-200", children: formatNumber(data.mtbf) })] })] }), _jsx(Handle, { type: "target", position: Position.Left, className: "h-2 w-2 bg-sky-400" }), _jsx(Handle, { type: "source", position: Position.Right, className: "h-2 w-2 bg-sky-400" })] }));
};
export default ComponentNode;
