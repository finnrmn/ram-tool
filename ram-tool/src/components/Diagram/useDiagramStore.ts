import { create } from "zustand";
import {
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  MarkerType,
} from "reactflow";

import type { Scenario, SolveKpis } from "../../types";
import type { ValidationSummary } from "./validation";
import type { ComponentData, DiagramEdge, DiagramNode, RootKind } from "./types";
import { isComponentData, isKofNData } from "./types";

const ROOT_NODE_ID = "diagram-root";
const COMPONENT_BASE_ID = "component";
const ROOT_POSITION = { x: 0, y: 0 } as const;
const SERIES_OFFSET_X = 220;
const PARALLEL_OFFSET_X = 220;
const PARALLEL_OFFSET_Y = 120;

const rootTypeForKind = (kind: RootKind): "andNode" | "orNode" | "kofnNode" => (kind === "series" ? "andNode" : kind === "parallel" ? "orNode" : "kofnNode");

const createComponentId = (order: number) => `${COMPONENT_BASE_ID}-${order}`;

const createRootNode = (kind: RootKind, existing?: DiagramNode): DiagramNode => {
  const baseData =
    kind === "series"
      ? { kind: "and" as const }
      : kind === "parallel"
        ? { kind: "or" as const }
        : { kind: "kofn" as const, k: 1, n: 0 };

  if (existing) {
    if (kind === "kofn" && isKofNData(existing.data)) {
      return {
        ...existing,
        type: rootTypeForKind(kind),
        data: {
          kind: "kofn" as const,
          k: Math.max(1, existing.data.k),
          n: existing.data.n,
        },
      };
    }
    return {
      ...existing,
      type: rootTypeForKind(kind),
      data: baseData,
    };
  }

  return {
    id: ROOT_NODE_ID,
    type: rootTypeForKind(kind),
    position: { ...ROOT_POSITION },
    data: baseData,
    selectable: true,
    selected: true,
  };
};

const ensureRootNode = (nodes: DiagramNode[], kind: RootKind): DiagramNode[] => {
  const existing = nodes.find((node) => node.id === ROOT_NODE_ID);
  if (existing) {
    return nodes.map((node) => (node.id === ROOT_NODE_ID ? createRootNode(kind, node) : node));
  }
  return [createRootNode(kind), ...nodes];
};

const syncKofNData = (root: DiagramNode, componentCount: number): DiagramNode => {
  if (!isKofNData(root.data)) {
    return root;
  }
  const clampedK = Math.min(Math.max(root.data.k, 1), Math.max(componentCount, 1));
  return {
    ...root,
    data: {
      kind: "kofn" as const,
      k: clampedK,
      n: componentCount,
    },
  };
};

const normalizeComponentNodes = (components: DiagramNode[]): DiagramNode[] => {
  const sorted = [...components].sort((a, b) => {
    const orderA = (a.data as ComponentData).order ?? 0;
    const orderB = (b.data as ComponentData).order ?? 0;
    return orderA - orderB;
  });

  return sorted.map((node, index) => {
    const data = node.data as ComponentData;
    return {
      ...node,
      data: {
        ...data,
        order: index + 1,
        name: data.name || `Komponente ${index + 1}`,
      },
    };
  });
};

const positionComponents = (kind: RootKind, components: DiagramNode[]): DiagramNode[] => {
  if (kind === "series") {
    return components.map((node, index) => ({
      ...node,
      position: {
        x: ROOT_POSITION.x + SERIES_OFFSET_X * (index + 1),
        y: ROOT_POSITION.y,
      },
    }));
  }

  return components.map((node, index) => ({
    ...node,
    position: {
      x: ROOT_POSITION.x + PARALLEL_OFFSET_X,
      y: ROOT_POSITION.y + index * PARALLEL_OFFSET_Y,
    },
  }));
};

const buildEdgesForKind = (kind: RootKind, components: DiagramNode[]): DiagramEdge[] => {
  if (components.length === 0) {
    return [];
  }
  if (kind === "series") {
    const [first, ...rest] = components;
    const edges: DiagramEdge[] = [createEdge(ROOT_NODE_ID, first.id)];
    rest.forEach((node, index) => {
      const previous = components[index];
      edges.push(createEdge(previous.id, node.id));
    });
    return edges;
  }
  return components.map((node) => createEdge(ROOT_NODE_ID, node.id));
};

const createEdge = (source: string, target: string): DiagramEdge => ({
  id: `${source}->${target}`,
  source,
  target,
  type: "smoothstep",
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 14,
    height: 14,
    color: "#38bdf8",
  },
});

