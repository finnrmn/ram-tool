import Plot from "react-plotly.js";
import type { ReliabilityCurve } from "../../types";

type RPlotProps = {
  data: ReliabilityCurve | null;
  isLoading: boolean;
};

const RPlot = ({ data, isLoading }: RPlotProps) => {
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        Berechnung läuft…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
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
      layout={{
        autosize: true,
        margin: { t: 32, r: 16, b: 48, l: 56 },
        paper_bgcolor: "rgba(15,23,42,0)",
        plot_bgcolor: "rgba(15,23,42,0)",
        font: { color: "#e2e8f0" },
        xaxis: { title: "t", zeroline: false, gridcolor: "#1e293b" },
        yaxis: { title: "R(t)", range: [0, 1], gridcolor: "#1e293b" },
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: "100%", height: "100%" }}
    />
  );
};

export default RPlot;
