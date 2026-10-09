from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.marketplace import Resource, Farm
from app.coordination import (
    evaluate_resource_suitability,
    calculate_priority_score,
    detect_booking_conflicts,
    recommend_alternatives,
)
from app.schemas.coordination import (
    SuitabilityCheckRequest,
    SuitabilityCheckResponse,
    PriorityScoreRequest,
    PriorityScoreResponse,
    ConflictCheckRequest,
    ConflictCheckResponse,
    RecommendationRequest,
    RecommendationResponse,
)

router = APIRouter()


@router.post("/check-suitability", response_model=SuitabilityCheckResponse)
def check_suitability(req: SuitabilityCheckRequest, db: Session = Depends(get_db)):
    """Evaluate equipment capabilities, distance, budget, and downtime hard constraints."""
    resource = db.query(Resource).filter(Resource.id == req.resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    farm = None
    if req.farm_id:
        farm = db.query(Farm).filter(Farm.id == req.farm_id).first()

    eval_result = evaluate_resource_suitability(
        resource=resource,
        operation=req.operation,
        start_time=req.start_time,
        duration_hours=req.duration_hours,
        farm=farm,
        max_budget=req.max_budget,
        existing_bookings=resource.bookings,
        maintenance_windows=resource.maintenance_windows,
    )

    return SuitabilityCheckResponse(**eval_result.to_dict())


@router.post("/priority-score", response_model=PriorityScoreResponse)
def compute_priority_score(req: PriorityScoreRequest):
    """
    Calculate an explainable 0–100 priority score based on urgency, weather risk,
    crop perishability, farm impact, and deadline proximity.
    """
    result = calculate_priority_score(
        urgency_level=req.urgency_level,
        rain_probability_pct=req.rain_probability_pct,
        severe_weather_alert=req.severe_weather_alert,
        crop_stage=req.crop_stage,
        farm_size_acres=req.farm_size_acres,
        deadline_hours=req.deadline_hours,
        soil_moisture_suitable=req.soil_moisture_suitable,
    )
    return PriorityScoreResponse(**result.to_dict())


@router.post("/check-conflicts", response_model=ConflictCheckResponse)
def check_conflicts(req: ConflictCheckRequest, db: Session = Depends(get_db)):
    """Detect overlapping bookings and scheduled maintenance windows."""
    resource = db.query(Resource).filter(Resource.id == req.resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    end_time = req.start_time + timedelta(hours=req.duration_hours)
    report = detect_booking_conflicts(
        db=db,
        resource_id=req.resource_id,
        start_time=req.start_time,
        end_time=end_time,
        exclude_booking_id=req.exclude_booking_id,
    )

    return ConflictCheckResponse(**report.to_dict())


@router.post("/recommend", response_model=RecommendationResponse)
def generate_recommendations(req: RecommendationRequest, db: Session = Depends(get_db)):
    """Evaluate preferred resource and discover non-conflicting alternatives and slots."""
    resource = db.query(Resource).filter(Resource.id == req.resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    farm = None
    if req.farm_id:
        farm = db.query(Farm).filter(Farm.id == req.farm_id).first()

    rec_result = recommend_alternatives(
        db=db,
        resource=resource,
        operation=req.operation,
        start_time=req.start_time,
        duration_hours=req.duration_hours,
        farm=farm,
        max_budget=req.max_budget,
    )

    return RecommendationResponse(**rec_result.to_dict())
