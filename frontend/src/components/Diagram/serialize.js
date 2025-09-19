import { isComponentData, isKofNData } from "./types";
import { isPositive, isValidKofN, validateComponentParams } from "./validation";
const DEFAULT_PLOT_SETTINGS = {
    tMax: 1000,
    samples: 200,
    logScale: false,
};
const buildNodeLookup = (nodes) => {
    const lookup = new Map();
    nodes.forEach((node) => lookup.set(node.id, node));
    return lookup;
};
const sortComponentsByPosition = (components, axis) => {
    return [...components].sort((a, b) => {
        const delta = a.position[axis] - b.position[axis];
        if (delta !== 0) {
            return delta;
        }
        return a.position.y - b.position.y;
    });
};
export const serializeDiagram = (nodes, edges, rootKind) => {
    const warnings = [];
    const errors = [];
    if (nodes.length === 0) {
        errors.push("Keine Diagrammknoten gefunden.");
        return { scenario: null, warnings, errors };
    }
    const rootNode = nodes.find((node) => !isComponentData(node.data));
    if (!rootNode) {
        errors.push("Root-Knoten fehlt.");
        return { scenario: null, warnings, errors };
    }
    const componentNodes = nodes.filter((node) => isComponentData(node.data));
    if (componentNodes.length === 0) {
        errors.push("Mindestens eine Komponente erforderlich.");
        return { scenario: null, warnings, errors };
    }
    const nodeLookup = buildNodeLookup(nodes);
    const followChain = () => {
        const chain = [];
        const visited = new Set();
        let currentEdge = edges.find((edge) => edge.source === rootNode.id);
        while (currentEdge) {
            const node = nodeLookup.get(currentEdge.target);
            if (!node || !isComponentData(node.data) || visited.has(node.id)) {
                break;
            }
            chain.push(node);
            visited.add(node.id);
            currentEdge = edges.find((edge) => edge.source === node.id);
        }
        return chain;
    };
    let orderedComponents = [];
    if (rootKind === "series") {
        const chain = followChain();
        orderedComponents = chain.length === componentNodes.length ? chain : sortComponentsByPosition(componentNodes, "x");
    }
    else {
        const childEdges = edges.filter((edge) => edge.source === rootNode.id);
        const orderedByEdge = childEdges
            .map((edge) => nodeLookup.get(edge.target))
            .filter((node) => Boolean(node && isComponentData(node.data)));
        if (orderedByEdge.length === componentNodes.length) {
            orderedComponents = orderedByEdge;
        }
        else {
            orderedComponents = sortComponentsByPosition(componentNodes, "y");
        }
    }
    const structure = { kind: rootKind };
    if (rootKind === "kofn") {
        if (isKofNData(rootNode.data)) {
            const normalizedN = orderedComponents.length;
            const inputK = rootNode.data.k;
            const { ok, message } = isValidKofN(inputK, normalizedN);
            if (!ok && message) {
                errors.push(message);
            }
            structure.k = Math.max(1, Math.min(inputK, normalizedN || 1));
            structure.n = normalizedN;
            if (rootNode.data.n !== normalizedN) {
                warnings.push(`n wurde auf ${normalizedN} Komponenten synchronisiert.`);
            }
        }
        else {
            errors.push("k-of-n Root-Daten fehlen.");
        }
    }
    if (rootKind === "series") {
        structure.kind = "series";
    }
    if (rootKind === "parallel") {
        structure.kind = "parallel";
    }
    const components = orderedComponents.map((node, index) => {
        const data = node.data;
        if (!isComponentData(data)) {
            throw new Error("Komponentendaten fehlen.");
        }
        const distribution = { type: "exponential" };
        if (isPositive(data.lambda)) {
            distribution.lambda = data.lambda;
        }
        else if (isPositive(data.mtbf)) {
            distribution.mtbf = data.mtbf;
        }
        if (!isPositive(data.lambda) && !isPositive(data.mtbf)) {
            warnings.push(...validateComponentParams(data).warnings);
        }
        const component = {
            id: node.id,
            name: data.name || `Komponente ${index + 1}`,
            distribution,
            enabled: true,
        };
        if (typeof data.mttr === "number" && Number.isFinite(data.mttr) && data.mttr >= 0) {
            component.mttr = data.mttr;
        }
        return component;
    });
    const scenario = {
        id: "diagram",
        structure,
        components,
        plotSettings: { ...DEFAULT_PLOT_SETTINGS },
    };
    return { scenario, warnings, errors };
};
