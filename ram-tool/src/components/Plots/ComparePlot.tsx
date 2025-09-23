import { useEffect, useMemo, useState } from "react";
import Plot from "react-plotly.js";

import { solveRbd, type ApiResponse } from "../../api/client";
import { useScenarioStore } from "../../store/useScenarioStore";
import { useFormulaStore } from "../../store/useFormulaStore";
import type { Scenario, SolveRbdResponse } from "../../types";
import { useTheme } from "../../theme/useTheme";
import { validateScenario } from "../../utils/validateScenario";

const prepareScenario = (scenario: Scenario, activeCount: number): Scenario => {
  if (scenario.structure.kind !== "kofn") {
    return scenario;
  }
  return {
    ...scenario,
    structure: {
      ...scenario.structure,
      n: activeCount,
    },
  };
};

type ComparePlotProps = {
  isActive: boolean;
};

const ComparePlot = ({ isActive }: ComparePlotProps) => {
  const scenario = useScenarioStore((state) => state.scenario);
  const { isDark } = useTheme();
  const [revision, setRevision] = useState(0);
  useEffect(() => setRevision(r => r + 1), [isDark]);
  const [data, setData] = useState<SolveRbdResponse | null>(null);
  const [componentLabels, setComponentLabels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const formulaStore = useFormulaStore.getState();

    if (!isActive) {
      return () => {
        isCancelled = true;
      };
    }

    const activeComponents = scenario.components.filter((component) => component.enabled);
    const labels = activeComponents.map((_, index) => `C${index + 1}`);

    const validation = validateScenario(scenario);
    if (!validation.isValid) {
      setError(validation.errors.join(" \n"));
      setComponentLabels(labels);
      setData(null);
      setIsLoading(false);
      formulaStore.clear();
      return () => {
        isCancelled = true;
      };
    }

    setIsLoading(true);
    setError(null);
    setData(null);

    const payload = prepareScenario(scenario, validation.activeCount);

    solveRbd(payload)
      .then((result: ApiResponse<SolveRbdResponse>) => {
        if (isCancelled) {
          return;
        }
        if (result.error || !result.data) {
          setError(result.error ?? "Unbekannter Fehler.");
          setComponentLabels(labels);
          formulaStore.clear();
          return;
        }
        setData(result.data);
        setComponentLabels(labels);
        formulaStore.setFromRbd(payload, result.data);
      })
      .catch((reason: unknown) => {
        if (!isCancelled) {
          setError(reason instanceof Error ? reason.message : "Unbekannter Fehler.");
          setComponentLabels(labels);
          formulaStore.clear();
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isActive, scenario]);

  const traces = useMemo(() => {
    if (!data) {
      return [];
    }

    const timePoints = data.r_curve.t;
    const systemTrace = {
      x: [...timePoints],
      y: [...data.r_curve.r],
      type: "scatter" as const,
      mode: "lines" as const,
      name: "System R(t)",
      line: { color: "#38bdf8", width: 2.5 },
      hovertemplate: "t=%{x:.2f}<br>R=%{y:.6f}<extra>%{fullData.name}</extra>",
    };

    const componentTraces = data.lambdas.map((lambda, index) => {
      const label = componentLabels[index] ?? `C${index + 1}`;
      const curve = timePoints.map((time) => Math.exp(-lambda * time));
      return {
        x: [...timePoints],
        y: [...curve],
        type: "scatter" as const,
        mode: "lines" as const,
        name: label,
        line: { width: 1 },
        hovertemplate: "t=%{x:.2f}<br>R=%{y:.6f}<extra>%{fullData.name}</extra>",
      };
    });

    return [systemTrace, ...componentTraces];
  }, [data, componentLabels]);

  const layout = useMemo(() => {
    const paperColor = isDark ? "#0f172a" : "#ffffff";
    const fontColor = isDark ? "#e2e8f0" : "#0f172a";
    const gridColor = isDark ? "#334155" : "#e2e8f0";
    const lineColor = isDark ? "#475569" : "#cbd5e1";

    return {
      autosize: true,
      margin: { t: 32, r: 16, b: 48, l: 56 },
      paper_bgcolor: paperColor,
      plot_bgcolor: paperColor,
      font: { color: fontColor },
      xaxis: {
        title: "t",
        zeroline: false,
        gridcolor: gridColor,
        linecolor: lineColor,
        tickcolor: lineColor,
      },
      yaxis: {
        title: "R(t)",
        range: [0, 1],
        gridcolor: gridColor,
        linecolor: lineColor,
        tickcolor: lineColor,
      },
      datarevision: revision,
    };
  }, [isDark, revision]);

  return (
    <div className="space-y-3">
      {data?.warnings?.length ? (
        <div className="space-y-2">
          {data.warnings.map((warning) => (
            <div
              key={warning}
              className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-400/60 dark:bg-amber-400/10 dark:text-amber-200"
            >
              {warning}
            </div>
          ))}
        </div>
      ) : null}

      <div className="h-[420px] rounded border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/70">
        {data ? (
          <Plot
            key={isDark ? "compare-dark" : "compare-light"}
            revision={revision}
            data={traces}
            layout={layout}
            config={{ displayModeBar: false, responsive: true }}
            useResizeHandler
            style={{ width: "100%", height: "100%", background: "transparent" }}
          />
        ) : isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-300">
            Berechnung laeuft...
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center rounded border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/60 dark:bg-rose-500/10 dark:text-rose-200">
            {error}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            Keine Daten verfuegbar. Passe das Szenario an, um eine Loesung zu erhalten.
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparePlot;
