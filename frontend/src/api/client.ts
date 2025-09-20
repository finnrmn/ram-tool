import axios from "axios";
import type {
  AvailabilitySolveResponse,
  ConvertInput,
  ConvertResponse,
  Scenario,
  SolveRbdResponse,
} from "../types";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  timeout: 10000,
});

export const health = async () => {
  const response = await api.get<{ status: string }>("/health");
  return response.data;
};

export const convert = async (payload: ConvertInput) => {
  const response = await api.post<ConvertResponse>("/convert", payload);
  return response.data;
};

export const solveRbd = async (scenario: Scenario) => {
  const response = await api.post<SolveRbdResponse>("/solve/rbd", scenario);
  return response.data;
};

export const solveAvailability = async (scenario: Scenario) => {
  const response = await api.post<AvailabilitySolveResponse>("/solve/availability", scenario);
  return response.data;
};

export type { AvailabilitySolveResponse, SolveRbdResponse } from "../types";

export default api;
