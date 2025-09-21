import { extractErrorMessage } from "../lib/api/errors";
import {
  RamApiError,
  convert as convertLocal,
  distributionR as distributionReliabilityLocal,
  health as healthLocal,
  solveAvailability as solveAvailabilityLocal,
  solveRbd as solveRbdLocal,
} from "../lib/api";
import type {
  AvailabilitySolveResponse,
  ConvertInput,
  ConvertResponse,
  DistributionReliabilityRequest,
  DistributionReliabilityResponse,
  Scenario,
  SolveRbdResponse,
} from "../types";

export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  status: number;
};

const success = <T>(data: T): ApiResponse<T> => ({ data, error: null, status: 200 });

const failure = (error: unknown): ApiResponse<never> => {
  if (error instanceof RamApiError) {
    return { data: null, error: error.message, status: error.status };
  }
  return { data: null, error: extractErrorMessage(error), status: 0 };
};

const wrap = async <T>(factory: () => Promise<T> | T): Promise<ApiResponse<T>> => {
  try {
    const result = await factory();
    return success(result);
  } catch (error) {
    return failure(error);
  }
};

export const health = async (): Promise<ApiResponse<{ status: string }>> => wrap(() => healthLocal());

export const convert = async (payload: ConvertInput): Promise<ApiResponse<ConvertResponse>> =>
  wrap(() => convertLocal(payload));

export const distributionR = async (
  payload: DistributionReliabilityRequest,
): Promise<ApiResponse<DistributionReliabilityResponse>> => wrap(() => distributionReliabilityLocal(payload));

export const solveRbd = async (scenario: Scenario): Promise<ApiResponse<SolveRbdResponse>> =>
  wrap(() => solveRbdLocal(scenario));

export const solveAvailability = async (
  scenario: Scenario,
): Promise<ApiResponse<AvailabilitySolveResponse>> => wrap(() => solveAvailabilityLocal(scenario));
