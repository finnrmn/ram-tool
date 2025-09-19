import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const ComponentRow = ({ component, onUpdate, onRemove }) => {
    const parseNumber = (value) => {
        if (value === "") {
            return undefined;
        }
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : undefined;
    };
    const handleNameChange = (event) => {
        onUpdate(component.id, { name: event.target.value });
    };
    const handleLambdaChange = (event) => {
        onUpdate(component.id, { distribution: { type: "exponential", lambda: parseNumber(event.target.value) } });
    };
    const handleMtbfChange = (event) => {
        onUpdate(component.id, { distribution: { type: "exponential", mtbf: parseNumber(event.target.value) } });
    };
    const handleMttrChange = (event) => {
        onUpdate(component.id, { mttr: parseNumber(event.target.value) });
    };
    return (_jsxs("tr", { children: [_jsx("td", { className: "px-4 py-2", children: _jsx("input", { className: "w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm focus:border-sky-400 focus:outline-none", value: component.name, onChange: handleNameChange }) }), _jsx("td", { className: "px-4 py-2 text-slate-400", children: component.distribution.type === "exponential" ? "Exponential" : component.distribution.type }), _jsx("td", { className: "px-4 py-2", children: _jsx("input", { className: "w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm focus:border-sky-400 focus:outline-none", type: "number", step: "any", value: component.distribution.lambda ?? "", onChange: handleLambdaChange }) }), _jsx("td", { className: "px-4 py-2", children: _jsx("input", { className: "w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm focus:border-sky-400 focus:outline-none", type: "number", step: "any", value: component.distribution.mtbf ?? "", onChange: handleMtbfChange }) }), _jsx("td", { className: "px-4 py-2", children: _jsx("input", { className: "w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm focus:border-sky-400 focus:outline-none", type: "number", step: "any", value: component.mttr ?? "", onChange: handleMttrChange }) }), _jsx("td", { className: "px-4 py-2 text-right", children: _jsx("button", { type: "button", className: "rounded border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-rose-500 hover:text-rose-300", onClick: () => onRemove(component.id), children: "Entfernen" }) })] }));
};
export default ComponentRow;
