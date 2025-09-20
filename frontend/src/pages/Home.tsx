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
import SummaryCard from "../components/ResultsPanel/SummaryCard";
import { solveRbd } from "../api/client";
import type { ReliabilityCurve, SolveKpis, Structure } from "../types";
import { useScenarioStore } from "../store/useScenarioStore";

type HomeProps = {
  apiOffline: boolean;
};

const plotTabs = [
  { id: "reliability", label: "R(t)" },
  { id: "availability", label: "A(t)" },
  { id: "compare", label: "Vergleich" },
  { id: "diagram", label: "Diagramm" },
] as const;

type PlotTabId = (typeof plotTabs)[number]["id"];

const Home = ({ apiOffline }: HomeProps) => {
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
  const [isSolving, setIsSolving] = useState(false);
  const [activePlotTab, setActivePlotTab] = useState<PlotTabId>("reliability");

  const layoutClass =
    activePlotTab === "diagram"
      ? "lg:grid lg:grid-cols-[260px,minmax(0,1fr)] xl:grid-cols-[280px,minmax(0,1fr)]"
      : "lg:grid lg:grid-cols-[280px,1fr,280px]";

  const parseError = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
      const data = (error.response?.data ?? {}) as { detail?: unknown };
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
    } catch (error) {
      setPlotData(null);
      setKpis(null);
      setWarnings([]);
      setSolveError(parseError(error));
    } finally {
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      <Header
        structure={scenario.structure}
        componentCount={scenario.components.length}
        onKindChange={handleKindChange}
        onKChange={handleKChange}
        onNChange={handleNChange}
        onReset={handleReset}
      />
      {apiOffline && (
        <div className="bg-amber-100 text-center text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          <span className="inline-block py-2">API offline?</span>
        </div>
      )}
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
                <APlot apiOffline={apiOffline} />
              </div>

              <div className={activePlotTab === "compare" ? "space-y-3" : "hidden"}>
                <ComparePlot />
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
          <SummaryCard scenario={scenario} />
        </aside>
      </div>
    </div>
  );
};
export default Home;
