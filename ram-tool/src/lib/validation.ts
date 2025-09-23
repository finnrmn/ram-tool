export class RamApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "RamApiError";
    this.status = status;
  }
}

export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const toOptionalFiniteNumber = (value: number | null | undefined): number | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }
  return isFiniteNumber(value) ? value : undefined;
};

export const ensureFiniteNumber = (
  value: number | null | undefined,
  message: string,
  status = 400,
): number => {
  const numeric = toOptionalFiniteNumber(value);
  if (numeric === undefined) {
    throw new RamApiError(message, status);
  }
  return numeric;
};

export const ensurePositiveNumber = (
  value: number | null | undefined,
  message: string,
  status = 400,
): number => {
  const numeric = ensureFiniteNumber(value, message, status);
  if (numeric <= 0) {
    throw new RamApiError(message, status);
  }
  return numeric;
};

export const ensureNonNegativeNumber = (
  value: number | null | undefined,
  message: string,
  status = 400,
): number => {
  const numeric = ensureFiniteNumber(value, message, status);
  if (numeric < 0) {
    throw new RamApiError(message, status);
  }
  return numeric;
};

export const ensureIntegerInRange = (
  value: number | null | undefined,
  message: string,
  { min, max }: { min?: number; max?: number } = {},
  status = 400,
): number => {
  const numeric = ensureFiniteNumber(value, message, status);
  if (!Number.isInteger(numeric)) {
    throw new RamApiError(message, status);
  }
  if (min !== undefined && numeric < min) {
    throw new RamApiError(message, status);
  }
  if (max !== undefined && numeric > max) {
    throw new RamApiError(message, status);
  }
  return numeric;
};

export const assertCondition = (condition: boolean, message: string, status = 400): void => {
  if (!condition) {
    throw new RamApiError(message, status);
  }
};

export const dedupeStrings = (messages: string[]): string[] => Array.from(new Set(messages.filter(Boolean)));
