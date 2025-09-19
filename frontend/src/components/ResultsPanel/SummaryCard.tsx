import type { Scenario } from "../../types";

type SummaryCardProps = {
  scenario: Scenario;
};

const SummaryCard = ({ scenario }: SummaryCardProps) => {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Scenario JSON</h2>
      <pre className="mt-3 max-h-80 overflow-auto rounded bg-slate-950/80 px-3 py-2 text-xs text-slate-300">
        {JSON.stringify(scenario, null, 2)}
      </pre>
    </div>
  );
};

export default SummaryCard;