const synchronizeGraph = (nodes: DiagramNode[], kind: RootKind, selectedId: string | null) => {
  const withRoot = ensureRootNode(nodes, kind);
  const componentNodes = withRoot.filter((node) => node.id !== ROOT_NODE_ID && isComponentData(node.data));
  const normalizedComponents = normalizeComponentNodes(componentNodes);
  const positionedComponents = positionComponents(kind, normalizedComponents);
  const edges = buildEdgesForKind(kind, positionedComponents);

  const updatedNodes = withRoot.map((node) => {
    if (node.id === ROOT_NODE_ID) {
      const updatedRoot = createRootNode(kind, node);
      const syncedRoot = kind === "kofn" ? syncKofNData(updatedRoot, positionedComponents.length) : updatedRoot;
      return {
        ...syncedRoot,
        selected: selectedId ? syncedRoot.id === selectedId : false,
      };
    }
    const replacement = positionedComponents.find((candidate) => candidate.id === node.id);
    if (!replacement) {
      return {
        ...node,
        selected: selectedId ? node.id === selectedId : false,
      };
    }
    return {
      ...replacement,
      selected: selectedId ? replacement.id === selectedId : false,
    };
  });

  return { nodes: updatedNodes, edges };
};

const nextOrder = (nodes: DiagramNode[]) => {
  const orders = nodes
    .filter((node) => node.id !== ROOT_NODE_ID && isComponentData(node.data))
    .map((node) => (node.data as ComponentData).order ?? 0);
  const maxOrder = orders.length > 0 ? Math.max(...orders) : 0;
  return maxOrder + 1;
};

type SolveStatus = "idle" | "pending" | "success" | "error";

type DiagramState = {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  rootKind: RootKind;
  selectedNodeId: string | null;
  validation: ValidationSummary;
  solveStatus: SolveStatus;
  solveError: string | null;
  solveWarnings: string[];
  scenario: Scenario | null;
  kpis: SolveKpis | null;
  setNodes: (changes: NodeChange[]) => void;
  setEdges: (changes: EdgeChange[]) => void;
  setSelectedNodeId: (id: string | null) => void;
  setRoot: (kind: RootKind) => void;
  setK: (k: number) => void;
  setN: (n: number) => void;
  addComponent: () => void;
  removeNode: (id: string) => void;
  setNodeData: (id: string, patch: Partial<ComponentData>) => void;
  connect: (connection: Connection) => void;
  resetPreset: (name: "2-out-of-3") => void;
  setValidation: (validation: ValidationSummary) => void;
  setSolvePending: (scenario: Scenario | null, warnings: string[]) => void;
  setSolveSuccess: (kpis: SolveKpis, warnings: string[]) => void;
  setSolveError: (message: string) => void;
  setValidationError: (message: string, warnings: string[]) => void;
};

const initialGraph = synchronizeGraph([createRootNode("series")], "series", ROOT_NODE_ID);

