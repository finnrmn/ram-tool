import axios from "axios";
import { useState } from "react";
import Header from "../components/Header";
import ConverterCard from "../components/SidebarTools/ConverterCard";
import TemplatesCard from "../components/SidebarTools/TemplatesCard";
import SystemTable from "../components/SystemTable/SystemTable";
import RPlot from "../components/Plots/RPlot";
import APlot from "../components/Plots/APlot";
import ComparePlot from "../components/Plots/ComparePlot";
import DiagramCanvas from "../components/Diagram/Canvas";
import KpiCards from "../components/ResultsPanel/KpiCards";
import FormulaCard from "../components/Formula/FormulaCard";
import { solveRbd, type ApiResponse } from "../api/client";
import type { ReliabilityCurve, Scenario, SolveKpis, SolveRbdResponse, Structure } from "../types";
import { useScenarioStore } from "../store/useScenarioStore";
import { useFormulaStore } from "../store/useFormulaStore";
import { useDebouncedEffect } from "../utils/useDebouncedEffect";
import { validateScenario } from "../utils/validateScenario";

const plotTabs = [
  { id: "reliability", label: "R(t)" },
  { id: "availability", label: "A(t)" },
  { id: "compare", label: "Vergleich" },
  { id: "diagram", label: "Diagramm" },
] as const;

type PlotTabId = (typeof plotTabs)[number]["id"];

