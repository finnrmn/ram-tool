import type {
  AvailabilitySolveResponse,
  ConvertInput,
  ConvertResponse,
  Scenario,
  SolveRbdResponse,
} from "../types";
import type { FormulaContext, FormulaEquation } from "../store/useFormulaStore";

const formatNumber = (value: number): string => {
  if (!Number.isFinite(value)) {
    return String(value);
  }
  const fixed = value.toFixed(6);
  return fixed.replace(/(?:\.0+|(\.\d*?[1-9]))0+$/, "$1").replace(/\.$/, "");
};

const lambdaSymbol = (index: number) => `\\lambda_{${index + 1}}`;
const availabilitySymbol = (index: number) => `A_{${index + 1}}`;

const activeComponents = (scenario: Scenario) => scenario.components.filter((component) => component.enabled);

const lambdaFromDistribution = (distribution: Scenario["components"][number]["distribution"]): number | null => {
  if (distribution.lambda !== undefined && distribution.lambda !== null) {
    return distribution.lambda;
  }
  if (distribution.mtbf !== undefined && distribution.mtbf !== null && distribution.mtbf > 0) {
    return 1 / distribution.mtbf;
  }
  return null;
};

const mtbfFromDistribution = (distribution: Scenario["components"][number]["distribution"]): number | null => {
  if (distribution.mtbf !== undefined && distribution.mtbf !== null) {
    return distribution.mtbf;
  }
  if (distribution.lambda !== undefined && distribution.lambda !== null && distribution.lambda > 0) {
    return 1 / distribution.lambda;
  }
  return null;
};

const buildSeriesReliabilityEquations = (lambdas: number[]): FormulaEquation[] => {
  if (lambdas.length === 0) {
    return [];
  }
  const lambdaValues = lambdas.map(formatNumber);
  const sum = lambdas.reduce((total, value) => total + value, 0);
  const sumFormatted = formatNumber(sum);
  const symbolicSum = lambdas.map((_, index) => lambdaSymbol(index)).join(" + ");
  const numericSum = lambdaValues.join(" + ");

  return [
    {
      id: "rbd-series-r",
      title: "Serie R(t)",
      latexGeneral:
        "R_{\\text{sys}}(t)=\\prod_{i=1}^{n} e^{-\\lambda_i t}=e^{-\\left(\\sum_{i=1}^{n} \\lambda_i\\right)t}",
      latexWithValues: `R_{\\text{sys}}(t)=e^{-(${numericSum})t}=e^{- ${sumFormatted} t}`,
    },
    {
      id: "rbd-series-sum",
      title: "Summierte Lambda",
      latexGeneral: "\\sum_{i=1}^{n} \\lambda_i=\\lambda_1+\\lambda_2+\\dots+\\lambda_n",
      latexWithValues: `${symbolicSum}=${numericSum}=${sumFormatted}`,
    },
    {
      id: "rbd-series-mtbf",
      title: "MTBF_{sys}",
      latexGeneral: "\\mathrm{MTBF}_{\\mathrm{sys}}=\\frac{1}{\\sum_{i=1}^{n} \\lambda_i}",
      latexWithValues: `\\mathrm{MTBF}_{\\mathrm{sys}}=\\frac{1}{${sumFormatted}}=${formatNumber(1 / sum)}`,
    },
  ];
};

const buildParallelReliabilityEquations = (lambdas: number[]): FormulaEquation[] => {
  if (lambdas.length === 0) {
    return [];
  }
  const lambdaValues = lambdas.map(formatNumber);
  const product = lambdaValues.map((value) => `\\big(1-e^{- ${value} t}\\big)`).join("");

  return [
    {
      id: "rbd-parallel-r",
      title: "Parallel R(t)",
      latexGeneral: "R_{\\text{sys}}(t)=1-\\prod_{i=1}^{n}\\big(1-e^{-\\lambda_i t}\\big)",
      latexWithValues: `R_{\\text{sys}}(t)=1-${product}`,
      note: "Hinweis: \\mathrm{MTBF}_{\\mathrm{sys}} \\neq 1/\\sum \\lambda_i (MVP).",
    },
  ];
};

