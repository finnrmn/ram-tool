type TemplatesCardProps = {
  onAddComponent: () => void;
};

const TemplatesCard = ({ onAddComponent }: TemplatesCardProps) => {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Templates</h2>
      <p className="mt-2 text-xs text-slate-400">Füge Komponenten mit Standardwerten hinzu.</p>
      <button
        type="button"
        className="mt-3 w-full rounded border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-sky-400 hover:text-sky-300"
        onClick={onAddComponent}
      >
        + Komponente
      </button>
    </div>
  );
};

export default TemplatesCard;
