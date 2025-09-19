import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import ReactFlow, { Background, Controls, } from "reactflow";
import "reactflow/dist/style.css";
import { solveRbd } from "../../api/client";
import { useScenarioStore } from "../../store/useScenarioStore";
import { serializeDiagram } from "./serialize";
import { useDiagramStore } from "./useDiagramStore";
import { isComponentData, isKofNData } from "./types";
import { isValidKofN, validateComponentParams } from "./validation";
import AndNode from "./nodes/AndNode";
import ComponentNode from "./nodes/ComponentNode";
import KofNNode from "./nodes/KofNNode";
import OrNode from "./nodes/OrNode";
const nodeTypes = {
    componentNode: ComponentNode,
    andNode: AndNode,
    orNode: OrNode,
    kofnNode: KofNNode,
};
const parseNumberInput = (value) => {
    if (value.trim() === "") {
        return undefined;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
};
const formatKpi = (value) => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return "-";
    }
    return value.toFixed(6);
};
const parseErrorMessage = (error) => {
    if (typeof error === "string") {
        return error;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return "Unbekannter Fehler.";
};
const Canvas = () => {
    const { nodes, edges, rootKind, selectedNodeId, validation, solveStatus, solveError, solveWarnings, kpis, setNodes, setEdges, setSelectedNodeId, setRoot, addComponent, removeNode, setNodeData, setK, setN, resetPreset, connect, setValidation, setSolvePending, setSolveSuccess, setSolveError, setValidationError, } = useDiagramStore();
    const setScenario = useScenarioStore((state) => state.setScenario);
    const solveTimerRef = useRef(null);
    const requestRef = useRef(0);
    const selectedNode = selectedNodeId ? nodes.find((node) => node.id === selectedNodeId) : undefined;
    const selectedComponentData = selectedNode && isComponentData(selectedNode.data) ? selectedNode.data : undefined;
    useEffect(() => {
        if (solveTimerRef.current) {
            clearTimeout(solveTimerRef.current);
        }
        solveTimerRef.current = setTimeout(() => {
            const result = serializeDiagram(nodes, edges, rootKind);
            setValidation({ errors: result.errors, warnings: result.warnings });
            const scenarioResult = result.scenario;
            if (!scenarioResult || result.errors.length > 0) {
                const message = result.errors[0] ?? "Diagramm unvollstaendig.";
                setValidationError(message, result.warnings);
                return;
            }
            setSolvePending(scenarioResult, result.warnings);
            requestRef.current += 1;
            const activeRequest = requestRef.current;
            solveRbd(scenarioResult)
                .then((response) => {
                if (activeRequest !== requestRef.current) {
                    return;
                }
                const combinedWarnings = [...result.warnings, ...response.warnings];
                setSolveSuccess(response.kpis, combinedWarnings);
                setScenario(scenarioResult);
            })
                .catch((error) => {
                if (activeRequest !== requestRef.current) {
                    return;
                }
                setSolveError(parseErrorMessage(error));
            });
        }, 400);
        return () => {
            if (solveTimerRef.current) {
                clearTimeout(solveTimerRef.current);
            }
        };
    }, [nodes, edges, rootKind, setValidation, setSolvePending, setSolveSuccess, setSolveError, setScenario, setValidationError]);
    const handleConnect = (connection) => {
        connect(connection);
    };
    const handleNodeClick = (_, node) => {
        setSelectedNodeId(node.id);
    };
    const handlePaneClick = () => {
        setSelectedNodeId(null);
    };
    const handleComponentFieldChange = (field) => (value) => {
        if (!selectedComponentData || !selectedNode) {
            return;
        }
        if (field === "name") {
            setNodeData(selectedNode.id, { name: value });
            return;
        }
        const numericValue = parseNumberInput(value);
        setNodeData(selectedNode.id, { [field]: numericValue });
    };
    const handleRemoveSelected = () => {
        if (selectedNode && isComponentData(selectedNode.data)) {
            removeNode(selectedNode.id);
        }
    };
    const renderProperties = () => {
        if (!selectedNode) {
            return _jsx("p", { className: "text-sm text-slate-500", children: "Waehle einen Knoten aus, um Eigenschaften zu bearbeiten." });
        }
        if (isComponentData(selectedNode.data)) {
            const paramsValidation = validateComponentParams(selectedNode.data);
            return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs uppercase tracking-wide text-slate-400", children: "Name" }), _jsx("input", { className: "mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none", value: selectedComponentData?.name ?? "", onChange: (event) => handleComponentFieldChange("name")(event.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs uppercase tracking-wide text-slate-400", children: "lambda" }), _jsx("input", { className: "mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none", type: "number", step: "any", value: selectedComponentData?.lambda ?? "", onChange: (event) => handleComponentFieldChange("lambda")(event.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs uppercase tracking-wide text-slate-400", children: "MTBF" }), _jsx("input", { className: "mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none", type: "number", step: "any", value: selectedComponentData?.mtbf ?? "", onChange: (event) => handleComponentFieldChange("mtbf")(event.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs uppercase tracking-wide text-slate-400", children: "MTTR" }), _jsx("input", { className: "mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none", type: "number", step: "any", value: selectedComponentData?.mttr ?? "", onChange: (event) => handleComponentFieldChange("mttr")(event.target.value) })] }), !paramsValidation.ok && (_jsx("div", { className: "rounded border border-amber-400/60 bg-amber-400/10 px-3 py-2 text-xs text-amber-200", children: paramsValidation.warnings[0] })), _jsx("button", { type: "button", className: "w-full rounded border border-rose-500 px-3 py-2 text-sm font-medium text-rose-200 hover:bg-rose-500/10", onClick: handleRemoveSelected, children: "Komponente entfernen" })] }));
        }
        if (isKofNData(selectedNode.data)) {
            const { k, n } = selectedNode.data;
            const { ok, message } = isValidKofN(k, n);
            return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs uppercase tracking-wide text-slate-400", children: "k" }), _jsx("input", { className: "mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none", type: "number", min: 1, step: 1, value: k, onChange: (event) => setK(Number(event.target.value) || 1) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs uppercase tracking-wide text-slate-400", children: "n (Anzahl Komponenten)" }), _jsx("input", { className: "mt-1 w-full cursor-not-allowed rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-400", value: n, readOnly: true })] }), !ok && message && (_jsx("div", { className: "rounded border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-xs text-rose-200", children: message })), _jsx("p", { className: "text-xs text-slate-500", children: "n entspricht automatisch der Anzahl der verbundenen Komponenten." })] }));
        }
        return (_jsx("div", { className: "space-y-2 text-sm text-slate-500", children: _jsx("p", { children: "Root-Knoten benoetigt keine weiteren Eigenschaften." }) }));
    };
    const paletteButtonClass = "w-full rounded border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:border-sky-400 hover:text-sky-300";
    return (_jsx("div", { className: "space-y-4", children: _jsxs("div", { className: "grid gap-4 lg:grid-cols-[220px,minmax(0,1fr)] xl:grid-cols-[240px,minmax(0,1fr)]", children: [_jsxs("aside", { className: "space-y-3 lg:sticky lg:top-4", children: [_jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide text-slate-400", children: "Palette" }), _jsx("button", { type: "button", className: paletteButtonClass, onClick: () => setRoot("series"), children: "Root: Serie" }), _jsx("button", { type: "button", className: paletteButtonClass, onClick: () => setRoot("parallel"), children: "Root: Parallel" }), _jsx("button", { type: "button", className: paletteButtonClass, onClick: () => setRoot("kofn"), children: "Root: k-aus-n" }), _jsx("button", { type: "button", className: paletteButtonClass, onClick: addComponent, children: "+ Komponente" }), _jsx("button", { type: "button", className: paletteButtonClass, onClick: () => resetPreset("2-out-of-3"), children: "Preset: 2-out-of-3" })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "h-[640px] rounded-lg border border-slate-800 bg-slate-950/40 p-2", children: _jsxs(ReactFlow, { nodes: nodes, edges: edges, nodeTypes: nodeTypes, onNodesChange: setNodes, onEdgesChange: setEdges, onConnect: handleConnect, onNodeClick: handleNodeClick, onPaneClick: handlePaneClick, nodesDraggable: false, nodesConnectable: false, elementsSelectable: true, fitView: true, style: { width: "100%", height: "100%" }, children: [_jsx(Background, { gap: 24, size: 1, color: "#1e293b" }), _jsx(Controls, { showInteractive: false, position: "top-right" })] }) }), _jsxs("div", { className: "grid gap-4 lg:grid-cols-[minmax(0,1fr),280px]", children: [_jsxs("div", { className: "space-y-3", children: [validation.errors.length > 0 && (_jsx("div", { className: "rounded border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-sm text-rose-200", children: validation.errors[0] })), solveStatus === "pending" && (_jsx("div", { className: "rounded border border-sky-500/60 bg-sky-500/10 px-3 py-2 text-sm text-sky-200", children: "Berechnung laeuft..." })), solveStatus === "success" && kpis && (_jsxs("div", { className: "rounded border border-emerald-500/60 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-200", children: [_jsx("div", { className: "font-semibold", children: "[OK] Berechnung erfolgreich" }), _jsxs("div", { className: "mt-1 flex flex-wrap gap-4 text-xs text-emerald-100", children: [_jsxs("span", { children: ["R(0) = ", formatKpi(kpis.R_t0)] }), _jsxs("span", { children: ["R(t", _jsx("sub", { children: "max" }), ") = ", formatKpi(kpis.R_tmax)] })] })] })), solveStatus === "error" && solveError && (_jsx("div", { className: "rounded border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-sm text-rose-200", children: solveError })), solveWarnings.length > 0 && (_jsx("div", { className: "space-y-2", children: solveWarnings.map((warning) => (_jsx("div", { className: "rounded border border-amber-500/60 bg-amber-500/10 px-3 py-2 text-xs text-amber-200", children: warning }, warning))) }))] }), _jsx("div", { className: "rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200", children: renderProperties() })] })] })] }) }));
};
export default Canvas;
