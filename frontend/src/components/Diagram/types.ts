import type { Edge, Node } from "reactflow";

export type RootKind = "series" | "parallel" | "kofn";

export type ComponentData = {
  kind: "component";
  name: string;
  lambda?: number;
  mtbf?: number;
  mttr?: number;
  order?: number;
};

export type AndData = {
  kind: "and";
};

export type OrData = {
  kind: "or";
};

export type KofNData = {
  kind: "kofn";
  k: number;
  n: number;
};

export type NodeData = ComponentData | AndData | OrData | KofNData;

export type DiagramNode = Node<NodeData>;
export type DiagramEdge = Edge;

export const isComponentData = (data: NodeData): data is ComponentData => data.kind === "component";
export const isAndData = (data: NodeData): data is AndData => data.kind === "and";
export const isOrData = (data: NodeData): data is OrData => data.kind === "or";
export const isKofNData = (data: NodeData): data is KofNData => data.kind === "kofn";
