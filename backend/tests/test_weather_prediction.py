import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.main import app
from app.coordination.weather_prediction import (
    evaluate_weather_booking_suitability,
    normalize_equipment_type,
)


@pytest.fixture
def api_client():
    return TestClient(app)


def test_normalize_equipment_type():
    assert normalize_equipment_type("drone", "spraying") == "sprayer"
    assert normalize_equipment_type("sprayer", "pesticide application") == "sprayer"
    assert normalize_equipment_type("harvester", "paddy cutting") == "harvester"
    assert normalize_equipment_type("combine", "threshing") == "harvester"
    assert normalize_equipment_type("tractor", "ploughing") == "tractor"
    assert normalize_equipment_type("pump", "irrigation") == "irrigation_pump"
    assert normalize_equipment_type("seeder", "sowing") == "seeder"
    assert normalize_equipment_type("labour", "weeding") == "general"


def test_sprayer_wind_and_rain_penalties():
    now = datetime.now(timezone.utc)

    # Sprayer in high winds (> 20 km/h) and moderate rain
    risky_weather = {
        "is_forecast_available": True,
        "temperature_c": 28.0,
        "relative_humidity_pct": 70.0,
        "max_rain_probability_pct": 75.0,
        "total_expected_rainfall_mm": 5.0,
        "max_wind_speed_kmh": 24.5,
        "weather_condition": "Rain showers",
        "is_severe_alert": False,
        "alternative_slots": [
            {
                "start_time": (now + timedelta(days=1)).isoformat(),
                "end_time": (now + timedelta(days=1, hours=4)).isoformat(),
                "label": "Tomorrow Morning",
                "rain_prob_pct": 10,
                "wind_speed_kmh": 8.0,
                "expected_rain_mm": 0.0,
            }
        ],
    }

    result = evaluate_weather_booking_suitability(
        equipment_category="drone",
        operation="spraying",
        start_time=now + timedelta(hours=2),
        duration_hours=3.0,
        weather_data=risky_weather,
    )

    assert result.is_limited_prediction is False
    assert result.score is not None
    assert result.score <= 39.0  # High risk band (0–39)
    assert result.risk_category == "High Risk"
    factor_names = [f["factor"] for f in result.factors]
    assert any("Spray Drift" in f for f in factor_names)
    assert any("Wash-off" in f for f in factor_names)
    assert len(result.suggested_alternatives) > 0


def test_sprayer_optimal_calm_conditions():
    now = datetime.now(timezone.utc)

    calm_weather = {
        "is_forecast_available": True,
        "temperature_c": 24.0,
        "relative_humidity_pct": 65.0,
        "max_rain_probability_pct": 5.0,
        "total_expected_rainfall_mm": 0.0,
        "max_wind_speed_kmh": 9.0,
        "weather_condition": "Clear sky",
        "is_severe_alert": False,
        "alternative_slots": [],
    }

    result = evaluate_weather_booking_suitability(
        equipment_category="sprayer",
        operation="micronutrient spray",
        start_time=now + timedelta(hours=5),
        duration_hours=4.0,
        weather_data=calm_weather,
    )

    assert result.is_limited_prediction is False
    assert result.score >= 80.0
    assert result.risk_category == "Highly Suitable"
    assert len(result.factors) == 0


def test_harvester_rain_sensitivity():
    now = datetime.now(timezone.utc)

    rainy_weather = {
        "is_forecast_available": True,
        "temperature_c": 26.0,
        "relative_humidity_pct": 85.0,
        "max_rain_probability_pct": 65.0,
        "total_expected_rainfall_mm": 3.5,
        "max_wind_speed_kmh": 12.0,
        "weather_condition": "Moderate rain",
        "is_severe_alert": False,
        "alternative_slots": [],
    }

    result = evaluate_weather_booking_suitability(
        equipment_category="harvester",
        operation="paddy harvesting",
        start_time=now + timedelta(days=1),
        duration_hours=6.0,
        weather_data=rainy_weather,
    )

    # Harvesters are severely penalized by rain
    assert result.score <= 50.0
    assert result.risk_category in ["High Risk", "Moderate Risk"]
    factor_names = [f["factor"] for f in result.factors]
    assert any("Grain Spoilage" in f or "Harvest Hazard" in f for f in factor_names)


