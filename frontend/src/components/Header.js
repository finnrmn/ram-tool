import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const Header = ({ structure, componentCount, onKindChange, onKChange, onNChange, onReset, }) => {
    const handleKindSelect = (event) => {
        onKindChange(event.target.value);
    };
    const handleKInput = (event) => {
        const value = event.target.value;
        onKChange(value === "" ? undefined : Number(value));
    };
    const handleNInput = (event) => {
        const value = event.target.value;
        onNChange(value === "" ? undefined : Number(value));
    };
    return (_jsx("header", { className: "border-b border-slate-800 bg-slate-900/80", children: _jsxs("div", { className: "mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-semibold text-sky-400", children: "RAM Tool" }), _jsx("p", { className: "text-sm text-slate-400", children: "Reliability & Availability explorer" })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsx("label", { className: "text-xs uppercase tracking-wide text-slate-400", children: "Systemtyp" }), _jsxs("select", { className: "rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-400 focus:outline-none", value: structure.kind, onChange: handleKindSelect, children: [_jsx("option", { value: "series", children: "Serie" }), _jsx("option", { value: "parallel", children: "Parallel" }), _jsx("option", { value: "kofn", children: "k-aus-n" })] }), structure.kind === "kofn" && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { className: "w-16 rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm focus:border-sky-400 focus:outline-none", type: "number", min: 1, step: 1, value: structure.k ?? "", placeholder: "k", onChange: handleKInput }), _jsx("input", { className: "w-16 rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm focus:border-sky-400 focus:outline-none", type: "number", min: 1, step: 1, value: structure.n ?? "", placeholder: `n (≥ ${Math.max(componentCount, 1)})`, onChange: handleNInput })] })), _jsx("button", { type: "button", className: "rounded border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 hover:border-sky-400 hover:text-sky-300", onClick: onReset, children: "Neu" })] })] }) }));
};
export default Header;