const buildKofnReliabilityEquations = (lambdas: number[], k: number, n: number): FormulaEquation[] => {
  if (lambdas.length === 0) {
    return [];
  }
  const sum = lambdas.reduce((total, value) => total + value, 0);
  const average = sum / lambdas.length;
  const lambdaValues = lambdas.map(formatNumber);
  const averageFormatted = formatNumber(average);
  const numericSum = lambdaValues.join(" + ");

  return [
    {
      id: "rbd-kofn-r",
      title: `${k}-aus-${n} R(t)`,
      latexGeneral:
        "R(t)=\\sum_{i=k}^{n} \\binom{n}{i} R_c(t)^i\\big(1-R_c(t)\\big)^{n-i}",
      latexWithValues:
        `R(t)=\\sum_{i=${k}}^{${n}} \\binom{${n}}{i} R_c(t)^i\\big(1-R_c(t)\\big)^{${n}-i}`,
      note: "Annahme: identische Komponenten (MVP).",
    },
    {
      id: "rbd-kofn-rc",
      title: "Einzelkomponente",
      latexGeneral: "R_c(t)=e^{-\\bar{\\lambda} t}",
      latexWithValues: `R_c(t)=e^{- ${averageFormatted} t}`,
    },
    {
      id: "rbd-kofn-lambda",
      title: "Durchschnittliches lambda",
      latexGeneral: "\\bar{\\lambda}=\\frac{1}{n}\\sum_{i=1}^{n} \\lambda_i",
      latexWithValues: `\\bar{\\lambda}=\\frac{1}{${n}}(${numericSum})=${averageFormatted}`,
    },
  ];
};

export const buildRbdContext = (scenario: Scenario, response: SolveRbdResponse): FormulaContext => {
  const lambdas = response.lambdas;
  if (!lambdas || lambdas.length === 0) {
    return null;
  }

  const structure = scenario.structure;
  if (structure.kind === "series") {
    return { kind: "rbd", structure: "series", equations: buildSeriesReliabilityEquations(lambdas) };
  }
  if (structure.kind === "parallel") {
    return { kind: "rbd", structure: "parallel", equations: buildParallelReliabilityEquations(lambdas) };
  }
  const kValue = structure.k ?? 1;
  const nValue = structure.n ?? activeComponents(scenario).length;
  return {
    kind: "rbd",
    structure: "kofn",
    equations: buildKofnReliabilityEquations(lambdas, kValue, nValue),
  };
};

export const buildConverterContext = (input: ConvertInput, result: ConvertResponse): FormulaContext => {
  const equations: FormulaEquation[] = [];
  const mtbfValue = result.mtbf;
  const lambdaValue = result.lambda;

  equations.push({
    id: "converter-lambda",
    title: "lambda aus MTBF",
    latexGeneral: "\\lambda=\\frac{1}{\\mathrm{MTBF}}",
    latexWithValues: `\\lambda=\\frac{1}{${formatNumber(mtbfValue)}}=${formatNumber(lambdaValue)}`,
  });

  equations.push({
    id: "converter-mtbf",
    title: "MTBF aus lambda",
    latexGeneral: "\\mathrm{MTBF}=\\frac{1}{\\lambda}",
    latexWithValues: `\\mathrm{MTBF}=\\frac{1}{${formatNumber(lambdaValue)}}=${formatNumber(mtbfValue)}`,
  });

  if (result.A !== null && result.A !== undefined && input.mttr !== null && input.mttr !== undefined) {
    const availability = result.A;
    const mttrValue = input.mttr;
    equations.push({
      id: "converter-availability",
      title: "Verfuegbarkeit",
      latexGeneral: "A=\\frac{\\mathrm{MTBF}}{\\mathrm{MTBF}+\\mathrm{MTTR}}",
      latexWithValues:
        `A=\\frac{${formatNumber(mtbfValue)}}{${formatNumber(mtbfValue)}+${formatNumber(mttrValue)}}=${formatNumber(availability ?? 0)}`,
      note: "Steady-State-Availability (MVP).",
    });
  }

  return { kind: "converter", equations };
};

