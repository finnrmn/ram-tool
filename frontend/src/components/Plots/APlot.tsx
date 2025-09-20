import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import Plot from "react-plotly.js";
import { solveAvailability } from "../../api/client";
import type { AvailabilityCurve } from "../../types";
import { useScenarioStore } from "../../store/useScenarioStore";

type APlotProps = {
  apiOffline: boolean;
};

const APlot = ({ apiOffline }: APlotProps) => {
  const scenario = useScenarioStore((state) => state.scenario);
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

  const renderPlotBody = () => {
    if (!hasActiveComponents) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-slate-500">
          Aktiviere mindestens eine Komponente.
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-rose-200">
          Berechnung fehlgeschlagen.
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-slate-400">
          Berechnung laeuft.
        </div>
      );
    }

    if (!curve) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-slate-500">
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
        layout={{
          autosize: true,
          margin: { t: 32, r: 16, b: 48, l: 56 },
          paper_bgcolor: "rgba(15,23,42,0)",
          plot_bgcolor: "rgba(15,23,42,0)",
          font: { color: "#e2e8f0" },
          xaxis: {
            title: "t",
            zeroline: false,
            gridcolor: "#1e293b",
            type: scenario.plotSettings.logScale ? "log" : "linear",
          },
          yaxis: { title: "A(t)", range: [0, 1], gridcolor: "#1e293b" },
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: "100%", height: "100%" }}
      />
    );
  };

  return (
    <div className="space-y-3">
      <div className="h-[420px] rounded border border-slate-800 bg-slate-950/40">
        {renderPlotBody()}
      </div>

      {error && (
        <div className="rounded border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((warning) => (
            <div
              key={warning}
              className="rounded border border-amber-400/60 bg-amber-400/10 px-3 py-2 text-xs text-amber-200"
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
