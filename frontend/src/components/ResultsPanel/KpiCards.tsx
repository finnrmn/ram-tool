import type { SolveKpis } from "../../types";

type KpiCardsProps = {
  kpis: SolveKpis | null;
};

const formatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 4,
  maximumFractionDigits: 6,
});

const KpiCards = ({ kpis }: KpiCardsProps) => {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">KPIs</h2>
      <div className="mt-4 space-y-3">
        <div className="rounded border border-slate-800 bg-slate-950/40 px-3 py-2">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            R(0) @ t = {kpis ? kpis.t0 : 0}
          </div>
          <div className="text-xl font-semibold text-sky-400">
            {kpis ? formatter.format(kpis.R_t0) : "—"}
          </div>
        </div>
        <div className="rounded border border-slate-800 bg-slate-950/40 px-3 py-2">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            R(t<sub>max</sub>) @ t = {kpis ? kpis.tmax : 0}
          </div>
          <div className="text-xl font-semibold text-sky-400">
            {kpis ? formatter.format(kpis.R_tmax) : "—"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KpiCards;
