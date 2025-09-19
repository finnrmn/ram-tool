import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
});
const KpiCards = ({ kpis }) => {
    return (_jsxs("div", { className: "rounded-lg border border-slate-800 bg-slate-900/70 p-4", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wide text-slate-400", children: "KPIs" }), _jsxs("div", { className: "mt-4 space-y-3", children: [_jsxs("div", { className: "rounded border border-slate-800 bg-slate-950/40 px-3 py-2", children: [_jsxs("div", { className: "text-xs uppercase tracking-wide text-slate-500", children: ["R(0) @ t = ", kpis ? kpis.t0 : 0] }), _jsx("div", { className: "text-xl font-semibold text-sky-400", children: kpis ? formatter.format(kpis.R_t0) : "—" })] }), _jsxs("div", { className: "rounded border border-slate-800 bg-slate-950/40 px-3 py-2", children: [_jsxs("div", { className: "text-xs uppercase tracking-wide text-slate-500", children: ["R(t", _jsx("sub", { children: "max" }), ") @ t = ", kpis ? kpis.tmax : 0] }), _jsx("div", { className: "text-xl font-semibold text-sky-400", children: kpis ? formatter.format(kpis.R_tmax) : "—" })] })] })] }));
};
export default KpiCards;
