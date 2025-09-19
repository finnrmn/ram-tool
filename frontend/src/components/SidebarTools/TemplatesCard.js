import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const TemplatesCard = ({ onAddComponent }) => {
    return (_jsxs("div", { className: "rounded-lg border border-slate-800 bg-slate-900/70 p-4", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wide text-slate-400", children: "Templates" }), _jsx("p", { className: "mt-2 text-xs text-slate-400", children: "F\u00FCge Komponenten mit Standardwerten hinzu." }), _jsx("button", { type: "button", className: "mt-3 w-full rounded border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-sky-400 hover:text-sky-300", onClick: onAddComponent, children: "+ Komponente" })] }));
};
export default TemplatesCard;
