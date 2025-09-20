import axios from "axios";
import { useState } from "react";
import { convert } from "../../api/client";
import type { ConvertResponse } from "../../types";

const inputClasses =
  "mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-sky-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

const ConverterCard = () => {
  const [mtbf, setMtbf] = useState("");
  const [lambda, setLambda] = useState("");
  const [mttr, setMttr] = useState("");
  const [result, setResult] = useState<ConvertResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const extractError = (errorValue: unknown): string => {
    if (axios.isAxiosError(errorValue)) {
      const data = (errorValue.response?.data ?? {}) as { detail?: unknown };
      if (typeof data.detail === "string") {
        return data.detail;
      }
      if (data.detail) {
        return JSON.stringify(data.detail);
      }
      return errorValue.message;
    }
    if (errorValue instanceof Error) {
      return errorValue.message;
    }
    return "Unbekannter Fehler.";
  };

  const handleConvert = async () => {
    setError(null);
    setIsLoading(true);
    setResult(null);

    const payload = {
      mtbf: mtbf ? Number(mtbf) : null,
      lambda: lambda ? Number(lambda) : null,
      mttr: mttr ? Number(mttr) : null,
    };

    try {
      const data = await convert(payload);
      setResult(data);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/70">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Converter</h2>
      <div className="mt-3 space-y-3">
        <div>
          <label className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">MTBF</label>
          <input
            className={inputClasses}
            type="number"
            step="any"
            value={mtbf}
            onChange={(event) => setMtbf(event.target.value)}
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">?</label>
          <input
            className={inputClasses}
            type="number"
            step="any"
            value={lambda}
            onChange={(event) => setLambda(event.target.value)}
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">MTTR</label>
          <input
            className={inputClasses}
            type="number"
            step="any"
            value={mttr}
            onChange={(event) => setMttr(event.target.value)}
          />
        </div>
        <button
          type="button"
          className="w-full rounded bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleConvert}
          disabled={isLoading}
        >
          {isLoading ? "Berechne..." : "Berechnen"}
        </button>
      </div>
      {error && (
        <div className="mt-3 rounded border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/60 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      )}
      {result && (
        <pre className="mt-3 max-h-48 overflow-auto rounded border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-300">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default ConverterCard;
