from fastapi import APIRouter, Query
from typing import Dict, Any
from app.services.weather import fetch_live_weather

router = APIRouter()

@router.get("/forecast", response_model=Dict[str, Any])
def get_weather_forecast(
    latitude: float = Query(12.5218, ge=-90.0, le=90.0, description="Latitude (default Mandya)"),
    longitude: float = Query(76.8951, ge=-180.0, le=180.0, description="Longitude (default Mandya)"),
):
    """
    Returns real-time weather and precipitation forecast for agricultural scheduling.
    """
    return fetch_live_weather(latitude=latitude, longitude=longitude)