const buildSingleComponentAvailability = (
  scenario: Scenario,
  response: AvailabilitySolveResponse,
): FormulaEquation[] => {
  const [component] = activeComponents(scenario);
  if (!component || component.mttr === undefined || component.mttr === null) {
    return [
      {
        id: "availability-single-missing",
        title: "A(t)",
        latexGeneral: "A(t)=A_{ss}+(A(0)-A_{ss})e^{-(\\lambda+\\mu)t}",
        note: "MTTR fehlt fuer Einzelkomponente.",
      },
    ];
  }

  const lambdaValue = lambdaFromDistribution(component.distribution);
  const mtbfValue = mtbfFromDistribution(component.distribution);
  if (lambdaValue === null || mtbfValue === null) {
    return [
      {
        id: "availability-single-missing-lambda",
        title: "A(t)",
        latexGeneral: "A(t)=A_{ss}+(1-A_{ss})e^{-(\\lambda+\\mu)t}",
        note: "lambda oder MTBF fehlen (MVP).",
      },
    ];
  }

  const muValue = 1 / component.mttr;
  const steadyState = response.kpis.A_ss;
  const lambdaFormatted = formatNumber(lambdaValue);
  const muFormatted = formatNumber(muValue);
  const steadyFormatted = formatNumber(steadyState);
  const totalRateFormatted = formatNumber(lambdaValue + muValue);

  return [
    {
      id: "availability-single-A",
      title: "A(t)",
      latexGeneral: "A(t)=A_{ss}+(A(0)-A_{ss})e^{-(\\lambda+\\mu)t}",
      latexWithValues: `A(t)=${steadyFormatted}+(1-${steadyFormatted})e^{-(${lambdaFormatted}+${muFormatted})t}=${steadyFormatted}+(1-${steadyFormatted})e^{- ${totalRateFormatted} t}`,
      note: "Annahme: A(0)=1, 2-Zustandsmodell (MVP).",
    },
    {
      id: "availability-single-steady",
      title: "A_{ss}",
      latexGeneral: "A_{ss}=\\frac{\\mu}{\\lambda+\\mu}",
      latexWithValues: `A_{ss}=\\frac{${muFormatted}}{${lambdaFormatted}+${muFormatted}}=${steadyFormatted}`,
    },
    {
      id: "availability-single-mu",
      title: "Reparaturrate",
      latexGeneral: "\\mu=\\frac{1}{\\mathrm{MTTR}}",
      latexWithValues: `\\mu=\\frac{1}{${formatNumber(component.mttr)}}=${muFormatted}`,
    },
  ];
};

const buildPerComponentAvailabilityEquations = (scenario: Scenario): FormulaEquation[] => {
  const components = activeComponents(scenario);
  return components
    .map((component, index) => {
      const mtbfValue = mtbfFromDistribution(component.distribution);
      const mttrValue = component.mttr ?? null;
      if (mtbfValue === null || mttrValue === null) {
        return {
          id: `availability-component-${index}`,
          title: availabilitySymbol(index),
          latexGeneral: "A_i=\\frac{\\mathrm{MTBF}_i}{\\mathrm{MTBF}_i+\\mathrm{MTTR}_i}",
          note: "MTBF oder MTTR fehlen (MVP).",
        } as FormulaEquation;
      }
      const availability = mtbfValue / (mtbfValue + mttrValue);
      return {
        id: `availability-component-${index}`,
        title: availabilitySymbol(index),
        latexGeneral: "A_i=\\frac{\\mathrm{MTBF}_i}{\\mathrm{MTBF}_i+\\mathrm{MTTR}_i}",
        latexWithValues: `A_{${index + 1}}=\\frac{${formatNumber(mtbfValue)}}{${formatNumber(mtbfValue)}+${formatNumber(mttrValue)}}=${formatNumber(availability)}`,
      } as FormulaEquation;
    })
    .filter(Boolean) as FormulaEquation[];
};

const buildSeriesAvailabilityEquation = (scenario: Scenario, response: AvailabilitySolveResponse): FormulaEquation => {
  const components = activeComponents(scenario);
  const perComponentAvailability = components.map((component) => {
    const mtbfValue = mtbfFromDistribution(component.distribution);
    const mttrValue = component.mttr;
    if (mtbfValue === null || mttrValue === undefined || mttrValue === null) {
      return null;
    }
    return mtbfValue / (mtbfValue + mttrValue);
  });
  const numericTerms = perComponentAvailability.every((value) => value !== null)
    ? (perComponentAvailability as number[]).map(formatNumber).join(" \\cdot ")
    : null;
  const steadyState = formatNumber(response.kpis.A_ss);

  const latexWithValues = numericTerms ? `A_{\\text{sys}}=${numericTerms}=${steadyState}` : undefined;

  return {
    id: "availability-series",
    title: "Serie A_{sys}",
    latexGeneral: "A_{\\text{sys}}=\\prod_{i=1}^{n} A_i",
    latexWithValues,
  };
};

