import { describe, expect, it } from "vitest";

import fixtures from "./__fixtures__/api-fixtures.json";
import {
  convert,
  distributionR,
  solveAvailability,
  solveRbd,
} from "../src/lib/api";
import type {
  ConvertRequest,
  DistributionReliabilityRequest,
  ScenarioModel,
} from "../src/lib/api/types";

const TOLERANCE = 1e-12;

const expectClose = (actual: number, expected: number) => {
  const diff = Math.abs(actual - expected);
  const allowed = Math.max(TOLERANCE, Math.abs(expected) * TOLERANCE);
  expect(diff).toBeLessThanOrEqual(allowed);
};

const expectArrayClose = (actual: number[], expected: number[]) => {
  expect(actual).toHaveLength(expected.length);
  actual.forEach((value, index) => {
    expectClose(value, expected[index]!);
  });
};

describe("API facade fixtures", () => {
  it("matches convert response", async () => {
    const { request, response } = fixtures.convert_basic;
    const result = await convert(request as ConvertRequest);
    expectClose(result.mtbf, response.mtbf);
    expectClose(result.lambda, response.lambda);
    if (response.A === null) {
      expect(result.A).toBeNull();
    } else {
      expect(result.A).not.toBeNull();
      expectClose(result.A ?? 0, response.A);
    }
    expect(result.notes).toBe(response.notes);
  });

  it("matches distribution reliability response", async () => {
    const { request, response } = fixtures.distribution_exponential;
    const result = await distributionR(request as DistributionReliabilityRequest);
    expectArrayClose(result.r, response.r);
    expect(result.notes).toBe(response.notes);
  });

  it("matches reliability RBD response", async () => {
    const { request, response } = fixtures.solve_rbd_kofn;
    const result = await solveRbd(request as ScenarioModel);
    expectArrayClose(result.r_curve.t, response.r_curve.t);
    expectArrayClose(result.r_curve.r, response.r_curve.r);
    expectClose(result.kpis.R_t0, response.kpis.R_t0);
    expectClose(result.kpis.R_tmax, response.kpis.R_tmax);
    expectClose(result.kpis.t0, response.kpis.t0);
    expectClose(result.kpis.tmax, response.kpis.tmax);
    expectArrayClose(result.lambdas, response.lambdas);
    expect(result.warnings).toEqual(response.warnings);
  });

  it("matches availability response", async () => {
    const { request, response } = fixtures.solve_availability_single;
    const result = await solveAvailability(request as ScenarioModel);
    expectArrayClose(result.a_curve.t, response.a_curve.t);
    expectArrayClose(result.a_curve.a, response.a_curve.a);
    expectClose(result.kpis.A_ss, response.kpis.A_ss);
    expectClose(result.kpis.A_t0, response.kpis.A_t0);
    expectClose(result.kpis.A_tmax, response.kpis.A_tmax);
    expectClose(result.kpis.t0, response.kpis.t0);
    expectClose(result.kpis.tmax, response.kpis.tmax);
    expect(result.warnings).toEqual(response.warnings);
  });
});
