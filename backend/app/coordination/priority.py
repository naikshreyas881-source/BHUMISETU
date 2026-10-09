from typing import Dict, Any, List, Optional
from datetime import datetime, timezone


class FactorScore:
    def __init__(self, score: float, max_weight: float, explanation: str, data_source: str):
        self.score = round(score, 2)
        self.max_weight = max_weight
        self.explanation = explanation
        self.data_source = data_source

    def to_dict(self) -> Dict[str, Any]:
        return {
            "score": self.score,
            "max_weight": self.max_weight,
            "explanation": self.explanation,
            "data_source": self.data_source,
        }


class PriorityScoreResult:
    def __init__(
        self,
        overall_score: float,
        breakdown: Dict[str, FactorScore],
        plain_language_explanation: str,
        data_sources_used: List[str],
        missing_information: List[str],
        limitations: List[str],
        normalization_method: str = "Linear multi-criteria weighted summation [0, 100]",
    ):
        self.overall_score = round(overall_score, 2)
        self.breakdown = breakdown
        self.plain_language_explanation = plain_language_explanation
        self.data_sources_used = data_sources_used
        self.missing_information = missing_information
        self.limitations = limitations
        self.normalization_method = normalization_method

    def to_dict(self) -> Dict[str, Any]:
        return {
            "overall_score": self.overall_score,
            "breakdown": {k: v.to_dict() for k, v in self.breakdown.items()},
            "plain_language_explanation": self.plain_language_explanation,
            "data_sources_used": self.data_sources_used,
            "missing_information": self.missing_information,
            "limitations": self.limitations,
            "normalization_method": self.normalization_method,
        }


