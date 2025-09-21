import type {
  ConvertRequest,
  ConvertResponse,
  DistributionReliabilityRequest,
  DistributionReliabilityResponse,
  HealthResponse,
  ScenarioModel,
  SolveAvailabilityResponse,
  SolveRbdResponse,
} from "./types";
import {
  convertMetrics,
  solveAvailabilityScenario,
  solveDistributionReliability,
  solveRbdScenario,
} from "../engines/ram";

const wrap = <T>(factory: () => T): Promise<T> => {
  try {
    return Promise.resolve(factory());
  } catch (error) {
    return Promise.reject(error);
  }
};

export const health = (): Promise<HealthResponse> => wrap(() => ({ status: "ok" as const }));

export const convert = (payload: ConvertRequest): Promise<ConvertResponse> =>
  wrap(() => convertMetrics(payload));

export const distributionR = (
  payload: DistributionReliabilityRequest,
): Promise<DistributionReliabilityResponse> => wrap(() => solveDistributionReliability(payload));

export const solveRbd = (scenario: ScenarioModel): Promise<SolveRbdResponse> =>
  wrap(() => solveRbdScenario(scenario));

export const solveAvailability = (scenario: ScenarioModel): Promise<SolveAvailabilityResponse> =>
  wrap(() => solveAvailabilityScenario(scenario));

export { RamApiError } from "../validation";
