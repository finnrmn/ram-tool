import axios, { AxiosResponse } from "axios";
import type {
  AvailabilitySolveResponse,
  ConvertInput,
  ConvertResponse,
  Scenario,
  SolveRbdResponse,
} from "../types";

export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  status: number;
};

const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
});

const extractErrorMessage = (error: unknown): { message: string; status: number } => {
  const buildDetailMessage = (payload: unknown): string | null => {
    if (!payload) {
      return null;
    }
    if (typeof payload === "string") {
      return payload;
    }
    if (Array.isArray(payload)) {
      const parts = payload
        .map((entry) => buildDetailMessage(entry))
        .filter((value): value is string => Boolean(value));
      if (parts.length > 0) {
        return parts.join(" / ");
      }
      return null;
    }
    if (typeof payload === "object") {
      const candidate = payload as { msg?: unknown; message?: unknown; detail?: unknown; loc?: unknown };
      if (candidate.detail) {
        return buildDetailMessage(candidate.detail);
      }
      if (candidate.msg && typeof candidate.msg === "string") {
        const formatLocation = (loc: unknown): string | null => {
          if (Array.isArray(loc)) {
            return loc.map((item) => String(item)).join(".");
          }
          if (typeof loc === "string" || typeof loc === "number") {
            return String(loc);
          }
          return null;
        };
        const location = formatLocation(candidate.loc);
        return location ? `${location}: ${candidate.msg}` : candidate.msg;
      }
      if (candidate.message && typeof candidate.message === "string") {
        return candidate.message;
      }
      try {
        return JSON.stringify(payload);
      } catch (jsonError) {
        return null;
      }
    }
    return null;
  };

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        return { message: "Zeitüberschreitung – Backend hat nicht geantwortet.", status: 0 };
      }
      return { message: "Backend ist nicht erreichbar.", status: 0 };
    }

    const status = error.response.status ?? 0;
    const data = error.response.data as { detail?: unknown } | string | undefined;
    const detailMessage =
      typeof data === "object" && data !== null && "detail" in data
        ? buildDetailMessage((data as { detail?: unknown }).detail)
        : buildDetailMessage(data);

    if (detailMessage) {
      return { message: detailMessage, status };
    }

    const statusText = error.response.statusText;
    if (statusText) {
      return { message: `${statusText} (Status ${status})`, status };
    }

    const fallbackMessage = error.message || "Unbekannter Fehler";
    return { message: fallbackMessage, status };
  }

  if (error instanceof Error) {
    return { message: error.message, status: 0 };
  }

  return { message: "Unbekannter Fehler", status: 0 };
};

const safeRequest = async <T>(promise: Promise<AxiosResponse<T>>): Promise<ApiResponse<T>> => {
  try {
    const response = await promise;
    return { data: response.data, error: null, status: response.status };
  } catch (error) {
    const { message, status } = extractErrorMessage(error);
    return { data: null, error: message, status };
  }
};

export const health = async () => safeRequest<{ status: string }>(api.get("/health"));

export const convert = async (payload: ConvertInput) => safeRequest<ConvertResponse>(api.post("/convert", payload));

export const solveRbd = async (scenario: Scenario) => safeRequest<SolveRbdResponse>(api.post("/solve/rbd", scenario));

export const solveAvailability = async (scenario: Scenario) =>
  safeRequest<AvailabilitySolveResponse>(api.post("/solve/availability", scenario));
