import type { Scenario } from "../types";

type ValidationResult = {
  isValid: boolean;
  errors: string[];
  activeCount: number;
};

export const validateScenario = (scenario: Scenario): ValidationResult => {
  const errors: string[] = [];
  const activeComponents = scenario.components.filter((component) => component.enabled);

  if (activeComponents.length === 0) {
    errors.push("Mindestens eine aktive Komponente ist erforderlich.");
  }

  activeComponents.forEach((component) => {
    const { lambda, mtbf } = component.distribution;
    const lambdaValue = typeof lambda === "number" ? lambda : undefined;
    const mtbfValue = typeof mtbf === "number" ? mtbf : undefined;
    if ((lambdaValue ?? 0) <= 0 && (mtbfValue ?? 0) <= 0) {
      errors.push(`Komponente "${component.name}" benötigt λ > 0 oder MTBF > 0.`);
    }
  });

  const { kind, k, n } = scenario.structure;
  const activeCount = activeComponents.length;
  if (kind === "kofn") {
    if (typeof k !== "number" || !Number.isFinite(k) || k < 1) {
      errors.push("k-aus-n benötigt ein k ≥ 1.");
    }
    const expectedN = typeof n === "number" && Number.isFinite(n) ? n : activeCount;
    if (expectedN !== activeCount) {
      errors.push("Für k-aus-n muss n der Anzahl aktiver Komponenten entsprechen.");
    }
    if (typeof k === "number" && k > expectedN) {
      errors.push("Für k-aus-n muss gelten: k ≤ n.");
    }
  }

  const { samples, tMax } = scenario.plotSettings;
  if (samples < 2) {
    errors.push("Samples muss ≥ 2 sein.");
  }
  if (tMax <= 0) {
    errors.push("t_max muss > 0 sein.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    activeCount,
  };
};
