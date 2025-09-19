import type { ChangeEvent } from "react";
import type { Component } from "../../types";
import type { ComponentPatch } from "../../store/useScenarioStore";

type ComponentRowProps = {
  component: Component;
  onUpdate: (id: string, patch: ComponentPatch) => void;
  onRemove: (id: string) => void;
};

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
    <tr>
      <td className="px-4 py-2">
        <input
          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm focus:border-sky-400 focus:outline-none"
          value={component.name}
          onChange={handleNameChange}
        />
      </td>
      <td className="px-4 py-2 text-slate-400">
        {component.distribution.type === "exponential" ? "Exponential" : component.distribution.type}
      </td>
      <td className="px-4 py-2">
        <input
          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm focus:border-sky-400 focus:outline-none"
          type="number"
          step="any"
          value={component.distribution.lambda ?? ""}
          onChange={handleLambdaChange}
        />
      </td>
      <td className="px-4 py-2">
        <input
          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm focus:border-sky-400 focus:outline-none"
          type="number"
          step="any"
          value={component.distribution.mtbf ?? ""}
          onChange={handleMtbfChange}
        />
      </td>
      <td className="px-4 py-2">
        <input
          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm focus:border-sky-400 focus:outline-none"
          type="number"
          step="any"
          value={component.mttr ?? ""}
          onChange={handleMttrChange}
        />
      </td>
      <td className="px-4 py-2 text-right">
        <button
          type="button"
          className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-rose-500 hover:text-rose-300"
          onClick={() => onRemove(component.id)}
        >
          Entfernen
        </button>
      </td>
    </tr>
  );
};

export default ComponentRow;

