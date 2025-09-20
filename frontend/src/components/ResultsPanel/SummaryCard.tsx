import type { Scenario } from "../../types";

type SummaryCardProps = {
  scenario: Scenario;
};

const SummaryCard = ({ scenario }: SummaryCardProps) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/70">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Scenario JSON</h2>
      <pre className="mt-3 max-h-80 overflow-auto rounded border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-700 transition-colors dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-300">
        {JSON.stringify(scenario, null, 2)}
      </pre>
    </div>
  );
};

export default SummaryCard;
