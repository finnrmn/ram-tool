from math import comb, exp
from typing import List, Literal, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field, model_validator

api_router = APIRouter()


class ConvertRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    mtbf: Optional[float] = Field(None, gt=0)
    lambda_: Optional[float] = Field(None, alias="lambda", gt=0)
    mttr: Optional[float] = Field(None, gt=0)


class ConvertResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    mtbf: float
    lambda_: float = Field(..., alias="lambda")
    A: Optional[float]
    notes: str


class DistributionModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    type: Literal["exponential"]
    lambda_: Optional[float] = Field(None, alias="lambda", gt=0)
    mtbf: Optional[float] = Field(None, gt=0)


class ComponentModel(BaseModel):
    id: str
    name: str
    distribution: DistributionModel
    mttr: Optional[float] = Field(None, gt=0)
    enabled: bool = True


class StructureModel(BaseModel):
    kind: Literal["series", "parallel", "kofn"]
    k: Optional[int] = Field(None, ge=1)
    n: Optional[int] = Field(None, ge=1)


class PlotSettingsModel(BaseModel):
    tMax: float = Field(..., gt=0)
    samples: int = Field(..., ge=2)
    logScale: Optional[bool] = False


class ScenarioModel(BaseModel):
    id: str
    structure: StructureModel
    components: List[ComponentModel]
    plotSettings: PlotSettingsModel


class DistributionReliabilityRequest(BaseModel):
    distribution: DistributionModel
    t: List[float] = Field(..., min_length=1)

    @model_validator(mode="after")
    def validate_times(self) -> "DistributionReliabilityRequest":
        if any(time < 0 for time in self.t):
            raise ValueError("Time values must be non-negative.")
        return self


class DistributionReliabilityResponse(BaseModel):
    r: List[float]
    notes: str


class ReliabilityCurveModel(BaseModel):
    t: List[float]
    r: List[float]


class KpiModel(BaseModel):
    R_t0: float = Field(..., alias="R_t0")
    t0: float
    R_tmax: float = Field(..., alias="R_tmax")
    tmax: float


class SolveRbdResponse(BaseModel):
    r_curve: ReliabilityCurveModel
    kpis: KpiModel
    warnings: List[str]
    lambdas: List[float]


class AvailabilityCurveModel(BaseModel):
    t: List[float]
    a: List[float]


class AvailabilityKpiModel(BaseModel):
    A_ss: float = Field(..., alias="A_ss")
    A_t0: float = Field(..., alias="A_t0")
    A_tmax: float = Field(..., alias="A_tmax")
    t0: float
    tmax: float


class SolveAvailabilityResponse(BaseModel):
    a_curve: AvailabilityCurveModel
    kpis: AvailabilityKpiModel
    warnings: List[str]


@api_router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@api_router.post("/convert", response_model=ConvertResponse)
def convert(request: ConvertRequest) -> ConvertResponse:
    if request.lambda_ is not None:
        lambda_value = request.lambda_
        mtbf_value = 1.0 / lambda_value
    elif request.mtbf is not None:
        mtbf_value = request.mtbf
        lambda_value = 1.0 / mtbf_value
    else:
        raise HTTPException(status_code=400, detail="Provide either lambda or MTBF (both > 0).")

    availability = None
    if request.mttr is not None:
        availability = mtbf_value / (mtbf_value + request.mttr)

    return ConvertResponse(mtbf=mtbf_value, lambda_=lambda_value, A=availability, notes="ok")


@api_router.post("/distribution/r", response_model=DistributionReliabilityResponse)
def distribution_reliability(request: DistributionReliabilityRequest) -> DistributionReliabilityResponse:
    lambda_value = lambda_from_distribution(request.distribution)
    curve = [r_exp(lambda_value, time_point) for time_point in request.t]
    return DistributionReliabilityResponse(r=curve, notes="exponential")


@api_router.post("/solve/rbd", response_model=SolveRbdResponse)
def solve_rbd(scenario: ScenarioModel) -> SolveRbdResponse:
    settings = scenario.plotSettings
    time_points = build_time_vector(settings.tMax, settings.samples)

    active_components = [component for component in scenario.components if component.enabled]
    if not active_components:
        raise HTTPException(status_code=400, detail="Scenario requires at least one active component.")

    component_rates: List[float] = []
    for component in active_components:
        try:
            component_rates.append(lambda_from_distribution(component.distribution))
        except ValueError as exc:
            message = f"Component '{component.name}' requires lambda or MTBF (> 0)."
            raise HTTPException(status_code=400, detail=message) from exc

    structure = scenario.structure
    warnings: List[str] = []

    if structure.kind == "series":
        r_values = reliability_series(component_rates, time_points)
    elif structure.kind == "parallel":
        r_values = reliability_parallel(component_rates, time_points)
    elif structure.kind == "kofn":
        if not structure.k:
            raise HTTPException(status_code=400, detail="k-of-n requires an integer k >= 1.")
        n_value = structure.n or len(active_components)
        if not (1 <= structure.k <= n_value):
            raise HTTPException(status_code=400, detail="k-of-n requires 1 <= k <= n.")
        r_values = reliability_kofn_identical(component_rates, time_points, structure.k, n_value)
        warnings.append("k-of-n uses identical-components MVP assumption (lambda = average).")
    else:
        raise HTTPException(status_code=400, detail="Unsupported structure kind.")

    curve = ReliabilityCurveModel(t=time_points, r=r_values)
    kpis = KpiModel(R_t0=r_values[0], t0=time_points[0], R_tmax=r_values[-1], tmax=time_points[-1])

    return SolveRbdResponse(r_curve=curve, kpis=kpis, warnings=warnings, lambdas=list(component_rates))


