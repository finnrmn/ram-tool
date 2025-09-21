export type DistributionType = "exponential";

export type DistributionModel = {
  type: DistributionType;
  lambda?: number | null;
  mtbf?: number | null;
};

export type ComponentModel = {
  id: string;
  name: string;
  distribution: DistributionModel;
  mttr?: number | null;
  enabled: boolean;
};

export type StructureKind = "series" | "parallel" | "kofn";

export type StructureModel = {
  kind: StructureKind;
  k?: number | null;
  n?: number | null;
};

export type PlotSettingsModel = {
  tMax: number;
  samples: number;
  logScale?: boolean | null;
};

export type ScenarioModel = {
  id: string;
  structure: StructureModel;
  components: ComponentModel[];
  plotSettings: PlotSettingsModel;
};

export type ConvertRequest = {
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

export type DistributionReliabilityRequest = {
  distribution: DistributionModel;
  t: number[];
};

export type DistributionReliabilityResponse = {
  r: number[];
  notes: string;
};

export type ReliabilityCurveModel = {
  t: number[];
  r: number[];
};

export type ReliabilityKpiModel = {
  R_t0: number;
  t0: number;
  R_tmax: number;
  tmax: number;
};

export type SolveRbdResponse = {
  r_curve: ReliabilityCurveModel;
  kpis: ReliabilityKpiModel;
  warnings: string[];
  lambdas: number[];
};

export type AvailabilityCurveModel = {
  t: number[];
  a: number[];
};

export type AvailabilityKpiModel = {
  A_ss: number;
  A_t0: number;
  A_tmax: number;
  t0: number;
  tmax: number;
};

export type SolveAvailabilityResponse = {
  a_curve: AvailabilityCurveModel;
  kpis: AvailabilityKpiModel;
  warnings: string[];
};

export type HealthResponse = {
  status: "ok";
};
