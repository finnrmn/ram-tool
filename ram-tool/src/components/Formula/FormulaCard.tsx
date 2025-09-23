import { useEffect, useMemo, useState } from "react";
import { BlockMath } from "react-katex";
import { useFormulaStore } from "../../store/useFormulaStore";

const toggleClasses = (isActive: boolean) =>
  `rounded px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
    isActive
      ? "bg-sky-500 text-white"
      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
  }`;

type ViewMode = "general" | "values";

const FormulaCard = () => {
  const context = useFormulaStore((state) => state.context);
  const [mode, setMode] = useState<ViewMode>("general");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const hasValueFormulas = useMemo(
    () => Boolean(context?.equations.some((equation) => equation.latexWithValues)),
    [context],
  );

  useEffect(() => {
    setMode("general");
    setCopiedId(null);
  }, [context?.kind]);

  useEffect(() => {
    if (!hasValueFormulas && mode === "values") {
      setMode("general");
    }
  }, [hasValueFormulas, mode]);

  const handleCopy = async (equationId: string, latex: string) => {
    try {
      await navigator.clipboard.writeText(latex);
      setCopiedId(equationId);
      window.setTimeout(() => setCopiedId((current) => (current === equationId ? null : current)), 2000);
    } catch (error) {
      console.error("Clipboard copy failed", error);
      setCopiedId(null);
    }
  };

  if (!context || context.equations.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
        Formel wird angezeigt, sobald gültige Eingaben vorliegen.
      </div>
    );
  }

  return (
    <div className="flex max-h-[520px] flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Formeln</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={toggleClasses(mode === "general")}
            onClick={() => setMode("general")}
          >
            Allgemein
          </button>
          <button
            type="button"
            className={toggleClasses(mode === "values")}
            onClick={() => setMode("values")}
            disabled={!hasValueFormulas}
          >
            Eingesetzt
          </button>
        </div>
      </div>

      <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
        {context.equations.map((equation) => {
          const latex = mode === "values" && equation.latexWithValues ? equation.latexWithValues : equation.latexGeneral;
          const canCopy = Boolean(latex);
          const isCopied = copiedId === equation.id;

          return (
            <div key={equation.id} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {equation.title}
                </span>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-600 transition-colors hover:border-sky-400 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:text-sky-400"
                  onClick={() => canCopy && handleCopy(equation.id, latex)}
                  disabled={!canCopy}
                >
                  <span>{isCopied ? "Kopiert" : "LaTeX kopieren"}</span>
                </button>
              </div>
              <div className="rounded border border-slate-100 bg-slate-50 p-3 text-slate-700 shadow-inner overflow-x-auto dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                <BlockMath math={latex} errorColor="#ef4444" />
              </div>
              {equation.note && (
                <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-400/60 dark:bg-amber-500/10 dark:text-amber-200">
                  <BlockMath math={equation.note} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FormulaCard;