@api_router.post("/solve/availability", response_model=SolveAvailabilityResponse)
def solve_availability(scenario: ScenarioModel) -> SolveAvailabilityResponse:
    settings = scenario.plotSettings
    time_points = build_time_vector(settings.tMax, settings.samples)

    active_components = [component for component in scenario.components if component.enabled]
    if not active_components:
        raise HTTPException(status_code=400, detail="Scenario requires at least one active component.")

    warnings: List[str] = []

    if len(active_components) == 1:
        component = active_components[0]
        if component.mttr is None or component.mttr <= 0:
            raise HTTPException(status_code=400, detail="Single-component transient A(t) requires MTTR > 0.")
        lambda_value = lambda_from_distribution(component.distribution)
        mu_value = 1.0 / component.mttr
        total_rate = lambda_value + mu_value
        if total_rate <= 0:
            raise HTTPException(status_code=400, detail="lambda and MTTR must produce positive rates.")
        steady_state = mu_value / total_rate
        a_values = [steady_state + (1.0 - steady_state) * exp(-total_rate * time_point) for time_point in time_points]
        warnings.append("Transient availability based on 2-state Markov model for a single component (MVP).")
    else:
        component_availabilities: List[float] = []
        for component in active_components:
            try:
                mtbf_value = mtbf_from_distribution(component.distribution)
            except ValueError as exc:
                message = f"Component '{component.name}' requires MTBF or lambda."
                raise HTTPException(status_code=400, detail=message) from exc
            if mtbf_value <= 0:
                raise HTTPException(status_code=400, detail=f"Component '{component.name}' must have MTBF > 0.")
            if component.mttr is None or component.mttr <= 0:
                raise HTTPException(status_code=400, detail=f"Component '{component.name}' requires MTTR > 0 for availability analysis.")
            component_availabilities.append(mtbf_value / (mtbf_value + component.mttr))

        structure = scenario.structure
        if structure.kind == "series":
            steady_state = 1.0
            for availability in component_availabilities:
                steady_state *= availability
        elif structure.kind == "parallel":
            unavailability_product = 1.0
            for availability in component_availabilities:
                unavailability_product *= (1.0 - availability)
            steady_state = 1.0 - unavailability_product
        elif structure.kind == "kofn":
            if not structure.k:
                raise HTTPException(status_code=400, detail="k-of-n requires an integer k >= 1.")
            n_value = structure.n or len(active_components)
            if not (1 <= structure.k <= n_value):
                raise HTTPException(status_code=400, detail="k-of-n requires 1 <= k <= n.")
            average_availability = sum(component_availabilities) / len(component_availabilities)
            steady_state = 0.0
            for successes in range(structure.k, n_value + 1):
                steady_state += comb(n_value, successes) * (average_availability ** successes) * ((1 - average_availability) ** (n_value - successes))
            warnings.append("k-of-n uses identical-components MVP assumption (availability = average).")
        else:
            raise HTTPException(status_code=400, detail="Unsupported structure kind.")

        warnings.append("A(t) uses steady-state aggregation; transient effects are not modeled for multi-component systems (MVP).")
        a_values = [steady_state for _ in time_points]

    kpis = AvailabilityKpiModel(
        A_ss=float(a_values[-1]),
        A_t0=float(a_values[0]),
        A_tmax=float(a_values[-1]),
        t0=float(time_points[0]),
        tmax=float(time_points[-1]),
    )
    curve = AvailabilityCurveModel(t=[float(t) for t in time_points], a=[float(value) for value in a_values])

    return SolveAvailabilityResponse(a_curve=curve, kpis=kpis, warnings=warnings)


def lambda_from_distribution(distribution: DistributionModel) -> float:
    if distribution.lambda_ is not None:
        return distribution.lambda_
    if distribution.mtbf is not None:
        return 1.0 / distribution.mtbf
    raise ValueError("Missing lambda and MTBF.")


def mtbf_from_distribution(distribution: DistributionModel) -> float:
    if distribution.mtbf is not None:
        return distribution.mtbf
    if distribution.lambda_ is not None:
        return 1.0 / distribution.lambda_
    raise ValueError("Missing MTBF and lambda.")


def r_exp(rate: float, time_point: float) -> float:
    return float(exp(-rate * time_point))


def build_time_vector(t_max: float, samples: int) -> List[float]:
    if samples < 2:
        raise HTTPException(status_code=400, detail="Samples must be >= 2.")
    if t_max < 0:
        raise HTTPException(status_code=400, detail="tMax must be >= 0.")
    step = t_max / (samples - 1)
    values = [i * step for i in range(samples - 1)]
    values.append(t_max)
    return [float(value) for value in values]


def reliability_series(component_rates: List[float], times: List[float]) -> List[float]:
    total_rate = sum(component_rates)
    return [r_exp(total_rate, time_point) for time_point in times]


def reliability_parallel(component_rates: List[float], times: List[float]) -> List[float]:
    curve: List[float] = []
    for time_point in times:
        failure_product = 1.0
        for rate in component_rates:
            failure_product *= 1.0 - r_exp(rate, time_point)
        curve.append(1.0 - failure_product)
    return curve


def reliability_kofn_identical(
    component_rates: List[float],
    times: List[float],
    k_value: int,
    n_value: int,
) -> List[float]:
    if n_value < 1:
        raise HTTPException(status_code=400, detail="n must be >= 1 for k-of-n.")
    average_rate = sum(component_rates) / len(component_rates)
    curve: List[float] = []
    for time_point in times:
        success_prob = r_exp(average_rate, time_point)
        cumulative = 0.0
        for successes in range(k_value, n_value + 1):
            cumulative += comb(n_value, successes) * (success_prob**successes) * ((1 - success_prob) ** (n_value - successes))
        curve.append(cumulative)
    return curve
