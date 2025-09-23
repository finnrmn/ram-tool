import { useEffect, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  type Connection,
  type NodeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";

import { solveRbd, type ApiResponse } from "../../api/client";
import type { SolveRbdResponse } from "../../types";
import { useScenarioStore } from "../../store/useScenarioStore";
import { useFormulaStore } from "../../store/useFormulaStore";
import { serializeDiagram } from "./serialize";
import { useDiagramStore } from "./useDiagramStore";
import { isComponentData, isKofNData, type ComponentData } from "./types";
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
} as const;

const parseNumberInput = (value: string) => {
  if (value.trim() === "") {
    return undefined;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

const formatKpi = (value?: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }
  return value.toFixed(6);
};

const parseErrorMessage = (error: unknown): string => {
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unbekannter Fehler.";
};

const Canvas = () => {
  const {
    nodes,
    edges,
    rootKind,
    selectedNodeId,
    validation,
    solveStatus,
    solveError,
    solveWarnings,
    kpis,
    setNodes,
    setEdges,
    setSelectedNodeId,
    setRoot,
    addComponent,
    removeNode,
    setNodeData,
    setK,
    setN,
    resetPreset,
    connect,
    setValidation,
    setSolvePending,
    setSolveSuccess,
    setSolveError,
    setValidationError,
  } = useDiagramStore();
  const setScenario = useScenarioStore((state) => state.setScenario);

  const solveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      const dedupe = (items: string[]) => Array.from(new Set(items.filter(Boolean)));
      const formulaStore = useFormulaStore.getState();
      if (!scenarioResult || result.errors.length > 0) {
        const message = result.errors[0] ?? "Diagramm unvollstaendig.";
        setValidationError(message, dedupe(result.warnings));
        formulaStore.clear();
        return;
      }

      setSolvePending(scenarioResult, dedupe(result.warnings));
      requestRef.current += 1;
      const activeRequest = requestRef.current;

      solveRbd(scenarioResult)
        .then((response: ApiResponse<SolveRbdResponse>) => {
          if (activeRequest !== requestRef.current) {
            return;
          }
          if (response.error || !response.data) {
            setSolveError(response.error ?? "Unbekannter Fehler.");
            formulaStore.clear();
            return;
          }
          const combinedWarnings = dedupe([...result.warnings, ...(response.data.warnings ?? [])]);
          setSolveSuccess(response.data.kpis, combinedWarnings);
          formulaStore.setFromRbd(scenarioResult, response.data);
          setScenario(scenarioResult);
        })
        .catch((error) => {
          if (activeRequest !== requestRef.current) {
            return;
          }
          setSolveError(parseErrorMessage(error));
          formulaStore.clear();
        });
    }, 400);

    return () => {
      if (solveTimerRef.current) {
        clearTimeout(solveTimerRef.current);
      }
    };
  }, [nodes, edges, rootKind, setValidation, setSolvePending, setSolveSuccess, setSolveError, setScenario, setValidationError]);

  const handleConnect = (connection: Connection) => {
    connect(connection);
  };

  const handleNodeClick: NodeMouseHandler = (_, node) => {
    setSelectedNodeId(node.id);
  };

  const handlePaneClick = () => {
    setSelectedNodeId(null);
  };

  const handleComponentFieldChange = (field: keyof ComponentData) => (value: string) => {
    if (!selectedComponentData || !selectedNode) {
      return;
    }
    if (field === "name") {
      setNodeData(selectedNode.id, { name: value });
      return;
    }
    const numericValue = parseNumberInput(value);
    setNodeData(selectedNode.id, { [field]: numericValue } as Partial<ComponentData>);
  };

  const handleRemoveSelected = () => {
    if (selectedNode && isComponentData(selectedNode.data)) {
      removeNode(selectedNode.id);
    }
  };

  const renderProperties = () => {
    if (!selectedNode) {
      return <p className="text-sm text-slate-500">Waehle einen Knoten aus, um Eigenschaften zu bearbeiten.</p>;
    }

    if (isComponentData(selectedNode.data)) {
      const paramsValidation = validateComponentParams(selectedNode.data);
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">Name</label>
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
              value={selectedComponentData?.name ?? ""}
              onChange={(event) => handleComponentFieldChange("name")(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">lambda</label>
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
              type="number"
              step="any"
              value={selectedComponentData?.lambda ?? ""}
              onChange={(event) => handleComponentFieldChange("lambda")(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">MTBF</label>
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
              type="number"
              step="any"
              value={selectedComponentData?.mtbf ?? ""}
              onChange={(event) => handleComponentFieldChange("mtbf")(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">MTTR</label>
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
              type="number"
              step="any"
              value={selectedComponentData?.mttr ?? ""}
              onChange={(event) => handleComponentFieldChange("mttr")(event.target.value)}
            />
          </div>
          {!paramsValidation.ok && (
            <div className="rounded border border-amber-400/60 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
              {paramsValidation.warnings[0]}
            </div>
          )}
          <button
            type="button"
            className="w-full rounded border border-rose-500 px-3 py-2 text-sm font-medium text-rose-200 hover:bg-rose-500/10"
            onClick={handleRemoveSelected}
          >
            Komponente entfernen
          </button>
        </div>
      );
    }

    if (isKofNData(selectedNode.data)) {
      const { k, n } = selectedNode.data;
      const { ok, message } = isValidKofN(k, n);
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">k</label>
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
              type="number"
              min={1}
              step={1}
              value={k}
              onChange={(event) => setK(Number(event.target.value) || 1)}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">n (Anzahl Komponenten)</label>
            <input
              className="mt-1 w-full cursor-not-allowed rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-400"
              value={n}
              readOnly
            />
          </div>
          {!ok && message && (
            <div className="rounded border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{message}</div>
          )}
          <p className="text-xs text-slate-500">n entspricht automatisch der Anzahl der verbundenen Komponenten.</p>
        </div>
      );
    }

    return (
      <div className="space-y-2 text-sm text-slate-500">
        <p>Root-Knoten benötigt keine weiteren Eigenschaften.</p>
      </div>
    );
  };

  const paletteButtonClass =
    "w-full rounded border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:border-sky-400 hover:text-sky-300";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[280px,minmax(0,1fr)] xl:grid-cols-[300px,minmax(0,1fr)]">
        <div className="space-y-4">
          <aside className="space-y-3 lg:sticky lg:top-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Palette</h3>
            <button
              type="button"
              className={paletteButtonClass}
              onClick={() => setRoot("series")}
            >
              Root: Serie
            </button>
            <button
              type="button"
              className={paletteButtonClass}
              onClick={() => setRoot("parallel")}
            >
              Root: Parallel
            </button>
            <button
              type="button"
              className={paletteButtonClass}
              onClick={() => setRoot("kofn")}
            >
              Root: k-aus-n
            </button>
            <button type="button" className={paletteButtonClass} onClick={addComponent}>
              + Komponente
            </button>
            <button type="button" className={paletteButtonClass} onClick={() => resetPreset("2-out-of-3")}>
              Preset: 2-out-of-3
            </button>
          </aside>

          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
            {renderProperties()}
          </div>
        </div>

        <div className="space-y-4">
          <div className="h-[640px] rounded-lg border border-slate-800 bg-slate-950/40 p-2">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={setNodes}
              onEdgesChange={setEdges}
              onConnect={handleConnect}
              onNodeClick={handleNodeClick}
              onPaneClick={handlePaneClick}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable
              fitView
              style={{ width: "100%", height: "100%" }}
            >
              <Background gap={24} size={1} color="#1e293b" />
              <Controls showInteractive={false} position="top-right" />
            </ReactFlow>
          </div>

          <div className="space-y-3">
            {validation.errors.length > 0 && (
              <div className="rounded border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/60 dark:bg-rose-500/10 dark:text-rose-200">
                {validation.errors[0]}
              </div>
            )}

            {solveStatus === "pending" && (
              <div className="rounded border border-sky-300 bg-sky-50 px-3 py-2 text-sm text-sky-700 dark:border-sky-500/60 dark:bg-sky-500/10 dark:text-sky-200">
                Berechnung laeuft...
              </div>
            )}

            {solveStatus === "success" && kpis && (
              <div className="rounded border border-emerald-300 bg-emerald-50 px-3 py-3 text-sm text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-500/10 dark:text-emerald-200">
                <div className="font-semibold">[OK] Berechnung erfolgreich</div>
                <div className="mt-1 flex flex-wrap gap-4 text-xs text-emerald-600 dark:text-emerald-100">
                  <span>R(0) = {formatKpi(kpis.R_t0)}</span>
                  <span>R(t<sub>max</sub>) = {formatKpi(kpis.R_tmax)}</span>
                </div>
              </div>
            )}

            {solveStatus === "error" && solveError && (validation.errors.length === 0 || solveError !== validation.errors[0]) && (
              <div className="rounded border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/60 dark:bg-rose-500/10 dark:text-rose-200">
                {solveError}
              </div>
            )}

            {solveWarnings.length > 0 && (
              <div className="space-y-2">
                {solveWarnings.map((warning) => (
                  <div
                    key={warning}
                    className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/60 dark:bg-amber-500/10 dark:text-amber-200"
                  >
                    {warning}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Canvas;
