import { ChangeEvent } from "react";
import type { ApiStatus } from "../App";
import type { Structure } from "../types";
import { useTheme } from "../theme/useTheme";

type HeaderProps = {
  structure: Structure;
  componentCount: number;
  apiStatus: ApiStatus;
  onRetryHealth?: () => void;
  onKindChange: (kind: Structure["kind"]) => void;
  onKChange: (value: number | undefined) => void;
  onNChange: (value: number | undefined) => void;
  onReset: () => void;
};

const Header = ({
  structure,
  componentCount,
  apiStatus,
  onRetryHealth,
  onKindChange,
  onKChange,
  onNChange,
  onReset,
}: HeaderProps) => {
  const { theme, isDark, toggleTheme } = useTheme();

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

  const statusLabel = apiStatus === "ok" ? "API OK" : apiStatus === "off" ? "API OFF" : "API ?";
  const statusColor = apiStatus === "ok" ? "bg-emerald-400" : apiStatus === "off" ? "bg-rose-500" : "bg-slate-400";
  const statusTextClass =
    apiStatus === "ok"
      ? "text-emerald-600 dark:text-emerald-300"
      : apiStatus === "off"
      ? "text-rose-600 dark:text-rose-300"
      : "text-slate-600 dark:text-slate-300";

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-sky-600 dark:text-sky-400">RAM Tool</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Reliability & Availability explorer</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-300">
          <button
            type="button"
            className={`flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium shadow-sm transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 ${statusTextClass}`}
            onClick={onRetryHealth}
            title="API-Status aktualisieren"
          >
            <span className={`inline-block h-2 w-2 rounded-full ${statusColor} ${apiStatus === "off" ? "animate-pulse" : ""}`} />
            {statusLabel}
          </button>

          <label className="text-xs uppercase tracking-wide">Systemtyp</label>
          <select
            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-sky-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
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
                className="w-16 rounded border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-sky-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                type="number"
                min={1}
                step={1}
                value={structure.k ?? ""}
                placeholder="k"
                onChange={handleKInput}
              />
              <input
                className="w-16 rounded border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-sky-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                type="number"
                min={1}
                step={1}
                value={structure.n ?? ""}
                placeholder={`n (= ${Math.max(componentCount, 1)})`}
                onChange={handleNInput}
              />
            </div>
          )}
          <button
            type="button"
            className="rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-sky-400 hover:text-sky-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-sky-500 dark:hover:text-sky-300"
            onClick={onReset}
          >
            Neu
          </button>
          <button
            type="button"
            aria-label={`Wechsle zu ${isDark ? "Light" : "Dark"}-Modus`}
            className="flex items-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-sky-400 hover:text-sky-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-sky-500 dark:hover:text-sky-300"
            onClick={toggleTheme}
          >
            <span aria-hidden className="text-lg leading-none">
              {isDark ? "🌙" : "☀️"}
            </span>
            <span className="text-sm font-semibold">{theme === "dark" ? "Dark" : "Light"}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
