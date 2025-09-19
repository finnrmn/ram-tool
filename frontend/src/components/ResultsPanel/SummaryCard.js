import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const SummaryCard = ({ scenario }) => {
    return (_jsxs("div", { className: "rounded-lg border border-slate-800 bg-slate-900/70 p-4", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wide text-slate-400", children: "Scenario JSON" }), _jsx("pre", { className: "mt-3 max-h-80 overflow-auto rounded bg-slate-950/80 px-3 py-2 text-xs text-slate-300", children: JSON.stringify(scenario, null, 2) })] }));
};
export default SummaryCard;
