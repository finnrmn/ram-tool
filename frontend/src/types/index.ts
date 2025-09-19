export type Distribution = {
  type: "exponential";
  lambda?: number;
  mtbf?: number;
};

export type Component = {
  id: string;
  name: string;
  distribution: Distribution;
  mttr?: number;
  enabled: boolean;
};

export type Structure = {
  kind: "series" | "parallel" | "kofn";
  k?: number;
  n?: number;
};

export type PlotSettings = {
  tMax: number;
  samples: number;
  logScale?: boolean;
};

export type Scenario = {
  id: string;
  structure: Structure;
  components: Component[];
  plotSettings: PlotSettings;
};

export type ConvertInput = {
  mtbf?: number | null;
  lambda?: number | null;
  mttr?: number | null;
};

export type ConvertResponse = {
  mtbf: number;
  lambda: number;
  A: number | null;
  notes: string;
};

export type ReliabilityCurve = {
  t: number[];
  r: number[];
};

export type SolveKpis = {
  R_t0: number;
  t0: number;
  R_tmax: number;
  tmax: number;
};

export type SolveRbdResponse = {
  r_curve: ReliabilityCurve;
  kpis: SolveKpis;
  warnings: string[];
  lambdas: number[];
};
