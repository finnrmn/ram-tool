import type { ChangeEvent } from "react";
import type { Component } from "../../types";
import type { ComponentPatch } from "../../store/useScenarioStore";

type ComponentRowProps = {
  component: Component;
  onUpdate: (id: string, patch: ComponentPatch) => void;
  onRemove: (id: string) => void;
};

const inputClasses =
  "w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 shadow-sm transition-colors focus:border-sky-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

const ComponentRow = ({ component, onUpdate, onRemove }: ComponentRowProps) => {
  const parseNumber = (value: string): number | undefined => {
    if (value === "") {
      return undefined;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    onUpdate(component.id, { name: event.target.value });
  };

  const handleLambdaChange = (event: ChangeEvent<HTMLInputElement>) => {
    onUpdate(component.id, { distribution: { type: "exponential", lambda: parseNumber(event.target.value) } });
  };

  const handleMtbfChange = (event: ChangeEvent<HTMLInputElement>) => {
    onUpdate(component.id, { distribution: { type: "exponential", mtbf: parseNumber(event.target.value) } });
  };

  const handleMttrChange = (event: ChangeEvent<HTMLInputElement>) => {
    onUpdate(component.id, { mttr: parseNumber(event.target.value) });
  };

  return (
    <tr className="bg-white transition-colors odd:bg-slate-50 dark:bg-slate-900/40 dark:odd:bg-slate-900/20">
      <td className="px-4 py-2">
        <input className={inputClasses} value={component.name} onChange={handleNameChange} />
      </td>
      <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
        {component.distribution.type === "exponential" ? "Exponential" : component.distribution.type}
      </td>
      <td className="px-4 py-2">
        <input
          className={inputClasses}
          type="number"
          step="any"
          value={component.distribution.lambda ?? ""}
          onChange={handleLambdaChange}
        />
      </td>
      <td className="px-4 py-2">
        <input
          className={inputClasses}
          type="number"
          step="any"
          value={component.distribution.mtbf ?? ""}
          onChange={handleMtbfChange}
        />
      </td>
      <td className="px-4 py-2">
        <input
          className={inputClasses}
          type="number"
          step="any"
          value={component.mttr ?? ""}
          onChange={handleMttrChange}
        />
      </td>
      <td className="px-4 py-2 text-right">
        <button
          type="button"
          className="rounded border border-slate-300 px-3 py-1 text-xs text-slate-700 transition-colors hover:border-rose-400 hover:text-rose-500 dark:border-slate-700 dark:text-slate-200 dark:hover:border-rose-500 dark:hover:text-rose-300"
          onClick={() => onRemove(component.id)}
        >
          Entfernen
        </button>
      </td>
    </tr>
  );
};

export default ComponentRow;
