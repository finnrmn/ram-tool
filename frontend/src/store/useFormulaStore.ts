import { create } from "zustand";
import type {
  AvailabilitySolveResponse,
  ConvertInput,
  ConvertResponse,
  Scenario,
  SolveRbdResponse,
} from "../types";
import {
  buildAvailabilityContext,
  buildConverterContext,
  buildRbdContext,
} from "../formulas/engine";

export type FormulaEquation = {
  id: string;
  title: string;
  latexGeneral: string;
  latexWithValues?: string;
  note?: string;
};

export type FormulaContext =
  | { kind: "converter"; equations: FormulaEquation[] }
  | { kind: "rbd"; structure: "series" | "parallel" | "kofn"; equations: FormulaEquation[] }
  | { kind: "availability"; equations: FormulaEquation[] }
  | null;

type FormulaStore = {
  context: FormulaContext;
  setFromConverter: (input: ConvertInput, result: ConvertResponse) => void;
  setFromRbd: (scenario: Scenario, result: SolveRbdResponse) => void;
  setFromAvailability: (scenario: Scenario, result: AvailabilitySolveResponse) => void;
  clear: () => void;
};

export const useFormulaStore = create<FormulaStore>((set) => ({
  context: null,
  setFromConverter: (input, result) => set({ context: buildConverterContext(input, result) }),
  setFromRbd: (scenario, result) => set({ context: buildRbdContext(scenario, result) }),
  setFromAvailability: (scenario, result) => set({ context: buildAvailabilityContext(scenario, result) }),
  clear: () => set({ context: null }),
}));