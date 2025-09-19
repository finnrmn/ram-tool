import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import axios from "axios";
import { useState } from "react";
import Header from "../components/Header";
import ConverterCard from "../components/SidebarTools/ConverterCard";
import TemplatesCard from "../components/SidebarTools/TemplatesCard";
import SystemTable from "../components/SystemTable/SystemTable";
import RPlot from "../components/Plots/RPlot";
import ComparePlot from "../components/Plots/ComparePlot";
import DiagramCanvas from "../components/Diagram/Canvas";
import KpiCards from "../components/ResultsPanel/KpiCards";
import SummaryCard from "../components/ResultsPanel/SummaryCard";
import { solveRbd } from "../api/client";
import { useScenarioStore } from "../store/useScenarioStore";
const plotTabs = [
    { id: "reliability", label: "R(t)" },
    { id: "availability", label: "A(t)" },
    { id: "compare", label: "Vergleich" },
    { id: "diagram", label: "Diagramm" },
];
const Home = ({ apiOffline }) => {
    const { scenario, reset, addComponent, updateComponent, removeComponent, updateStructure, updatePlotSettings, } = useScenarioStore();
    const [plotData, setPlotData] = useState(null);
    const [kpis, setKpis] = useState(null);
    const [warnings, setWarnings] = useState([]);
    const [solveError, setSolveError] = useState(null);
    const [isSolving, setIsSolving] = useState(false);
    const [activePlotTab, setActivePlotTab] = useState("reliability");
    const layoutClass = activePlotTab === "diagram"
        ? "lg:grid lg:grid-cols-[260px,minmax(0,1fr)] xl:grid-cols-[280px,minmax(0,1fr)]"
        : "lg:grid lg:grid-cols-[280px,1fr,280px]";
    const parseError = (error) => {
        if (axios.isAxiosError(error)) {
            const data = (error.response?.data ?? {});
            if (typeof data.detail === "string") {
                return data.detail;
            }
            if (data.detail) {
                return JSON.stringify(data.detail);
            }
            return error.message;
        }
        if (error instanceof Error) {
            return error.message;
        }
        return "Unbekannter Fehler.";
    };
    const handleSolve = async () => {
        setSolveError(null);
        setIsSolving(true);
        try {
            const result = await solveRbd(scenario);
            setPlotData(result.r_curve);
            setKpis(result.kpis);
            setWarnings(result.warnings);
        }
        catch (error) {
            setPlotData(null);
            setKpis(null);
            setWarnings([]);
            setSolveError(parseError(error));
        }
        finally {
            setIsSolving(false);
        }
    };
    const handleReset = () => {
        reset();
        setPlotData(null);
        setKpis(null);
        setWarnings([]);
        setSolveError(null);
        setActivePlotTab("reliability");
    };
    const handleKindChange = (kind) => {
        if (kind === "kofn") {
            const defaultComponents = scenario.components.length || 1;
            updateStructure({
                kind,
                k: scenario.structure.k ?? 1,
                n: scenario.structure.n ?? defaultComponents,
            });
        }
        else {
            updateStructure({ kind, k: undefined, n: undefined });
        }
    };
    const handleKChange = (value) => {
        updateStructure({ k: value });
    };
    const handleNChange = (value) => {
        updateStructure({ n: value });
    };
    const handleTMaxChange = (value) => {
        const numeric = Number(value);
        if (Number.isNaN(numeric)) {
            return;
        }
        updatePlotSettings({ tMax: numeric });
    };
    const handleSamplesChange = (value) => {
        const numeric = Number(value);
        if (Number.isNaN(numeric)) {
            return;
        }
        updatePlotSettings({ samples: Math.floor(numeric) });
    };
    const handleLogScaleChange = (checked) => {
        updatePlotSettings({ logScale: checked });
    };
    return (_jsxs("div", { className: "min-h-screen bg-slate-950 text-slate-100", children: [_jsx(Header, { structure: scenario.structure, componentCount: scenario.components.length, onKindChange: handleKindChange, onKChange: handleKChange, onNChange: handleNChange, onReset: handleReset }), apiOffline && (_jsx("div", { className: "bg-amber-500/10 text-center text-sm text-amber-300", children: _jsx("span", { className: "inline-block py-2", children: "API offline?" }) })), _jsxs("div", { className: `mx-auto flex max-w-screen-2xl flex-col gap-6 px-4 py-6 ${layoutClass}`, children: [_jsxs("aside", { className: "space-y-4 lg:sticky lg:top-6", children: [_jsx(ConverterCard, {}), _jsx(TemplatesCard, { onAddComponent: addComponent })] }), _jsxs("main", { className: "space-y-6", children: [_jsx(SystemTable, { components: scenario.components, onUpdateComponent: updateComponent, onRemoveComponent: removeComponent }), _jsxs("div", { className: "rounded-lg border border-slate-800 bg-slate-900/70 p-5", children: [_jsxs("div", { className: "flex flex-wrap items-end gap-4", children: [_jsx("div", { className: "flex items-center gap-1 rounded border border-slate-800 bg-slate-950/40 p-1", children: plotTabs.map((tab) => {
                                                    const isActive = activePlotTab === tab.id;
                                                    return (_jsx("button", { type: "button", className: `rounded px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${isActive ? "bg-sky-500 text-slate-950" : "text-slate-400 hover:text-slate-200"}`, onClick: () => setActivePlotTab(tab.id), children: tab.label }, tab.id));
                                                }) }), activePlotTab !== "diagram" && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-xs uppercase tracking-wide text-slate-400", children: ["t", _jsx("sub", { children: "max" })] }), _jsx("input", { className: "mt-1 w-28 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none", type: "number", min: "0", step: "any", value: scenario.plotSettings.tMax, onChange: (event) => handleTMaxChange(event.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs uppercase tracking-wide text-slate-400", children: "Samples" }), _jsx("input", { className: "mt-1 w-24 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none", type: "number", min: "2", step: "1", value: scenario.plotSettings.samples, onChange: (event) => handleSamplesChange(event.target.value) })] }), _jsxs("label", { className: "flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400", children: [_jsx("input", { type: "checkbox", className: "h-4 w-4 accent-sky-400", checked: Boolean(scenario.plotSettings.logScale), onChange: (event) => handleLogScaleChange(event.target.checked) }), "logScale"] }), _jsx("button", { type: "button", className: "ml-auto rounded bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60", onClick: handleSolve, disabled: isSolving, children: isSolving ? "Berechne..." : "Berechnen" })] }))] }), _jsxs("div", { className: "mt-4", children: [_jsxs("div", { className: activePlotTab === "reliability" ? "space-y-4" : "hidden", children: [solveError && (_jsx("div", { className: "rounded border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-sm text-rose-200", children: solveError })), warnings.length > 0 && (_jsx("div", { className: "space-y-2", children: warnings.map((warning) => (_jsx("div", { className: "rounded border border-amber-400/60 bg-amber-400/10 px-3 py-2 text-xs text-amber-200", children: warning }, warning))) })), _jsx("div", { className: "h-[420px]", children: _jsx(RPlot, { data: plotData, isLoading: isSolving }) })] }), _jsx("div", { className: activePlotTab === "availability" ? "block" : "hidden", children: _jsx("div", { className: "flex h-[420px] items-center justify-center rounded border border-slate-800 bg-slate-950/40 text-sm text-slate-500", children: "A(t)-Plot noch nicht implementiert." }) }), _jsxs("div", { className: activePlotTab === "compare" ? "space-y-3" : "hidden", children: [_jsx(ComparePlot, {}), _jsx("p", { className: "text-xs text-slate-500", children: "Komponentenlinien basieren auf den aktuellen lambda-Werten; bei k-aus-n bleibt die Systemlinie die MVP-Variante." })] }), _jsx("div", { className: activePlotTab === "diagram" ? "block" : "hidden", children: _jsx(DiagramCanvas, {}) })] })] })] }), _jsxs("aside", { className: `space-y-4 ${activePlotTab === "diagram" ? "lg:hidden" : ""}`, children: [_jsx(KpiCards, { kpis: kpis }), _jsx(SummaryCard, { scenario: scenario })] })] })] }));
};
export default Home;
