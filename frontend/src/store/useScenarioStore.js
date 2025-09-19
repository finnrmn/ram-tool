import { create } from "zustand";
const createComponentId = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `comp-${Math.random().toString(36).slice(2, 10)}`;
};
const createDefaultScenario = () => ({
    id: "demo",
    structure: { kind: "series" },
    components: [],
    plotSettings: { tMax: 1000, samples: 200, logScale: false },
});
export const useScenarioStore = create((set, get) => ({
    scenario: createDefaultScenario(),
    setScenario: (scenario) => set({ scenario }),
    addComponent: () => set((state) => {
        const index = state.scenario.components.length + 1;
        const newComponent = {
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
    updateComponent: (id, patch) => set((state) => {
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
    removeComponent: (id) => set((state) => ({
        scenario: {
            ...state.scenario,
            components: state.scenario.components.filter((component) => component.id !== id),
        },
    })),
    updateStructure: (patch) => set((state) => ({
        scenario: {
            ...state.scenario,
            structure: {
                ...state.scenario.structure,
                ...patch,
            },
        },
    })),
    updatePlotSettings: (patch) => set((state) => ({
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