const buildParallelAvailabilityEquation = (scenario: Scenario, response: AvailabilitySolveResponse): FormulaEquation => {
  const components = activeComponents(scenario);
  const perComponentAvailability = components.map((component) => {
    const mtbfValue = mtbfFromDistribution(component.distribution);
    const mttrValue = component.mttr;
    if (mtbfValue === null || mttrValue === undefined || mttrValue === null) {
      return null;
    }
    return mtbfValue / (mtbfValue + mttrValue);
  });
  const numericProduct = perComponentAvailability.every((value) => value !== null)
    ? (perComponentAvailability as number[])
        .map((value) => `\\big(1-${formatNumber(value)}\\big)`)
        .join("")
    : null;
  const steadyState = formatNumber(response.kpis.A_ss);
  const latexWithValues = numericProduct ? `A_{\\text{sys}}=1-${numericProduct}=${steadyState}` : undefined;

  return {
    id: "availability-parallel",
    title: "Parallel A_{sys}",
    latexGeneral: "A_{\\text{sys}}=1-\\prod_{i=1}^{n}(1-A_i)",
    latexWithValues,
    note: "Hinweis: identische Annahmen fuer parallele Availability (MVP).",
  };
};

const buildKofnAvailabilityEquation = (
  scenario: Scenario,
  response: AvailabilitySolveResponse,
): FormulaEquation[] => {
  const components = activeComponents(scenario);
  const structure = scenario.structure;
  const kValue = structure.k ?? 1;
  const nValue = structure.n ?? components.length;
  const perComponentAvailability = components.map((component) => {
    const mtbfValue = mtbfFromDistribution(component.distribution);
    const mttrValue = component.mttr;
    if (mtbfValue === null || mttrValue === undefined || mttrValue === null) {
      return null;
    }
    return mtbfValue / (mtbfValue + mttrValue);
  });
  const numericAvailabilities = perComponentAvailability.filter((value): value is number => value !== null);
  const average = numericAvailabilities.length > 0
    ? numericAvailabilities.reduce((total, value) => total + value, 0) / numericAvailabilities.length
    : null;
  const averageFormatted = average !== null ? formatNumber(average) : null;

  const equations: FormulaEquation[] = [
    {
      id: "availability-kofn",
      title: `${kValue}-aus-${nValue} A_{sys}`,
      latexGeneral: "A_{\\text{sys}}=\\sum_{i=k}^{n} \\binom{n}{i} A^i (1-A)^{n-i}",
      latexWithValues:
        averageFormatted !== null
          ? `A_{\\text{sys}}=\\sum_{i=${kValue}}^{${nValue}} \\binom{${nValue}}{i} ${averageFormatted}^{\,i}(1-${averageFormatted})^{${nValue}-i}`
          : undefined,
      note: "Annahme: identische Availability fuer alle Komponenten (MVP).",
    },
  ];

  if (averageFormatted !== null) {
    equations.push({
      id: "availability-kofn-average",
      title: "Durchschnittliches A",
      latexGeneral: "A=\\frac{1}{n}\\sum_{i=1}^{n} A_i",
      latexWithValues: `A=\\frac{1}{${nValue}}\\sum A_i=${averageFormatted}`,
    });
  }

  return equations;
};

export const buildAvailabilityContext = (
  scenario: Scenario,
  response: AvailabilitySolveResponse,
): FormulaContext => {
  const components = activeComponents(scenario);
  if (components.length === 0) {
    return null;
  }

  if (components.length === 1) {
    return { kind: "availability", equations: buildSingleComponentAvailability(scenario, response) };
  }

  const structure = scenario.structure.kind;
  const equations: FormulaEquation[] = [...buildPerComponentAvailabilityEquations(scenario)];

  if (structure === "series") {
    equations.push(buildSeriesAvailabilityEquation(scenario, response));
  } else if (structure === "parallel") {
    equations.push(buildParallelAvailabilityEquation(scenario, response));
  } else {
    equations.push(...buildKofnAvailabilityEquation(scenario, response));
  }

  return { kind: "availability", equations };
};
