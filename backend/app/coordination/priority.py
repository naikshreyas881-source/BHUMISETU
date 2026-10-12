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
            "priority_score": self.overall_score,
            "breakdown": {k: v.to_dict() for k, v in self.breakdown.items()},
            "plain_language_explanation": self.plain_language_explanation,
            "explanation": self.plain_language_explanation,
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
    waiting_time_hours: Optional[float] = None,  # Queue age in hours
    deadline_hours: Optional[float] = None,  # Hours until requested start/deadline
    operational_feasibility: Optional[float] = None,  # 0 to 10 score
    equipment_category: Optional[str] = None,
    operation: Optional[str] = None,
    wind_speed_kmh: Optional[float] = None,
    total_rainfall_mm: Optional[float] = None,
    farm_size_acres: Optional[float] = None,
    soil_moisture_suitable: Optional[bool] = None,
) -> PriorityScoreResult:
    """
    Computes an authoritative, explainable 0–100 priority score for agricultural resource requests.
    
    Standard 6-Factor Model:
    1. Agricultural Urgency:                                  25 pts
    2. Weather-Related Risk or Opportunity:                    25 pts
    3. Crop Readiness / Perishability:                         20 pts
    4. Waiting Time (Queue Age):                               10 pts
    5. Deadline Proximity:                                     10 pts
    6. Operational Feasibility & Validated Constraints:        10 pts
    Total:                                                    100 pts
    """
    breakdown: Dict[str, FactorScore] = {}
    data_sources: List[str] = []
    missing_info: List[str] = []
    limitations: List[str] = [
        "Priority score ranks competing requests objectively but never overrides equipment incompatibility, maintenance downtime, or hard schedule conflicts.",
        "Tie-resolution: Ties are resolved chronologically by submission timestamp (first-come, first-served) and shorter travel distance.",
    ]

    # -------------------------------------------------------------
    # Factor 1: Agricultural Urgency (Max 25 pts)
    # -------------------------------------------------------------
    urgency_clean = (urgency_level or "medium").lower().strip()
    if urgency_clean == "critical":
        urg_score = 25.0
        urg_expl = "Critical agricultural urgency: Immediate intervention needed to prevent field or crop loss."
    elif urgency_clean == "high":
        urg_score = 18.0
        urg_expl = "High urgency: Time-sensitive agronomic operation."
    elif urgency_clean == "medium":
        urg_score = 10.0
        urg_expl = "Standard operational priority: Normal scheduled farming activities."
    else:
        urg_score = 4.0
        urg_expl = "Flexible window: Low urgency background farm preparation."
    breakdown["urgency"] = FactorScore(urg_score, 25.0, urg_expl, "Farmer request input")
    data_sources.append("Farmer request declaration")

    # -------------------------------------------------------------
    # Factor 2: Weather-Related Risk or Opportunity (Max 25 pts)
    # -------------------------------------------------------------
    eq_cat = (equipment_category or "").lower().strip()
    op_clean = (operation or "").lower().strip()
    is_sprayer = any(k in f"{eq_cat} {op_clean}" for k in ["spray", "drone", "chemical", "pesticide"])
    is_irrigation = any(k in f"{eq_cat} {op_clean}" for k in ["irrigat", "pump", "water"])
    is_harvester = any(k in f"{eq_cat} {op_clean}" for k in ["harvest", "combine", "thresh", "reap"])
    is_drone = "drone" in f"{eq_cat} {op_clean}"

    if rain_probability_pct is not None:
        data_sources.append("Weather service forecast data")
        
        # Equipment-specific weather evaluation:
        if is_irrigation:
            # Inverted rain logic: if heavy rain is coming, irrigation need is low; if dry, urgency is high
            if rain_probability_pct >= 60.0 or (total_rainfall_mm and total_rainfall_mm >= 10.0):
                weather_score = 5.0
                weather_expl = f"Rain forecast ({rain_probability_pct}% prob): Natural precipitation reduces irrigation demand."
            elif rain_probability_pct <= 20.0:
                weather_score = 25.0
                weather_expl = f"Dry spell forecast ({rain_probability_pct}% rain prob): High irrigation priority to mitigate soil moisture deficit."
            else:
                weather_score = 15.0
                weather_expl = f"Moderate rain probability ({rain_probability_pct}%): Standard scheduled irrigation window."
        elif is_drone:
            if wind_speed_kmh is not None and wind_speed_kmh > 20.0:
                weather_score = 3.0
                weather_expl = f"High wind speed ({wind_speed_kmh} km/h): Prohibited drone operational threshold (>20 km/h)."
            elif rain_probability_pct > 30.0:
                weather_score = 4.0
                weather_expl = f"Precipitation risk ({rain_probability_pct}%): Drone electronic & chemical safety risk."
            else:
                weather_score = 25.0
                weather_expl = "Optimal calm conditions for aerial UAV application."
        elif is_sprayer:
            if wind_speed_kmh is not None and wind_speed_kmh > 15.0:
                weather_score = 5.0
                weather_expl = f"Wind speed ({wind_speed_kmh} km/h) creates spray drift hazard and poor droplet deposition."
            elif rain_probability_pct > 40.0:
                weather_score = 8.0
                weather_expl = f"Rain risk ({rain_probability_pct}%): Chemical wash-off before systemic absorption."
            else:
                weather_score = 25.0
                weather_expl = f"Calm weather ({rain_probability_pct}% rain prob): Optimal spray application window."
        elif is_harvester:
            if severe_weather_alert or (rain_probability_pct > 65.0):
                weather_score = 25.0
                weather_expl = f"Imminent storm/rain threat ({rain_probability_pct}%): Emergency pre-weather harvest window to prevent crop lodging."
            elif rain_probability_pct < 25.0:
                weather_score = 20.0
                weather_expl = f"Favorable dry harvesting weather ({rain_probability_pct}% rain prob)."
            else:
                weather_score = 12.0
                weather_expl = f"Moderate rain probability ({rain_probability_pct}%): Monitor field moisture before cutting."
        else:
            # General / Tractor
            if severe_weather_alert:
                weather_score = 25.0
                weather_expl = f"Severe storm alert with {rain_probability_pct}% rain probability; critical pre-weather operation window."
            else:
                # Linear scale between 2 pts (dry) and 25 pts (critical pre-rain window)
                weather_score = min(25.0, 2.0 + (rain_probability_pct / 100.0) * 23.0)
                weather_expl = f"Precipitation probability at {rain_probability_pct}%; operational window accounts for micro-climate risk."
    else:
        # Transparent rule: never fabricate missing weather; assign neutral baseline midpoint
        weather_score = 12.5
        weather_expl = "Live weather forecast data currently unavailable. Assigned neutral default baseline (12.5/25 pts) without fabricating values."
        missing_info.append("Live precipitation probability / meteorological radar feed")

    breakdown["weather_risk"] = FactorScore(weather_score, 25.0, weather_expl, "Meteorological provider / Neutral fallback")

    # -------------------------------------------------------------
    # Factor 3: Crop Readiness & Perishability (Max 20 pts)
    # -------------------------------------------------------------
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
            crop_expl = f"Crop in vegetative growth stage ({crop_stage}); standard agronomic urgency."
    else:
        crop_score = 8.0
        crop_expl = "No specific crop stage declared. Assigned median vegetative baseline (8.0/20 pts)."
        missing_info.append("Crop stage declaration")
    breakdown["crop_readiness"] = FactorScore(crop_score, 20.0, crop_expl, "Farm crop records")

    # -------------------------------------------------------------
    # Factor 4: Waiting Time / Queue Age (Max 10 pts)
    # -------------------------------------------------------------
    if waiting_time_hours is not None:
        data_sources.append("Booking request submission queue timestamp")
        if waiting_time_hours >= 48.0:
            wait_score = 10.0
            wait_expl = f"Request pending for {waiting_time_hours:.1f}h: elevated queue priority to avoid farmer starvation."
        elif waiting_time_hours >= 24.0:
            wait_score = 8.0
            wait_expl = f"Request pending for {waiting_time_hours:.1f}h: standard queue progression."
        elif waiting_time_hours >= 12.0:
            wait_score = 6.0
            wait_expl = f"Request pending for {waiting_time_hours:.1f}h."
        else:
            wait_score = 4.0
            wait_expl = f"Recent booking submission ({waiting_time_hours:.1f}h ago)."
    elif farm_size_acres is not None and farm_size_acres > 0:
        # Fallback to parcel acreage impact if queue age not yet applicable
        data_sources.append("Farm parcel registry")
        wait_score = min(10.0, 2.0 + (farm_size_acres / 5.0) * 8.0)
        wait_expl = f"Field scale allocation for {farm_size_acres} acres agricultural plot."
    else:
        wait_score = 5.0
        wait_expl = "Standard baseline queue progression assigned (5.0/10 pts)."
        missing_info.append("Queue waiting time duration")
    breakdown["waiting_time"] = FactorScore(wait_score, 10.0, wait_expl, "Queue dispatcher")
    breakdown["farm_impact"] = breakdown["waiting_time"]  # Backward compatibility alias

    # -------------------------------------------------------------
    # Factor 5: Deadline Proximity (Max 10 pts)
    # -------------------------------------------------------------
    if deadline_hours is not None:
        data_sources.append("Operation requested schedule timeline")
        if deadline_hours <= 12.0:
            dl_score = 10.0
            dl_expl = f"Immediate deadline: only {deadline_hours:.1f} hours remaining before target operational window closes."
        elif deadline_hours <= 24.0:
            dl_score = 8.0
            dl_expl = f"Tight deadline: {deadline_hours:.1f} hours until preferred operation time."
        elif deadline_hours <= 48.0:
            dl_score = 5.0
            dl_expl = f"Moderate deadline: {deadline_hours:.1f} hours remaining."
        else:
            dl_score = 2.0
            dl_expl = f"Extended planning horizon ({deadline_hours:.1f} hours available)."
    else:
        dl_score = 5.0
        dl_expl = "No explicit operational deadline supplied. Standard 48-hour default applied (5.0/10 pts)."
        missing_info.append("Operation deadline proximity hours")
    breakdown["deadline_proximity"] = FactorScore(dl_score, 10.0, dl_expl, "Schedule constraints")

    # -------------------------------------------------------------
    # Factor 6: Operational Feasibility & Validated Constraints (Max 10 pts)
    # -------------------------------------------------------------
    if operational_feasibility is not None:
        feas_score = max(0.0, min(10.0, operational_feasibility))
        feas_expl = f"Operational feasibility assessed at {feas_score}/10 based on machine specifications and travel radius."
    elif soil_moisture_suitable is not None:
        if soil_moisture_suitable:
            feas_score = 10.0
            feas_expl = "Optimal soil moisture condition for mechanical traction and tillage."
        else:
            feas_score = 3.0
            feas_expl = "Soil conditions suboptimal (excess waterlogging or compaction risk)."
    else:
        feas_score = 8.0
        feas_expl = "Standard mechanical traction, access road passability, and operator feasibility baseline (8.0/10 pts)."
    breakdown["operational_feasibility"] = FactorScore(feas_score, 10.0, feas_expl, "Agronomic operational constraints")
    breakdown["agronomic_window"] = breakdown["operational_feasibility"]  # Backward compatibility alias

    # -------------------------------------------------------------
    # Total Score Calculation (Sum of 6 primary factors bounded [0, 100])
    # -------------------------------------------------------------
    primary_factors = [
        breakdown["urgency"],
        breakdown["weather_risk"],
        breakdown["crop_readiness"],
        breakdown["waiting_time"],
        breakdown["deadline_proximity"],
        breakdown["operational_feasibility"],
    ]
    total_raw = sum(f.score for f in primary_factors)
    total_score = max(0.0, min(100.0, total_raw))

    # Construct plain-language agronomic explanation
    explanation_parts = [
        f"Overall Priority Assessment: {round(total_score, 1)} / 100.",
        f"Urgency contributed {breakdown['urgency'].score}/{breakdown['urgency'].max_weight} pts ({breakdown['urgency'].explanation}).",
        f"Weather Risk contributed {breakdown['weather_risk'].score}/{breakdown['weather_risk'].max_weight} pts ({breakdown['weather_risk'].explanation}).",
        f"Crop Stage contributed {breakdown['crop_readiness'].score}/{breakdown['crop_readiness'].max_weight} pts ({breakdown['crop_readiness'].explanation}).",
        f"Feasibility & Constraints contributed {breakdown['operational_feasibility'].score}/{breakdown['operational_feasibility'].max_weight} pts.",
    ]
    if missing_info:
        explanation_parts.append(
            f"Notice: Missing parameters ({', '.join(missing_info)}) evaluated using transparent agronomic baselines without fabricated values."
        )

    plain_language_explanation = " ".join(explanation_parts)

    return PriorityScoreResult(
        overall_score=total_score,
        breakdown=breakdown,
        plain_language_explanation=plain_language_explanation,
        data_sources_used=data_sources,
        missing_information=missing_info,
        limitations=limitations,
    )
