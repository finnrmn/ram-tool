import {
  ComponentModel,
  ConvertRequest,
  ConvertResponse,
  DistributionModel,
  DistributionReliabilityRequest,
  DistributionReliabilityResponse,
  PlotSettingsModel,
  ScenarioModel,
  SolveAvailabilityResponse,
  SolveRbdResponse,
  StructureModel,
} from "../api/types";
import {
  RamApiError,
  assertCondition,
  ensureIntegerInRange,
  ensureNonNegativeNumber,
  ensurePositiveNumber,
  toOptionalFiniteNumber,
} from "../validation";

const binomialCoefficient = (n: number, k: number): number => {
  if (k < 0 || k > n) {
    return 0;
  }
  if (k === 0 || k === n) {
    return 1;
  }
  const limit = Math.min(k, n - k);
  let result = 1;
  for (let index = 1; index <= limit; index += 1) {
    result = (result * (n - limit + index)) / index;
  }
  return result;
};

export const rExp = (lambda: number, t: number): number => Math.exp(-lambda * t);

export const reliabilitySeries = (rs: number[]): number => rs.reduce((product, value) => product * value, 1);

export const reliabilityParallel = (rs: number[]): number =>
  1 - rs.reduce((product, value) => product * (1 - value), 1);

export const reliabilityKofNIdentical = (r: number, k: number, n: number): number => {
  if (n < 1) {
    throw new RamApiError("n must be >= 1 for k-of-n.");
  }
  let cumulative = 0;
  for (let successes = k; successes <= n; successes += 1) {
    cumulative += binomialCoefficient(n, successes) * r ** successes * (1 - r) ** (n - successes);
  }
  return cumulative;
};

export const timeVector = (start: number, stop: number, samples: number): number[] => {
  const validSamples = ensureIntegerInRange(samples, "Samples must be >= 2.", { min: 2 });
  const validStart = ensureNonNegativeNumber(start, "tMax must be >= 0.");
  const validStop = ensureNonNegativeNumber(stop, "tMax must be >= 0.");
  if (validStop < validStart) {
    throw new RamApiError("tMax must be >= 0.");
  }
  const step = validSamples === 1 ? 0 : (validStop - validStart) / (validSamples - 1);
  return Array.from({ length: validSamples }, (_, index) => validStart + step * index);
};

const lambdaFromDistribution = (distribution: DistributionModel): number => {
  const lambdaCandidate = toOptionalFiniteNumber(distribution.lambda ?? null);
  if (lambdaCandidate !== undefined) {
    return ensurePositiveNumber(lambdaCandidate, "Missing lambda and MTBF.");
  }
  const mtbfCandidate = toOptionalFiniteNumber(distribution.mtbf ?? null);
  if (mtbfCandidate !== undefined) {
    const mtbfValue = ensurePositiveNumber(mtbfCandidate, "Missing lambda and MTBF.");
    return 1 / mtbfValue;
  }
  throw new RamApiError("Missing lambda and MTBF.");
};

const mtbfFromDistribution = (distribution: DistributionModel): number => {
  const mtbfCandidate = toOptionalFiniteNumber(distribution.mtbf ?? null);
  if (mtbfCandidate !== undefined) {
    return ensurePositiveNumber(mtbfCandidate, "Missing MTBF and lambda.");
  }
  const lambdaCandidate = toOptionalFiniteNumber(distribution.lambda ?? null);
  if (lambdaCandidate !== undefined) {
    const lambdaValue = ensurePositiveNumber(lambdaCandidate, "Missing MTBF and lambda.");
    return 1 / lambdaValue;
  }
  throw new RamApiError("Missing MTBF and lambda.");
};

const buildTimeVector = (settings: PlotSettingsModel): number[] => timeVector(0, settings.tMax, settings.samples);