export const useDiagramStore = create<DiagramState>((set, get) => ({
  nodes: initialGraph.nodes,
  edges: initialGraph.edges,
  rootKind: "series",
  selectedNodeId: ROOT_NODE_ID,
  validation: { errors: [], warnings: [] },
  solveStatus: "idle",
  solveError: null,
  solveWarnings: [],
  scenario: null,
  kpis: null,

  setNodes: (changes) => {
    const updated = applyNodeChanges(changes, get().nodes);
    const { nodes, edges } = synchronizeGraph(updated, get().rootKind, get().selectedNodeId);
    set({ nodes, edges });
  },

  setEdges: (changes) => {
    const updated = applyEdgeChanges(changes, get().edges);
    set({ edges: updated });
  },

  setSelectedNodeId: (id) => {
    const { nodes, edges } = synchronizeGraph(get().nodes, get().rootKind, id);
    set({ selectedNodeId: id, nodes, edges });
  },

  setRoot: (kind) => {
    const { nodes, edges } = synchronizeGraph(get().nodes, kind, ROOT_NODE_ID);
    set({ nodes, edges, rootKind: kind, selectedNodeId: ROOT_NODE_ID });
  },

  setK: (k) => {
    set((state) => {
      if (state.rootKind !== "kofn") {
        return state;
      }
      const nodes = state.nodes.map((node) => {
        if (node.id !== ROOT_NODE_ID || !isKofNData(node.data)) {
          return node;
        }
        return {
          ...node,
          data: {
            ...node.data,
            k,
          },
        };
      });
      return { nodes };
    });
  },

  setN: (n) => {
    set((state) => {
      if (state.rootKind !== "kofn") {
        return state;
      }
      const nodes = state.nodes.map((node) => {
        if (node.id !== ROOT_NODE_ID || !isKofNData(node.data)) {
          return node;
        }
        return {
          ...node,
          data: {
            ...node.data,
            n,
          },
        };
      });
      return { nodes };
    });
  },

  addComponent: () => {
    set((state) => {
      const order = nextOrder(state.nodes);
      const newNode: DiagramNode = {
        id: createComponentId(order),
        type: "componentNode",
        position: { x: ROOT_POSITION.x + PARALLEL_OFFSET_X, y: ROOT_POSITION.y },
        data: {
          kind: "component",
          name: `Komponente ${order}`,
          order,
        },
        selectable: true,
        selected: true,
      };
      const { nodes, edges } = synchronizeGraph([...state.nodes, newNode], state.rootKind, newNode.id);
      return {
        nodes,
        edges,
        selectedNodeId: newNode.id,
      };
    });
  },

  removeNode: (id) => {
    if (id === ROOT_NODE_ID) {
      return;
    }
    set((state) => {
      const filtered = state.nodes.filter((node) => node.id !== id);
      const fallback = filtered.find((node) => node.id !== ROOT_NODE_ID)?.id ?? ROOT_NODE_ID;
      const { nodes, edges } = synchronizeGraph(filtered, state.rootKind, fallback);
      return {
        nodes,
        edges,
        selectedNodeId: fallback,
      };
    });
  },

  setNodeData: (id, patch) => {
    set((state) => {
      const nodes = state.nodes.map((node) => {
        if (node.id !== id || !isComponentData(node.data)) {
          return node;
        }
        return {
          ...node,
          data: {
            ...node.data,
            ...patch,
          },
        };
      });
      return { nodes };
    });
  },

  connect: () => {
    const components = get().nodes.filter((node) => node.id !== ROOT_NODE_ID && isComponentData(node.data));
    const normalized = normalizeComponentNodes(components);
    const edges = buildEdgesForKind(get().rootKind, normalized);
    set({ edges });
  },

  resetPreset: (name) => {
    if (name !== "2-out-of-3") {
      return;
    }
    const presetNodes: DiagramNode[] = [
      createRootNode("kofn"),
      {
        id: createComponentId(1),
        type: "componentNode",
        position: { x: ROOT_POSITION.x + PARALLEL_OFFSET_X, y: ROOT_POSITION.y },
        data: { kind: "component", name: "Komponente 1", lambda: 0.001, order: 1 },
        selectable: true,
      },
      {
        id: createComponentId(2),
        type: "componentNode",
        position: { x: ROOT_POSITION.x + PARALLEL_OFFSET_X, y: ROOT_POSITION.y + PARALLEL_OFFSET_Y },
        data: { kind: "component", name: "Komponente 2", lambda: 0.001, order: 2 },
        selectable: true,
      },
      {
        id: createComponentId(3),
        type: "componentNode",
        position: { x: ROOT_POSITION.x + PARALLEL_OFFSET_X, y: ROOT_POSITION.y + 2 * PARALLEL_OFFSET_Y },
        data: { kind: "component", name: "Komponente 3", lambda: 0.001, order: 3 },
        selectable: true,
      },
    ];
    const { nodes, edges } = synchronizeGraph(presetNodes, "kofn", createComponentId(3));
    const adjustedNodes = nodes.map((node) => {
      if (node.id !== ROOT_NODE_ID) {
        return node;
      }
      return {
        ...node,
        data: {
          kind: "kofn" as const,
          k: 2,
          n: 3,
        },
        type: rootTypeForKind("kofn"),
      } as DiagramNode;
    });
    set({
      nodes: adjustedNodes,
      edges,
      rootKind: "kofn",
      selectedNodeId: createComponentId(3),
    });
  },

  setValidation: (validation) => {
    set({ validation });
  },

  setSolvePending: (scenario, warnings) => {
    set({
      solveStatus: "pending",
      solveError: null,
      solveWarnings: warnings,
      scenario,
      kpis: null,
    });
  },

  setSolveSuccess: (kpis, warnings) => {
    set({
      solveStatus: "success",
      solveError: null,
      kpis,
      solveWarnings: warnings,
    });
  },

  setSolveError: (message) => {
    set({
      solveStatus: "error",
      solveError: message,
    });
  },

  setValidationError: (message, warnings) => {
    set({
      solveStatus: "error",
      solveError: message,
      solveWarnings: warnings,
      scenario: null,
      kpis: null,
    });
  },
}));






