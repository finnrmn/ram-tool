import { useMemo } from "react";
import Plot from "react-plotly.js";
import type { ReliabilityCurve } from "../../types";
import { useTheme } from "../../theme/useTheme";

type RPlotProps = {
  data: ReliabilityCurve | null;
  isLoading: boolean;
};

const RPlot = ({ data, isLoading }: RPlotProps) => {
  const { isDark } = useTheme();

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
    };
  }, [isDark]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-300">
        Berechnung laeuft.
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Starte eine Berechnung, um R(t) zu sehen.
      </div>
    );
  }

  return (
    <Plot
      data={[
        {
          x: data.t,
          y: data.r,
          type: "scatter",
          mode: "lines",
          line: { color: "#38bdf8", width: 2 },
          hovertemplate: "t=%{x:.2f}<br>R=%{y:.6f}<extra></extra>",
        },
      ]}
      layout={layout}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: "100%", height: "100%" }}
    />
  );
};

export default RPlot;
