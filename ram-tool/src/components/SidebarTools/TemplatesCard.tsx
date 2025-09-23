type TemplatesCardProps = {
  onAddComponent: () => void;
};

const TemplatesCard = ({ onAddComponent }: TemplatesCardProps) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/70">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Templates</h2>
      <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">Füge Komponenten mit Standardwerten hinzu.</p>
      <button
        type="button"
        className="mt-3 w-full rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-sky-400 hover:text-sky-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-sky-500 dark:hover:text-sky-300"
        onClick={onAddComponent}
      >
        + Komponente
      </button>
    </div>
  );
};

export default TemplatesCard;
