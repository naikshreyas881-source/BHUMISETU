from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class SuitabilityCheckRequest(BaseModel):
    resource_id: int
    operation: str = Field(..., min_length=2, max_length=100)
    start_time: datetime
    duration_hours: float = Field(..., gt=0.0, le=72.0)
    farm_id: Optional[int] = None
    max_budget: Optional[float] = Field(None, gt=0.0)


class SuitabilityCheckResponse(BaseModel):
    is_feasible: bool
    rejection_reasons: List[str]
    feasibility_reasons: List[str]
    estimated_cost: float
    distance_km: Optional[float] = None
    travel_time_hours: float = 0.0

    model_config = ConfigDict(from_attributes=True)


class FactorScoreSchema(BaseModel):
    score: float
    max_weight: float
    explanation: str
    data_source: str


class PriorityScoreRequest(BaseModel):
    urgency_level: str = "medium"
    rain_probability_pct: Optional[float] = Field(None, ge=0.0, le=100.0)
    severe_weather_alert: bool = False
    crop_stage: Optional[str] = None
    farm_size_acres: Optional[float] = Field(None, gt=0.0)
    deadline_hours: Optional[float] = Field(None, gt=0.0)
    soil_moisture_suitable: Optional[bool] = None


class PriorityScoreResponse(BaseModel):
    overall_score: float
    breakdown: Dict[str, FactorScoreSchema]
    plain_language_explanation: str
    data_sources_used: List[str]
    missing_information: List[str]
    limitations: List[str]
    normalization_method: str

    model_config = ConfigDict(from_attributes=True)


class ConflictCheckRequest(BaseModel):
    resource_id: int
    start_time: datetime
    duration_hours: float = Field(..., gt=0.0, le=72.0)
    exclude_booking_id: Optional[int] = None


class ConflictCheckResponse(BaseModel):
    has_conflict: bool
    conflict_type: Optional[str] = None
    conflict_details: List[str]
    conflicting_booking_ids: List[int]
    conflicting_maintenance_ids: List[int]

    model_config = ConfigDict(from_attributes=True)


class RecommendationRequest(BaseModel):
    resource_id: int
    operation: str = Field(..., min_length=2, max_length=100)
    start_time: datetime
    duration_hours: float = Field(..., gt=0.0, le=72.0)
    farm_id: Optional[int] = None
    max_budget: Optional[float] = Field(None, gt=0.0)


class RecommendationResponse(BaseModel):
    preferred_feasible: bool
    preferred_reasons: List[str]
    alternative_resources: List[Dict[str, Any]]
    alternative_time_slots: List[Dict[str, Any]]
    explainable_recommendation: str

    model_config = ConfigDict(from_attributes=True)


class WeatherBookingPredictionRequest(BaseModel):
    resource_id: Optional[int] = None
    equipment_category: Optional[str] = None
    operation: str = Field(..., min_length=2, max_length=100)
    start_time: datetime
    duration_hours: float = Field(..., gt=0.0, le=72.0)
    farm_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    crop_type: Optional[str] = None


class WeatherBookingPredictionResponse(BaseModel):
    score: Optional[float] = None
    risk_category: str
    factors: List[Dict[str, Any]]
    expected_weather: Dict[str, Any]
    plain_language_explanation: str
    suggested_alternatives: List[Dict[str, Any]] = []
    is_limited_prediction: bool = False
    limitations: List[str] = []
    equipment_category: str
    operation: str

    model_config = ConfigDict(from_attributes=True)