def calculate_priority_score(
    urgency_level: str = "medium",  # "low", "medium", "high", "critical"
    rain_probability_pct: Optional[float] = None,  # 0 to 100 float, or None if missing
    severe_weather_alert: bool = False,
    crop_stage: Optional[str] = None,  # "Sowing", "Vegetative", "Flowering", "Harvesting", or None
    farm_size_acres: Optional[float] = None,
    deadline_hours: Optional[float] = None,
    soil_moisture_suitable: Optional[bool] = None,
) -> PriorityScoreResult:
    """
    Computes an explainable 0–100 priority score.
    Factor Weights:
    - Urgency: 25 pts
    - Weather Risk: 25 pts
    - Crop Readiness / Perishability: 20 pts
    - Farm Impact / Acreage: 10 pts
    - Deadline Proximity: 10 pts
    - Agronomic Soil Window: 10 pts
    Total: 100 pts.
    """
    breakdown: Dict[str, FactorScore] = {}
    data_sources: List[str] = []
    missing_info: List[str] = []
    limitations: List[str] = [
        "Priority score ranks competing requests objectively but never overrides equipment incompatibility, maintenance downtime, or hard schedule conflicts.",
        "Tie-resolution: Ties are resolved chronologically by submission timestamp (first-come, first-served) and shorter travel distance.",
    ]

    # Factor 1: Operational Urgency (Max 25 pts)
    urgency_clean = urgency_level.lower().strip()
    if urgency_clean == "critical":
        urg_score = 25.0
        urg_expl = "Critical urgency specified: Immediate field intervention required."
    elif urgency_clean == "high":
        urg_score = 18.0
        urg_expl = "High urgency specified: Time-sensitive agronomic operation."
    elif urgency_clean == "medium":
        urg_score = 10.0
        urg_expl = "Standard operational priority: Normal scheduled farming activities."
    else:
        urg_score = 4.0
        urg_expl = "Flexible window: Low urgency background farm preparation."
    breakdown["urgency"] = FactorScore(urg_score, 25.0, urg_expl, "Farmer request input")
    data_sources.append("Farmer request declaration")

    # Factor 2: Weather Risk (Max 25 pts)
    if rain_probability_pct is not None:
        data_sources.append("Weather service forecast data")
        if severe_weather_alert:
            weather_score = 25.0
            weather_expl = f"Severe storm alert in effect with {rain_probability_pct}% rain probability; critical pre-weather harvest/protection window."
        else:
            # Scale linearly from 0% (2 pts baseline) to 100% (25 pts)
            weather_score = min(25.0, 2.0 + (rain_probability_pct / 100.0) * 23.0)
            weather_expl = f"Incoming precipitation probability at {rain_probability_pct}%; operational window accounts for rain risk."
    else:
        # Non-negotiable Rule: Do NOT invent missing data; do NOT treat missing weather as zero risk.
        weather_score = 12.5  # Neutral midpoint baseline
        weather_expl = "Live weather forecast data currently unavailable. Assigned neutral default baseline (12.5/25 pts) to avoid penalizing or artificially boosting request."
        missing_info.append("Live precipitation probability / meteorological radar feed")
    breakdown["weather_risk"] = FactorScore(weather_score, 25.0, weather_expl, "Meteorological provider / Neutral fallback")

    # Factor 3: Crop Readiness & Perishability (Max 20 pts)
    if crop_stage:
        data_sources.append("Farm profile crop stage records")
        stage_clean = crop_stage.lower().strip()
        if "harvest" in stage_clean or "ripe" in stage_clean:
            crop_score = 20.0
            crop_expl = f"Crop in peak maturity/harvesting stage ({crop_stage}); highest perishability and field loss risk."
        elif "flower" in stage_clean or "pod" in stage_clean:
            crop_score = 14.0
            crop_expl = f"Crop in critical reproductive/flowering stage ({crop_stage}); high sensitivity to timely spraying or irrigation."
        elif "sow" in stage_clean or "seed" in stage_clean or "transplant" in stage_clean:
            crop_score = 10.0
            crop_expl = f"Crop in establishment/sowing stage ({crop_stage}); germination window is time-bound."
        else:  # Vegetative / Tillering
            crop_score = 6.0
            crop_expl = f"Crop in vegetative growth stage ({crop_stage}); moderate urgency."
    else:
        crop_score = 8.0
        crop_expl = "No specific crop stage declared. Assigned median vegetative baseline (8.0/20 pts)."
        missing_info.append("Crop stage declaration")
    breakdown["crop_readiness"] = FactorScore(crop_score, 20.0, crop_expl, "Farm crop records")

    # Factor 4: Farm Impact & Acreage (Max 10 pts)
    if farm_size_acres is not None and farm_size_acres > 0:
        data_sources.append("Farm land area registry")
        # Scale: 1 acre = 3 pts, 3 acres = 6 pts, 5+ acres = 10 pts
        acre_score = min(10.0, 2.0 + (farm_size_acres / 5.0) * 8.0)
        acre_expl = f"Farm land area of {farm_size_acres} acres represents substantial operational coverage."
    else:
        acre_score = 5.0
        acre_expl = "Farm acreage unspecified. Standard plot baseline assigned (5.0/10 pts)."
        missing_info.append("Farm acreage area")
    breakdown["farm_impact"] = FactorScore(acre_score, 10.0, acre_expl, "Farm profile database")

    # Factor 5: Deadline Proximity (Max 10 pts)
    if deadline_hours is not None:
        data_sources.append("Operation requested schedule timeline")
        if deadline_hours <= 12.0:
            dl_score = 10.0
            dl_expl = f"Immediate deadline: only {deadline_hours} hours remaining before target operational window closes."
        elif deadline_hours <= 24.0:
            dl_score = 8.0
            dl_expl = f"Tight deadline: {deadline_hours} hours until preferred operation time."
        elif deadline_hours <= 48.0:
            dl_score = 5.0
            dl_expl = f"Moderate deadline: {deadline_hours} hours remaining."
        else:
            dl_score = 2.0
            dl_expl = f"Extended planning horizon ({deadline_hours} hours available)."
    else:
        dl_score = 5.0
        dl_expl = "No explicit operational deadline supplied. Standard 48-hour default applied (5.0/10 pts)."
        missing_info.append("Operation deadline proximity hours")
    breakdown["deadline_proximity"] = FactorScore(dl_score, 10.0, dl_expl, "Schedule constraints")

    # Factor 6: Soil & Agronomic Field Window (Max 10 pts)
    if soil_moisture_suitable is not None:
        if soil_moisture_suitable:
            soil_score = 10.0
            soil_expl = "Optimal soil moisture condition for mechanical traction and tillage."
        else:
            soil_score = 3.0
            soil_expl = "Soil conditions suboptimal (excess waterlogging or extreme compaction risk)."
    else:
        soil_score = 7.0
        soil_expl = "Normal regional seasonal soil condition baseline assumed (7.0/10 pts)."
    breakdown["agronomic_window"] = FactorScore(soil_score, 10.0, soil_expl, "Agronomic conditions")

    # Total Score Calculation (Sum of all factor scores, bounded between 0 and 100)
    total_raw = sum(f.score for f in breakdown.values())
    total_score = max(0.0, min(100.0, total_raw))

    # Construct plain-language agronomic explanation
    explanation_parts = [
        f"Overall Priority Assessment: {round(total_score, 1)} / 100.",
        f"Urgency contributed {breakdown['urgency'].score}/{breakdown['urgency'].max_weight} pts ({breakdown['urgency'].explanation}).",
        f"Weather Risk contributed {breakdown['weather_risk'].score}/{breakdown['weather_risk'].max_weight} pts ({breakdown['weather_risk'].explanation}).",
        f"Crop Stage contributed {breakdown['crop_readiness'].score}/{breakdown['crop_readiness'].max_weight} pts ({breakdown['crop_readiness'].explanation}).",
    ]
    if missing_info:
        explanation_parts.append(f"Notice: Missing parameters ({', '.join(missing_info)}) evaluated using neutral agronomic baselines without fabricated values.")

    plain_language_explanation = " ".join(explanation_parts)

    return PriorityScoreResult(
        overall_score=total_score,
        breakdown=breakdown,
        plain_language_explanation=plain_language_explanation,
        data_sources_used=data_sources,
        missing_information=missing_info,
        limitations=limitations,
    )
