import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


class WeatherPredictionResult:
    def __init__(
        self,
        score: Optional[float],
        risk_category: str,
        factors: List[Dict[str, Any]],
        expected_weather: Dict[str, Any],
        plain_language_explanation: str,
        suggested_alternatives: List[Dict[str, Any]],
        is_limited_prediction: bool,
        limitations: List[str],
        equipment_category: str,
        operation: str,
    ):
        self.score = score
        self.risk_category = risk_category
        self.factors = factors
        self.expected_weather = expected_weather
        self.plain_language_explanation = plain_language_explanation
        self.suggested_alternatives = suggested_alternatives
        self.is_limited_prediction = is_limited_prediction
        self.limitations = limitations
        self.equipment_category = equipment_category
        self.operation = operation

    def to_dict(self) -> Dict[str, Any]:
        return {
            "score": self.score,
            "risk_category": self.risk_category,
            "factors": self.factors,
            "expected_weather": self.expected_weather,
            "plain_language_explanation": self.plain_language_explanation,
            "suggested_alternatives": self.suggested_alternatives,
            "is_limited_prediction": self.is_limited_prediction,
            "limitations": self.limitations,
            "equipment_category": self.equipment_category,
            "operation": self.operation,
        }


def normalize_equipment_type(category: Optional[str], operation: Optional[str]) -> str:
    """Classifies machinery into agronomic weather-sensitive categories."""
    cat = (category or "").lower().strip()
    op = (operation or "").lower().strip()

    combined = f"{cat} {op}"

    if any(k in combined for k in ["spray", "drone", "chemical", "pesticide", "fungicide", "fertilizer_distribution"]):
        return "sprayer"
    if any(k in combined for k in ["harvest", "combine", "thresh", "reap", "cutting"]):
        return "harvester"
    if any(k in combined for k in ["irrigat", "pump", "water", "drip", "sprinkler"]):
        return "irrigation_pump"
    if any(k in combined for k in ["sow", "seed", "plant", "drill"]):
        return "seeder"
    if any(k in combined for k in ["tractor", "plough", "plow", "till", "harrow", "haul", "level", "cultivat", "rotavat"]):
        return "tractor"
    return "general"


