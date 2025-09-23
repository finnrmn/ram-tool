import { create } from "zustand";
import type { Component, Distribution, PlotSettings, Scenario, Structure } from "../types";

const createComponentId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `comp-${Math.random().toString(36).slice(2, 10)}`;
};

const createDefaultScenario = (): Scenario => ({
  id: "demo",
  structure: { kind: "series" },
  components: [],
  plotSettings: { tMax: 1000, samples: 200, logScale: false },
});

export type ComponentPatch = Partial<Component> & { distribution?: Partial<Distribution> };

type ScenarioState = {
  scenario: Scenario;
  setScenario: (scenario: Scenario) => void;
  addComponent: () => void;
  updateComponent: (id: string, patch: ComponentPatch) => void;
  removeComponent: (id: string) => void;
  updateStructure: (patch: Partial<Structure>) => void;
  updatePlotSettings: (patch: Partial<PlotSettings>) => void;
  reset: () => void;
};

export const useScenarioStore = create<ScenarioState>((set, get) => ({
  scenario: createDefaultScenario(),
  setScenario: (scenario) => set({ scenario }),
  addComponent: () =>
    set((state) => {
      const index = state.scenario.components.length + 1;
      const newComponent: Component = {
        id: createComponentId(),
        name: `Komponente ${index}`,
        distribution: { type: "exponential" },
        enabled: true,
      };
      return {
        scenario: {
          ...state.scenario,
          components: [...state.scenario.components, newComponent],
        },
      };
    }),
  updateComponent: (id, patch) =>
    set((state) => {
      const { distribution: distributionPatch, ...componentPatch } = patch;
      return {
        scenario: {
          ...state.scenario,
          components: state.scenario.components.map((component) => {
            if (component.id !== id) {
              return component;
            }
            return {
              ...component,
              ...componentPatch,
              distribution: {
                ...component.distribution,
                ...distributionPatch,
                type: "exponential",
              },
            };
          }),
        },
      };
    }),
  removeComponent: (id) =>
    set((state) => ({
      scenario: {
        ...state.scenario,
        components: state.scenario.components.filter((component) => component.id !== id),
      },
    })),
  updateStructure: (patch) =>
    set((state) => ({
      scenario: {
        ...state.scenario,
        structure: {
          ...state.scenario.structure,
          ...patch,
        },
      },
    })),
  updatePlotSettings: (patch) =>
    set((state) => ({
      scenario: {
        ...state.scenario,
        plotSettings: {
          ...state.scenario.plotSettings,
          ...patch,
        },
      },
    })),
  reset: () => set({ scenario: createDefaultScenario() }),
}));
