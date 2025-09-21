import { describe, expect, it } from "vitest";

import {
  availabilitySingle,
  reliabilityKofNIdentical,
  reliabilityParallel,
  reliabilitySeries,
  rExp,
  timeVector,
} from "../../src/lib/engines/ram";

const randomRates = [0.001, 0.0025, 0.006];
const randomReliabilities = randomRates.map((rate) => rExp(rate, 100));

const expectClose = (actual: number, expected: number, tolerance = 1e-12) => {
  const diff = Math.abs(actual - expected);
  const allowed = Math.max(tolerance, Math.abs(expected) * tolerance);
  expect(diff).toBeLessThanOrEqual(allowed);
};

describe("RAM engine helpers", () => {
  it("computes series reliability as product", () => {
    const direct = randomReliabilities.reduce((product, value) => product * value, 1);
    expectClose(reliabilitySeries(randomReliabilities), direct);
  });

  it("computes parallel reliability higher than components", () => {
    const parallel = reliabilityParallel(randomReliabilities);
    const maxComponent = Math.max(...randomReliabilities);
    expect(parallel).toBeGreaterThanOrEqual(maxComponent);
    expect(parallel).toBeLessThanOrEqual(1);
  });

  it("k-of-n falls back to parallel for k=1", () => {
    const r = randomReliabilities[0];
    const kofn = reliabilityKofNIdentical(r, 1, 3);
    const expected = reliabilityParallel([r, r, r]);
    expectClose(kofn, expected);
  });

  it("k-of-n falls back to series for k=n", () => {
    const r = randomReliabilities[1];
    const kofn = reliabilityKofNIdentical(r, 3, 3);
    const expected = reliabilitySeries([r, r, r]);
    expectClose(kofn, expected);
  });

  it("builds consistent time vectors", () => {
    const vector = timeVector(0, 50, 6);
    expect(vector).toEqual([0, 10, 20, 30, 40, 50]);
  });

  it("solves single-component availability curve", () => {
    const lambda = 0.0025;
    const mttr = 8;
    const times = [0, 20, 40];
    const { steadyState, curve } = availabilitySingle(lambda, mttr, times);
    const mu = 1 / mttr;
    const total = lambda + mu;
    const expectedSteady = mu / total;
    expectClose(steadyState, expectedSteady);
    expect(curve).toHaveLength(times.length);
    expectClose(curve[0]!, 1);
    expectClose(curve[curve.length - 1]!, expectedSteady);
  });
});
