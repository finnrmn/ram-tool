import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import Plot from "react-plotly.js";
import { solveAvailability } from "../../api/client";
import type { AvailabilityCurve } from "../../types";
import { useScenarioStore } from "../../store/useScenarioStore";
import { useTheme } from "../../theme/useTheme";

type APlotProps = {
  apiOffline: boolean;
};

const APlot = ({ apiOffline }: APlotProps) => {
  const scenario = useScenarioStore((state) => state.scenario);
  const { isDark } = useTheme();
  const activeComponents = useMemo(
    () => scenario.components.filter((component) => component.enabled),
    [scenario.components],
  );
  const hasActiveComponents = activeComponents.length > 0;

  const [curve, setCurve] = useState<AvailabilityCurve | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const parseError = (reason: unknown): string => {
    if (axios.isAxiosError(reason)) {
      const payload = (reason.response?.data ?? {}) as { detail?: unknown };
      if (typeof payload.detail === "string") {
        return payload.detail;
      }
      if (payload.detail) {
        return JSON.stringify(payload.detail);
      }
      return reason.message;
    }
    if (reason instanceof Error) {
      return reason.message;
    }
    return "Unbekannter Fehler.";
  };

  useEffect(() => {
    let isCurrent = true;

    if (!hasActiveComponents) {
      setCurve(null);
      setWarnings([]);
      setError(null);
      setIsLoading(false);
      return () => {
        isCurrent = false;
      };
    }

    if (apiOffline) {
      setCurve(null);
      setWarnings([]);
      setError("API ist aktuell nicht erreichbar.");
      setIsLoading(false);
      return () => {
        isCurrent = false;
      };
    }

    setIsLoading(true);
    setError(null);

    solveAvailability(scenario)
      .then((result) => {
        if (!isCurrent) {
          return;
        }
        setCurve(result.a_curve);
        setWarnings(result.warnings ?? []);
      })
      .catch((reason) => {
        if (!isCurrent) {
          return;
        }
        setCurve(null);
        setWarnings([]);
        setError(parseError(reason));
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [apiOffline, hasActiveComponents, scenario]);

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
        title: "A(t)",
        range: [0, 1],
        gridcolor: gridColor,
        linecolor: lineColor,
      },
    };
  }, [isDark]);

  const renderPlotBody = () => {
    if (!hasActiveComponents) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
          Aktiviere mindestens eine Komponente.
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-rose-700 dark:text-rose-200">
          Berechnung fehlgeschlagen.
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-300">
          Berechnung laeuft.
        </div>
      );
    }

    if (!curve) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
          Keine A(t)-Daten vorhanden.
        </div>
      );
    }

    return (
      <Plot
        data={[
          {
            x: curve.t,
            y: curve.a,
            type: "scatter",
            mode: "lines",
            line: { color: "#facc15", width: 2 },
            hovertemplate: "t=%{x:.2f}<br>A=%{y:.6f}<extra></extra>",
          },
        ]}
        layout={layout}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: "100%", height: "100%" }}
      />
    );
  };

  return (
    <div className="space-y-3">
      <div className="h-[420px] rounded border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/70">
        {renderPlotBody()}
      </div>

      {error && (
        <div className="rounded border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/60 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
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
    </div>
  );
};

export default APlot;