const Home = () => {
  const {
    scenario,
    reset,
    addComponent,
    updateComponent,
    removeComponent,
    updateStructure,
    updatePlotSettings,
  } = useScenarioStore();

  const [plotData, setPlotData] = useState<ReliabilityCurve | null>(null);
  const [kpis, setKpis] = useState<SolveKpis | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [solveError, setSolveError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSolving, setIsSolving] = useState(false);
  const [activePlotTab, setActivePlotTab] = useState<PlotTabId>("reliability");
  const [solveTrigger, setSolveTrigger] = useState<number>(0);

  const clearFormulaContext = () => {
    useFormulaStore.getState().clear();
  };

  const publishRbdFormulas = (scenarioData: Scenario, data: SolveRbdResponse) => {
    useFormulaStore.getState().setFromRbd(scenarioData, data);
  };

  const layoutClass =
    activePlotTab === "diagram"
      ? "lg:grid lg:grid-cols-[260px,minmax(0,1fr)] xl:grid-cols-[280px,minmax(0,1fr)]"
      : "lg:grid lg:grid-cols-[280px,1fr,360px]";

  const parseError = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
      const payload = (error.response?.data ?? {}) as { detail?: unknown };
      if (typeof payload.detail === "string") {
        return payload.detail;
      }
      if (payload.detail) {
        return JSON.stringify(payload.detail);
      }
      return error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return "Unbekannter Fehler.";
  };

  const handleSolve = () => {
    setSolveError(null);
    setSolveTrigger(Date.now());
  };

  const handleReset = () => {
    reset();
    setPlotData(null);
    setKpis(null);
    setWarnings([]);
    setSolveError(null);
    setValidationErrors([]);
    setActivePlotTab("reliability");
    clearFormulaContext();
  };

  const handleKindChange = (kind: Structure["kind"]) => {
    if (kind === "kofn") {
      const defaultComponents = scenario.components.length || 1;
      updateStructure({
        kind,
        k: scenario.structure.k ?? 1,
        n: scenario.structure.n ?? defaultComponents,
      });
    } else {
      updateStructure({ kind, k: undefined, n: undefined });
    }
  };

  const handleKChange = (value: number | undefined) => {
    updateStructure({ k: value });
  };

  const handleNChange = (value: number | undefined) => {
    updateStructure({ n: value });
  };

  const handleTMaxChange = (value: string) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return;
    }
    updatePlotSettings({ tMax: numeric });
  };

  const handleSamplesChange = (value: string) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return;
    }
    updatePlotSettings({ samples: Math.floor(numeric) });
  };

  const handleLogScaleChange = (checked: boolean) => {
    updatePlotSettings({ logScale: checked });
  };

  useDebouncedEffect(
    () => {
      if (!solveTrigger) {
        return;
      }

      const validation = validateScenario(scenario);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setSolveError(null);
        setWarnings([]);
        setPlotData(null);
        setKpis(null);
        setIsSolving(false);
        clearFormulaContext();
        return;
      }

      setValidationErrors([]);

      setIsSolving(true);

      const payload: Scenario = {
        ...scenario,
        structure:
          scenario.structure.kind === "kofn"
            ? {
                ...scenario.structure,
                n: validation.activeCount,
              }
            : { ...scenario.structure },
      };

      solveRbd(payload)
        .then((result: ApiResponse<SolveRbdResponse>) => {
          if (result.error || !result.data) {
            setPlotData(null);
            setKpis(null);
            setWarnings([]);
            setSolveError(result.error ?? "Unbekannter Fehler.");
            clearFormulaContext();
            return;
          }
          setPlotData(result.data.r_curve);
          setKpis(result.data.kpis);
          setWarnings(result.data.warnings ?? []);
          setSolveError(null);
          publishRbdFormulas(payload, result.data);
        })
        .catch((reason) => {
          setPlotData(null);
          setKpis(null);
          setWarnings([]);
          setSolveError(parseError(reason));
          clearFormulaContext();
        })
        .finally(() => {
          setIsSolving(false);
        });
    },
    [solveTrigger, scenario],
    300,
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      <Header
        structure={scenario.structure}
        componentCount={scenario.components.length}
        onKindChange={handleKindChange}
        onKChange={handleKChange}
        onNChange={handleNChange}
        onReset={handleReset}
      />
      <div className={`mx-auto flex max-w-screen-2xl flex-col gap-6 px-4 py-6 ${layoutClass}`}>
        <aside className="space-y-4 lg:sticky lg:top-6">
          <ConverterCard />
          <TemplatesCard onAddComponent={addComponent} />
        </aside>

        <main className="space-y-6">
          <SystemTable
            components={scenario.components}
            onUpdateComponent={updateComponent}
            onRemoveComponent={removeComponent}
          />

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex items-center gap-1 rounded border border-slate-300 bg-slate-100/80 p-1 transition-colors dark:border-slate-700 dark:bg-slate-900/60">
                {plotTabs.map((tab) => {
                  const isActive = activePlotTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      className={`rounded px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
                        isActive
                          ? "bg-sky-500 text-white"
                          : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                      }`}
                      onClick={() => setActivePlotTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              {activePlotTab !== "diagram" && (
                <>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">
                      t<sub>max</sub>
                    </label>
                    <input
                      className="mt-1 w-28 rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-sky-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      type="number"
                      min="0"
                      step="any"
                      value={scenario.plotSettings.tMax}
                      onChange={(event) => handleTMaxChange(event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">Samples</label>
                    <input
                      className="mt-1 w-24 rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-sky-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      type="number"
                      min="2"
                      step="1"
                      value={scenario.plotSettings.samples}
                      onChange={(event) => handleSamplesChange(event.target.value)}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-sky-500"
                      checked={Boolean(scenario.plotSettings.logScale)}
                      onChange={(event) => handleLogScaleChange(event.target.checked)}
                    />
                    logScale
                  </label>
                  <button
                    type="button"
                    className="ml-auto rounded bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleSolve}
                    disabled={isSolving}
                  >
                    {isSolving ? "Berechne..." : "Berechnen"}
                  </button>
                </>
              )}
            </div>

            <div className="mt-4">
              <div className={activePlotTab === "reliability" ? "space-y-4" : "hidden"}>
                {validationErrors.length > 0 && (
                  <div className="space-y-2">
                    {validationErrors.map((message) => (
                      <div
                        key={message}
                        className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/60 dark:bg-amber-500/10 dark:text-amber-200"
                      >
                        {message}
                      </div>
                    ))}
                  </div>
                )}

                {solveError && (
                  <div className="rounded border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/60 dark:bg-rose-500/10 dark:text-rose-200">
                    {solveError}
                  </div>
                )}

                {warnings.length > 0 && (
                  <div className="space-y-2">
                    {warnings.map((warning) => (
                      <div
                        key={warning}
                        className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-400/60 dark:bg-amber-400/10 dark:text-amber-200"
                      >
                        {warning}
                      </div>
                    ))}
                  </div>
                )}

                <div className="h-[420px]">
                  <RPlot data={plotData} isLoading={isSolving} />
                </div>
              </div>

              <div className={activePlotTab === "availability" ? "block" : "hidden"}>
                <APlot isActive={activePlotTab === "availability"} />
              </div>

              <div className={activePlotTab === "compare" ? "space-y-3" : "hidden"}>
                <ComparePlot isActive={activePlotTab === "compare"} />
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Komponentenlinien basieren auf den aktuellen lambda-Werten; bei k-aus-n bleibt die Systemlinie die MVP-Variante.
                </p>
              </div>

              <div className={activePlotTab === "diagram" ? "block" : "hidden"}>
                <DiagramCanvas />
              </div>
            </div>
          </div>
        </main>

        <aside className={`space-y-4 ${activePlotTab === "diagram" ? "lg:hidden" : ""}`}>
          <KpiCards kpis={kpis} />
          <FormulaCard />
        </aside>
      </div>
    </div>
  );
};
export default Home;