export const convertMetrics = (request: ConvertRequest): ConvertResponse => {
  const lambdaCandidate = toOptionalFiniteNumber(request.lambda);
  const mtbfCandidate = toOptionalFiniteNumber(request.mtbf);
  const mttrCandidate = toOptionalFiniteNumber(request.mttr);

  if (lambdaCandidate === undefined && mtbfCandidate === undefined) {
    throw new RamApiError("Provide either lambda or MTBF (both > 0).");
  }

  let lambdaValue: number;
  let mtbfValue: number;
  if (lambdaCandidate !== undefined) {
    lambdaValue = ensurePositiveNumber(lambdaCandidate, "Provide either lambda or MTBF (both > 0).");
    mtbfValue = 1 / lambdaValue;
  } else {
    mtbfValue = ensurePositiveNumber(mtbfCandidate, "Provide either lambda or MTBF (both > 0).");
    lambdaValue = 1 / mtbfValue;
  }

  let availability: number | null = null;
  if (mttrCandidate !== undefined) {
    const mttr = ensurePositiveNumber(mttrCandidate, "MTTR must be > 0.");
    availability = mtbfValue / (mtbfValue + mttr);
  }

  return {
    mtbf: mtbfValue,
    lambda: lambdaValue,
    A: availability,
    notes: "ok",
  };
};

export const solveDistributionReliability = (
  request: DistributionReliabilityRequest,
): DistributionReliabilityResponse => {
  request.t.forEach((time) => ensureNonNegativeNumber(time, "Time values must be non-negative."));
  const lambdaValue = lambdaFromDistribution(request.distribution);
  return {
    r: request.t.map((time) => rExp(lambdaValue, time)),
    notes: "exponential",
  };
};

const activeComponents = (components: ComponentModel[]): ComponentModel[] =>
  components.filter((component) => component.enabled);

const componentRatesOrThrow = (components: ComponentModel[]): number[] =>
  components.map((component) => {
    try {
      return lambdaFromDistribution(component.distribution);
    } catch (error) {
      if (error instanceof RamApiError) {
        throw new RamApiError(`Component '${component.name}' requires lambda or MTBF (> 0).`);
      }
      throw error;
    }
  });

const resolveKofN = (structure: StructureModel, fallbackN: number): { k: number; n: number } => {
  const rawK = structure.k;
  if (rawK === null || rawK === undefined) {
    throw new RamApiError("k-of-n requires an integer k >= 1.");
  }
  const k = ensureIntegerInRange(rawK, "k-of-n requires an integer k >= 1.", { min: 1 });
  const rawN = structure.n ?? fallbackN;
  const n = ensureIntegerInRange(rawN, "k-of-n requires 1 <= k <= n.", { min: 1 });
  if (!(k >= 1 && k <= n)) {
    throw new RamApiError("k-of-n requires 1 <= k <= n.");
  }
  return { k, n };
};

export const solveRbdScenario = (scenario: ScenarioModel): SolveRbdResponse => {
  const timePoints = buildTimeVector(scenario.plotSettings);
  const components = activeComponents(scenario.components);
  if (components.length === 0) {
    throw new RamApiError("Scenario requires at least one active component.");
  }
  const componentRates = componentRatesOrThrow(components);
  const { structure } = scenario;
  const warnings: string[] = [];
  let rValues: number[];

  switch (structure.kind) {
    case "series": {
      const totalRate = componentRates.reduce((sum, rate) => sum + rate, 0);
      rValues = timePoints.map((time) => rExp(totalRate, time));
      break;
    }
    case "parallel": {
      rValues = timePoints.map((time) => {
        const componentReliabilities = componentRates.map((rate) => rExp(rate, time));
        return reliabilityParallel(componentReliabilities);
      });
      break;
    }
    case "kofn": {
      const { k, n } = resolveKofN(structure, components.length);
      const averageRate = componentRates.reduce((sum, rate) => sum + rate, 0) / componentRates.length;
      rValues = timePoints.map((time) => {
        const rc = rExp(averageRate, time);
        return reliabilityKofNIdentical(rc, k, n);
      });
      warnings.push("k-of-n uses identical-components MVP assumption (lambda = average).");
      break;
    }
    default:
      throw new RamApiError("Unsupported structure kind.");
  }

  return {
    r_curve: {
      t: timePoints,
      r: rValues,
    },
    kpis: {
      R_t0: rValues[0],
      t0: timePoints[0],
      R_tmax: rValues[rValues.length - 1],
      tmax: timePoints[timePoints.length - 1],
    },
    warnings,
    lambdas: componentRates,
  };
};

