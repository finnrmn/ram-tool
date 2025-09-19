import { ChangeEvent } from "react";
import type { Structure } from "../types";

type HeaderProps = {
  structure: Structure;
  componentCount: number;
  onKindChange: (kind: Structure["kind"]) => void;
  onKChange: (value: number | undefined) => void;
  onNChange: (value: number | undefined) => void;
  onReset: () => void;
};

const Header = ({
  structure,
  componentCount,
  onKindChange,
  onKChange,
  onNChange,
  onReset,
}: HeaderProps) => {
  const handleKindSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    onKindChange(event.target.value as Structure["kind"]);
  };

  const handleKInput = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    onKChange(value === "" ? undefined : Number(value));
  };

  const handleNInput = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    onNChange(value === "" ? undefined : Number(value));
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/80">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-sky-400">RAM Tool</h1>
          <p className="text-sm text-slate-400">Reliability &amp; Availability explorer</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs uppercase tracking-wide text-slate-400">Systemtyp</label>
          <select
            className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-400 focus:outline-none"
            value={structure.kind}
            onChange={handleKindSelect}
          >
            <option value="series">Serie</option>
            <option value="parallel">Parallel</option>
            <option value="kofn">k-aus-n</option>
          </select>
          {structure.kind === "kofn" && (
            <div className="flex items-center gap-2">
              <input
                className="w-16 rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm focus:border-sky-400 focus:outline-none"
                type="number"
                min={1}
                step={1}
                value={structure.k ?? ""}
                placeholder="k"
                onChange={handleKInput}
              />
              <input
                className="w-16 rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm focus:border-sky-400 focus:outline-none"
                type="number"
                min={1}
                step={1}
                value={structure.n ?? ""}
                placeholder={`n (≥ ${Math.max(componentCount, 1)})`}
                onChange={handleNInput}
              />
            </div>
          )}
          <button
            type="button"
            className="rounded border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 hover:border-sky-400 hover:text-sky-300"
            onClick={onReset}
          >
            Neu
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
