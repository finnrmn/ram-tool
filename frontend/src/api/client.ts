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
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data as { detail?: unknown } | undefined;
    if (detail?.detail) {
      if (typeof detail.detail === "string") {
        return { message: detail.detail, status: error.response?.status ?? 0 };
      }
      if (typeof detail.detail === "object") {
        try {
          return { message: JSON.stringify(detail.detail), status: error.response?.status ?? 0 };
        } catch (jsonError) {
          return { message: "Unbekannter Fehler (Detail)", status: error.response?.status ?? 0 };
        }
      }
    }
    const message = error.message || "Unbekannter Fehler";
    return { message, status: error.response?.status ?? 0 };
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