def test_irrigation_pump_inverted_rain_logic():
    now = datetime.now(timezone.utc)

    # 1. Heavy rainfall makes irrigation redundant/wasteful
    heavy_rain = {
        "is_forecast_available": True,
        "temperature_c": 23.0,
        "relative_humidity_pct": 90.0,
        "max_rain_probability_pct": 85.0,
        "total_expected_rainfall_mm": 28.0,
        "max_wind_speed_kmh": 14.0,
        "weather_condition": "Heavy rain showers",
        "is_severe_alert": True,
        "alternative_slots": [],
    }

    result_rain = evaluate_weather_booking_suitability(
        equipment_category="irrigation",
        operation="pumping",
        start_time=now + timedelta(hours=3),
        duration_hours=4.0,
        weather_data=heavy_rain,
    )
    assert result_rain.score <= 39.0
    assert result_rain.risk_category == "High Risk"
    assert any("Redundancy" in f["factor"] for f in result_rain.factors)

    # 2. Dry weather makes irrigation optimal
    dry_weather = {
        "is_forecast_available": True,
        "temperature_c": 31.0,
        "relative_humidity_pct": 45.0,
        "max_rain_probability_pct": 0.0,
        "total_expected_rainfall_mm": 0.0,
        "max_wind_speed_kmh": 11.0,
        "weather_condition": "Mainly clear",
        "is_severe_alert": False,
        "alternative_slots": [],
    }

    result_dry = evaluate_weather_booking_suitability(
        equipment_category="irrigation",
        operation="drip irrigation",
        start_time=now + timedelta(hours=3),
        duration_hours=4.0,
        weather_data=dry_weather,
    )
    assert result_dry.score >= 80.0
    assert result_dry.risk_category == "Highly Suitable"


def test_tractor_heavy_rain_compaction_risk():
    now = datetime.now(timezone.utc)

    heavy_rain = {
        "is_forecast_available": True,
        "temperature_c": 25.0,
        "relative_humidity_pct": 88.0,
        "max_rain_probability_pct": 80.0,
        "total_expected_rainfall_mm": 18.0,
        "max_wind_speed_kmh": 15.0,
        "weather_condition": "Heavy rain",
        "is_severe_alert": False,
        "alternative_slots": [],
    }

    result = evaluate_weather_booking_suitability(
        equipment_category="tractor",
        operation="ploughing",
        start_time=now + timedelta(hours=4),
        duration_hours=5.0,
        weather_data=heavy_rain,
    )
    assert result.score <= 55.0
    assert result.risk_category in ["Moderate Risk", "High Risk"]
    assert any("Compaction" in f["detail"] or "slip" in f["detail"].lower() for f in result.factors)


def test_missing_and_out_of_horizon_weather_handling():
    now = datetime.now(timezone.utc)

    # When forecast is unavailable (e.g. beyond 7 days)
    unavailable_data = {
        "is_forecast_available": False,
        "reason": "Requested booking date is 14 days ahead, which exceeds the 7-day high-resolution meteorological forecast horizon.",
    }

    result = evaluate_weather_booking_suitability(
        equipment_category="tractor",
        operation="harrowing",
        start_time=now + timedelta(days=14),
        duration_hours=4.0,
        weather_data=unavailable_data,
    )

    assert result.is_limited_prediction is True
    assert result.score is None
    assert "Limited Prediction" in result.risk_category
    assert "exceeds the 7-day" in result.plain_language_explanation
    assert len(result.limitations) > 0


def test_weather_prediction_api_endpoint(api_client):
    target_time = (datetime.now(timezone.utc) + timedelta(days=1)).replace(hour=8, minute=0, second=0, microsecond=0)

    # Test API with mock weather window
    with patch("app.api.v1.endpoints.coordination.fetch_weather_forecast_for_window") as mock_fetch:
        mock_fetch.return_value = {
            "is_forecast_available": True,
            "source": "Open-Meteo Meteorological Service",
            "temperature_c": 27.5,
            "relative_humidity_pct": 62.0,
            "max_rain_probability_pct": 15.0,
            "total_expected_rainfall_mm": 0.0,
            "max_wind_speed_kmh": 11.2,
            "weather_condition": "Mainly clear",
            "is_severe_alert": False,
            "alternative_slots": [],
        }

        payload = {
            "resource_id": 1,
            "operation": "ploughing",
            "start_time": target_time.isoformat(),
            "duration_hours": 4.0,
        }

        resp = api_client.post("/api/v1/coordination/weather-prediction", json=payload)
        assert resp.status_code == 200
        data = resp.json()

        assert "score" in data
        assert data["score"] >= 80.0
        assert data["risk_category"] == "Highly Suitable"
        assert "expected_weather" in data
        assert data["expected_weather"]["temperature_c"] == 27.5
        assert data["is_limited_prediction"] is False
        assert "plain_language_explanation" in data
