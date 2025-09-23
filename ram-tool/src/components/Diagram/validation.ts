import type { ComponentData } from "./types";

export type ValidationSummary = {
  errors: string[];
  warnings: string[];
};

export const isPositive = (value?: number | null): boolean => typeof value === "number" && Number.isFinite(value) && value > 0;

export const validateComponentParams = (component: ComponentData) => {
  const hasLambda = isPositive(component.lambda);
  const hasMtbf = isPositive(component.mtbf);
  const ok = hasLambda || hasMtbf;
  const warnings: string[] = [];
  if (!ok) {
    warnings.push(`Komponente "${component.name || component.kind}" benötigt lambda oder MTBF > 0.`);
  }
  return { ok, warnings };
};

export const isValidKofN = (k: number, n: number) => {
  const validK = Number.isInteger(k) && k >= 1;
  const validN = Number.isInteger(n) && n >= 1;
  const withinBounds = k <= n;
  const ok = validK && validN && withinBounds;
  let message: string | null = null;
  if (!validK) {
    message = "k muss eine ganze Zahl >= 1 sein.";
  } else if (!validN) {
    message = "n muss eine ganze Zahl >= 1 sein.";
  } else if (!withinBounds) {
    message = "k darf n nicht ueberschreiten.";
  }
  return { ok, message };
};

export const mergeValidationSummaries = (...summaries: ValidationSummary[]): ValidationSummary =>
  summaries.reduce<ValidationSummary>(
    (acc, summary) => ({
      errors: acc.errors.concat(summary.errors),
      warnings: acc.warnings.concat(summary.warnings),
    }),
    { errors: [], warnings: [] },
  );