export const availabilitySingle = (
  lambdaValue: number,
  mttr: number,
  times: number[],
): { steadyState: number; curve: number[] } => {
  const positiveLambda = ensurePositiveNumber(lambdaValue, "Missing lambda and MTBF.");
  const positiveMttr = ensurePositiveNumber(mttr, "Single-component transient A(t) requires MTTR > 0.");
  const muValue = 1 / positiveMttr;
  const totalRate = positiveLambda + muValue;
  assertCondition(totalRate > 0, "lambda and MTTR must produce positive rates.");
  const steadyState = muValue / totalRate;
  const curve = times.map((time) => steadyState + (1 - steadyState) * Math.exp(-totalRate * time));
  return { steadyState, curve };
};

const computeSteadyStateAvailability = (
  structure: StructureModel,
  availabilities: number[],
  componentCount: number,
): { value: number; warnings: string[] } => {
  switch (structure.kind) {
    case "series":
      return {
        value: availabilities.reduce((product, value) => product * value, 1),
        warnings: [],
      };
    case "parallel":
      return {
        value: 1 - availabilities.reduce((product, value) => product * (1 - value), 1),
        warnings: [],
      };
    case "kofn": {
      const { k, n } = resolveKofN(structure, componentCount);
      const averageAvailability = availabilities.reduce((sum, value) => sum + value, 0) / availabilities.length;
      let steadyState = 0;
      for (let successes = k; successes <= n; successes += 1) {
        steadyState += binomialCoefficient(n, successes)
          * averageAvailability ** successes
          * (1 - averageAvailability) ** (n - successes);
      }
      return {
        value: steadyState,
        warnings: ["k-of-n uses identical-components assumption (MVP)."],
      };
    }
    default:
      throw new RamApiError("Unsupported structure kind.");
  }
};

export const solveAvailabilityScenario = (scenario: ScenarioModel): SolveAvailabilityResponse => {
  const timePoints = buildTimeVector(scenario.plotSettings);
  const components = activeComponents(scenario.components);
  if (components.length === 0) {
    throw new RamApiError("Scenario requires at least one active component.");
  }

  if (components.length === 1) {
    const [component] = components;
    const mttr = ensurePositiveNumber(component.mttr, "Single-component transient A(t) requires MTTR > 0.");
    const lambdaValue = lambdaFromDistribution(component.distribution);
    const { steadyState, curve } = availabilitySingle(lambdaValue, mttr, timePoints);
    return {
      a_curve: {
        t: timePoints,
        a: curve,
      },
      kpis: {
        A_ss: steadyState,
        A_t0: curve[0],
        A_tmax: curve[curve.length - 1],
        t0: timePoints[0],
        tmax: timePoints[timePoints.length - 1],
      },
      warnings: ["Transient availability based on 2-state Markov model for a single component (MVP)."],
    };
  }

  const componentAvailabilities = components.map((component) => {
    let mtbfValue: number;
    try {
      mtbfValue = mtbfFromDistribution(component.distribution);
    } catch (error) {
      if (error instanceof RamApiError) {
        throw new RamApiError(`Component '${component.name}' requires MTBF > 0.`);
      }
      throw error;
    }
    if (mtbfValue <= 0) {
      throw new RamApiError(`Component '${component.name}' must have MTBF > 0.`);
    }
    const mttrValue = ensurePositiveNumber(
      component.mttr,
      `Component '${component.name}' requires MTTR > 0 for availability analysis.`,
    );
    return mtbfValue / (mtbfValue + mttrValue);
  });

  const { value: steadyState, warnings } = computeSteadyStateAvailability(
    scenario.structure,
    componentAvailabilities,
    components.length,
  );

  warnings.push(
    "A(t) uses steady-state aggregation; transient effects are not modeled for multi-component systems (MVP).",
  );

  const steadyCurve = timePoints.map(() => steadyState);

  return {
    a_curve: {
      t: timePoints,
      a: steadyCurve,
    },
    kpis: {
      A_ss: steadyState,
      A_t0: steadyCurve[0],
      A_tmax: steadyCurve[steadyCurve.length - 1],
      t0: timePoints[0],
      tmax: timePoints[timePoints.length - 1],
    },
    warnings,
  };
};
