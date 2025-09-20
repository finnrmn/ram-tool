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
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/70">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">KPIs</h2>
      <div className="mt-4 space-y-3">
        <div className="rounded border border-slate-200 bg-slate-100 px-3 py-2 transition-colors dark:border-slate-800 dark:bg-slate-950/40">
          <div className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">
            R(0) @ t = {kpis ? kpis.t0 : 0}
          </div>
          <div className="text-xl font-semibold text-sky-600 dark:text-sky-400">
            {kpis ? formatter.format(kpis.R_t0) : "-"}
          </div>
        </div>
        <div className="rounded border border-slate-200 bg-slate-100 px-3 py-2 transition-colors dark:border-slate-800 dark:bg-slate-950/40">
          <div className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">
            R(t<sub>max</sub>) @ t = {kpis ? kpis.tmax : 0}
          </div>
          <div className="text-xl font-semibold text-sky-600 dark:text-sky-400">
            {kpis ? formatter.format(kpis.R_tmax) : "-"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KpiCards;