def evaluate_weather_booking_suitability(
    equipment_category: Optional[str],
    operation: str,
    start_time: datetime,
    duration_hours: float,
    weather_data: Dict[str, Any],
    crop_type: Optional[str] = None,
) -> WeatherPredictionResult:
    """
    Evaluates weather suitability for an equipment booking using equipment-specific agronomic rules.
    Base score is 100 with explainable deductions based on validated agricultural thresholds.
    Never fabricates values if weather data is unavailable or beyond the forecast horizon.
    """
    eq_type = normalize_equipment_type(equipment_category, operation)

    # Check if forecast is missing or unavailable
    if not weather_data.get("is_forecast_available", False):
        reason = weather_data.get(
            "reason",
            "Meteorological forecast data is unavailable for this booking time. Predictions cannot be computed without verified data."
        )
        return WeatherPredictionResult(
            score=None,
            risk_category="Limited Prediction / Unverified Horizon",
            factors=[],
            expected_weather={
                "temperature_c": None,
                "relative_humidity_pct": None,
                "max_rain_probability_pct": None,
                "total_expected_rainfall_mm": None,
                "wind_speed_kmh": None,
                "weather_condition": "Forecast unavailable",
                "is_severe_alert": False,
            },
            plain_language_explanation=(
                f"Booking weather suitability cannot be accurately scored: {reason} "
                "BHUMISETU avoids presenting misleadingly precise numbers when live meteorological forecasts are not available. "
                "Please review conditions closer to the booking date."
            ),
            suggested_alternatives=[],
            is_limited_prediction=True,
            limitations=[reason, "Field soil moisture not modeled due to lack of ground telemetry sensors."],
            equipment_category=equipment_category or "machinery",
            operation=operation,
        )

    # Extract verified forecast parameters
    temp_c = weather_data.get("temperature_c", 25.0)
    humidity_pct = weather_data.get("relative_humidity_pct", 60.0)
    rain_prob = weather_data.get("max_rain_probability_pct", 0.0)
    rain_mm = weather_data.get("total_expected_rainfall_mm", 0.0)
    wind_kmh = weather_data.get("max_wind_speed_kmh", 0.0)
    condition = weather_data.get("weather_condition", "Fair")
    is_severe = weather_data.get("is_severe_alert", False)
    alternative_slots = weather_data.get("alternative_slots", [])

    base_score = 100.0
    deductions: List[Dict[str, Any]] = []
    limitations: List[str] = [
        "Soil moisture and trafficability are inferred from rainfall forecasts; ground sensor telemetry was not queried."
    ]

    # --- Equipment-Specific Rules ---

    if eq_type == "sprayer":
        # 1. Wind speed: drift hazard
        if wind_kmh > 20.0:
            deductions.append({
                "factor": "High Wind Speed (Spray Drift)",
                "penalty": 45.0,
                "detail": f"Forecasted wind of {wind_kmh} km/h exceeds the 20 km/h threshold. Severe risk of chemical drift onto adjacent plots, water bodies, or non-target crops.",
                "severity": "high",
            })
        elif wind_kmh > 15.0:
            deductions.append({
                "factor": "Moderate Wind Speed (Spray Drift)",
                "penalty": 20.0,
                "detail": f"Forecasted wind of {wind_kmh} km/h is elevated (15–20 km/h). Requires low-drift anti-drift nozzles and lower boom heights.",
                "severity": "moderate",
            })

        # 2. Rain wash-off
        if rain_mm > 2.0 or rain_prob > 60.0:
            deductions.append({
                "factor": "Rain Wash-off Hazard",
                "penalty": 40.0,
                "detail": f"Rainfall of {rain_mm} mm (probability {rain_prob}%) will wash agrochemicals off crop foliage before systemic or contact uptake.",
                "severity": "high",
            })
        elif rain_mm > 0.5 or rain_prob > 35.0:
            deductions.append({
                "factor": "Precipitation Risk",
                "penalty": 20.0,
                "detail": f"Rain probability {rain_prob}% (expected {rain_mm} mm) may dilute applied solution and reduce product efficacy.",
                "severity": "moderate",
            })

        # 3. High temperature volatilization
        if temp_c > 35.0:
            deductions.append({
                "factor": "High Temperature Evaporation",
                "penalty": 15.0,
                "detail": f"Temperature of {temp_c}°C promotes rapid droplet evaporation and risk of chemical phytotoxicity/leaf burn.",
                "severity": "moderate",
            })

        # 4. Low humidity droplet desiccation
        if humidity_pct < 35.0 and temp_c > 30.0:
            deductions.append({
                "factor": "Low Relative Humidity",
                "penalty": 10.0,
                "detail": f"Relative humidity of {humidity_pct}% causes accelerated droplet shrinkage before reaching lower crop canopy.",
                "severity": "low",
            })

    elif eq_type == "harvester":
        # 1. Rain harvest sensitivity (extreme)
        if rain_mm > 1.0 or rain_prob > 50.0:
            deductions.append({
                "factor": "Wet Crop & Grain Spoilage",
                "penalty": 50.0,
                "detail": f"Rainfall forecast of {rain_mm} mm ({rain_prob}% probability) prevents harvesting: causes thresher drum clogging, grain fungal mold, and heavy combine bogging down in muddy soil.",
                "severity": "high",
            })
        elif rain_mm > 0.2 or rain_prob > 25.0:
            deductions.append({
                "factor": "Elevated Moisture Risk",
                "penalty": 25.0,
                "detail": f"Rain probability of {rain_prob}% ({rain_mm} mm) will elevate grain moisture content, increasing artificial drying costs and dockage.",
                "severity": "moderate",
            })

        # 2. Wind lodging
        if wind_kmh > 35.0:
            deductions.append({
                "factor": "High Wind Reel Disruption",
                "penalty": 20.0,
                "detail": f"Wind speeds of {wind_kmh} km/h hinder cutter-bar operation and risk lodging mature standing crops.",
                "severity": "moderate",
            })

    elif eq_type == "tractor":
        # 1. Rainfall / soil compaction and traction slip
        if rain_mm > 10.0 or rain_prob > 75.0:
            deductions.append({
                "factor": "Heavy Rain & Waterlogging",
                "penalty": 45.0,
                "detail": f"Significant rainfall ({rain_mm} mm, {rain_prob}% prob) causes severe wheel slip, deep rutting, tractor bogging, and destructive subsoil compaction.",
                "severity": "high",
            })
        elif rain_mm > 3.0 or rain_prob > 45.0:
            deductions.append({
                "factor": "Wet Soil Workability",
                "penalty": 25.0,
                "detail": f"Precipitation ({rain_mm} mm, {rain_prob}% prob) reduces tyre traction and can cause soil smearing during tillage.",
                "severity": "moderate",
            })

    elif eq_type == "irrigation_pump":
        # Inverted rain logic: heavy rain makes running pump redundant and harmful
        if rain_mm >= 15.0 or rain_prob >= 70.0:
            deductions.append({
                "factor": "High Rainfall Redundancy",
                "penalty": 55.0,
                "detail": f"Forecasted natural rainfall ({rain_mm} mm, {rain_prob}% prob) will meet crop water requirements. Running irrigation pumps is redundant, wastes power/fuel, and risks root zone waterlogging.",
                "severity": "high",
            })
        elif rain_mm >= 5.0 or rain_prob >= 40.0:
            deductions.append({
                "factor": "Moderate Rain Expected",
                "penalty": 25.0,
                "detail": f"Upcoming rainfall ({rain_mm} mm, {rain_prob}% prob) may provide sufficient moisture; evaluate soil depth before operating pump.",
                "severity": "moderate",
            })
        else:
            # Low rain / dry weather is ideal for irrigation
            base_score = 98.0

        if temp_c > 38.0:
            deductions.append({
                "factor": "Midday Evaporation Loss",
                "penalty": 10.0,
                "detail": f"High ambient temperature ({temp_c}°C) causes high evaporative losses; morning or late afternoon pumping is advised.",
                "severity": "low",
            })

    elif eq_type == "seeder":
        # Sowing & seeding: seed wash-off and crusting
        if rain_mm > 6.0 or rain_prob > 65.0:
            deductions.append({
                "factor": "Seed Wash-off & Furrow Erosion",
                "penalty": 45.0,
                "detail": f"Heavy rain ({rain_mm} mm, {rain_prob}% prob) risks dislodging planted seeds, burying seedbeds under mud, and causing soil crusting that blocks emergence.",
                "severity": "high",
            })
        elif rain_mm > 2.0 or rain_prob > 40.0:
            deductions.append({
                "factor": "Soil Crusting Risk",
                "penalty": 20.0,
                "detail": f"Rainfall ({rain_mm} mm, {rain_prob}% prob) may cause furrow crusting; verify seedbed moisture before drilling.",
                "severity": "moderate",
            })

    else:
        # General machinery / implements
        if rain_mm > 15.0 or rain_prob > 75.0:
            deductions.append({
                "factor": "Heavy Rain Alert",
                "penalty": 35.0,
                "detail": f"Expected rainfall of {rain_mm} mm ({rain_prob}% prob) makes field operations difficult.",
                "severity": "high",
            })
        if wind_kmh > 40.0:
            deductions.append({
                "factor": "High Wind Warning",
                "penalty": 25.0,
                "detail": f"Wind gusts of {wind_kmh} km/h exceed safe open-field machinery thresholds.",
                "severity": "moderate",
            })

    # Universal severe alert deduction (thunderstorms, gale, hail)
    if is_severe:
        deductions.append({
            "factor": "Severe Weather Warning",
            "penalty": 45.0,
            "detail": f"Meteorological condition '{condition}' indicates severe convective storms, lightning risk, or violent showers.",
            "severity": "high",
        })

    # Calculate total score
    total_penalty = sum(d["penalty"] for d in deductions)
    final_score = max(5.0, min(100.0, round(base_score - total_penalty, 1)))

    # Determine risk band (Requirement 1)
    if final_score >= 80.0:
        risk_category = "Highly Suitable"
    elif final_score >= 60.0:
        risk_category = "Generally Suitable"
    elif final_score >= 40.0:
        risk_category = "Moderate Risk"
    else:
        risk_category = "High Risk"

    # Build plain-language explanation
    explanation_parts = []
    explanation_parts.append(
        f"Booking suitability score is {int(round(final_score))}/100 ({risk_category}) for {eq_type.replace('_', ' ').title()} operation ({operation})."
    )

    if deductions:
        main_reasons = [f"{d['factor']}: {d['detail']}" for d in deductions[:2]]
        explanation_parts.append("Key weather constraints: " + " | ".join(main_reasons))
    else:
        explanation_parts.append(
            f"Forecasted conditions are optimal: {condition}, {temp_c}°C, low rain probability ({rain_prob}%), and safe wind speeds ({wind_kmh} km/h)."
        )

    if risk_category in ["Moderate Risk", "High Risk"] and alternative_slots:
        alt_str = alternative_slots[0]["label"]
        explanation_parts.append(
            f"Suggested alternative window: {alt_str} (Rain prob: {alternative_slots[0]['rain_prob_pct']}%, Wind: {alternative_slots[0]['wind_speed_kmh']} km/h)."
        )

    expected_weather_summary = {
        "temperature_c": temp_c,
        "relative_humidity_pct": humidity_pct,
        "max_rain_probability_pct": rain_prob,
        "total_expected_rainfall_mm": rain_mm,
        "wind_speed_kmh": wind_kmh,
        "weather_condition": condition,
        "is_severe_alert": is_severe,
    }

    return WeatherPredictionResult(
        score=final_score,
        risk_category=risk_category,
        factors=deductions,
        expected_weather=expected_weather_summary,
        plain_language_explanation=" ".join(explanation_parts),
        suggested_alternatives=alternative_slots,
        is_limited_prediction=False,
        limitations=limitations,
        equipment_category=equipment_category or eq_type,
        operation=operation,
    )
