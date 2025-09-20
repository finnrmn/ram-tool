import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import Plot from "react-plotly.js";

import { solveRbd } from "../../api/client";
import { useScenarioStore } from "../../store/useScenarioStore";
import type { SolveRbdResponse } from "../../types";
import { useTheme } from "../../theme/useTheme";

const ComparePlot = () => {
  const scenario = useScenarioStore((state) => state.scenario);
  const { isDark } = useTheme();
  const [data, setData] = useState<SolveRbdResponse | null>(null);
  const [componentLabels, setComponentLabels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const parseError = (value: unknown): string => {
    if (axios.isAxiosError(value)) {
      const payload = (value.response?.data ?? {}) as { detail?: unknown };
      if (typeof payload.detail === "string") {
        return payload.detail;
      }
      if (payload.detail) {
        return JSON.stringify(payload.detail);
      }
      return value.message;
    }
    if (value instanceof Error) {
      return value.message;
    }
    return "Unbekannter Fehler.";
  };

  useEffect(() => {
    let isCancelled = false;
    const activeComponents = scenario.components.filter((component) => component.enabled);
    const labels = activeComponents.map((_, index) => `C${index + 1}`);

    setIsLoading(true);
    setError(null);
    setData(null);

    solveRbd(scenario)
      .then((response) => {
        if (isCancelled) {
          return;
        }
        setData(response);
        setComponentLabels(labels);
      })
      .catch((err) => {
        if (isCancelled) {
          return;
        }
        setError(parseError(err));
        setComponentLabels(labels);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [scenario]);

  const traces = useMemo(() => {
    if (!data) {
      return [];
    }

    const timePoints = data.r_curve.t;
    const systemTrace = {
      x: timePoints,
      y: data.r_curve.r,
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
        x: timePoints,
        y: curve,
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
      },
      yaxis: {
        title: "R(t)",
        range: [0, 1],
        gridcolor: gridColor,
        linecolor: lineColor,
      },
    };
  }, [isDark]);

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
            data={traces}
            layout={layout}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: "100%", height: "100%" }}
          />
        ) : isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-300">
            Berechnung laeuft...
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            Keine Daten verfuegbar. Passe das Szenario an, um eine Loesung zu erhalten.
          </div>
        )}
      </div>

      {error && (
        <div className="rounded border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/60 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      )}
    </div>
  );
};

export default ComparePlot;
