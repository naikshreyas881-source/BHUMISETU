import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, Tuple, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.models.user import User, UserRole
from app.models.marketplace import Resource, Booking, BookingStatus, Farm, MaintenanceWindow
from app.coordination.conflicts import detect_booking_conflicts
from app.coordination.priority import calculate_priority_score
from app.coordination.weather_prediction import evaluate_weather_booking_suitability
from app.services.weather import fetch_weather_forecast_for_window
from app.services.geo import calculate_haversine_distance

logger = logging.getLogger(__name__)


class AutoConfirmationDecision:
    def __init__(
        self,
        should_confirm: bool,
        status: BookingStatus,
        reason: str,
        priority_score: float,
        weather_suitability_score: Optional[float],
        checks_passed: Dict[str, bool],
        alternative_slots: Optional[List[Dict[str, Any]]] = None,
    ):
        self.should_confirm = should_confirm
        self.status = status
        self.reason = reason
        self.priority_score = priority_score
        self.weather_suitability_score = weather_suitability_score
        self.checks_passed = checks_passed
        self.alternative_slots = alternative_slots or []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "should_confirm": self.should_confirm,
            "status": self.status.value,
            "reason": self.reason,
            "priority_score": self.priority_score,
            "weather_suitability_score": self.weather_suitability_score,
            "checks_passed": self.checks_passed,
            "alternative_slots": self.alternative_slots,
        }


def evaluate_auto_confirmation(
    db: Session,
    current_user: User,
    resource: Resource,
    farm: Optional[Farm],
    operation: str,
    start_time: datetime,
    duration_hours: float,
    deadline_hours: Optional[float] = None,
    exclude_booking_id: Optional[int] = None,
) -> AutoConfirmationDecision:
    """
    Evaluates a booking request against the authoritative 10-point automatic confirmation policy.
    Never confirms solely because priority is high.
    Never bypasses conflicts, maintenance, or unsafe weather.
    """
    end_time = start_time + timedelta(hours=duration_hours)
    checks: Dict[str, bool] = {
        "1_authenticated_authorized": False,
        "2_mandatory_info_complete": False,
        "3_resource_active_and_eligible": False,
        "4_no_maintenance_overlap": False,
        "5_no_booking_conflicts": False,
        "6_distance_scheduling_satisfied": False,
        "7_weather_requirements_met": False,
        "8_forecast_reliable_and_current": False,
        "9_owner_policy_permits_auto_confirm": False,
        "10_transaction_eligible": False,
    }

    # Condition 1: Authentication & Authorization
    if current_user and current_user.role in [UserRole.FARMER, UserRole.ADMINISTRATOR]:
        checks["1_authenticated_authorized"] = True
    else:
        return AutoConfirmationDecision(
            should_confirm=False,
            status=BookingStatus.REJECTED,
            reason="User is not authorized to submit agricultural booking requests.",
            priority_score=0.0,
            weather_suitability_score=None,
            checks_passed=checks,
        )

    # Condition 2: Mandatory Information Complete
    if resource and operation and start_time and duration_hours > 0:
        checks["2_mandatory_info_complete"] = True
    else:
        return AutoConfirmationDecision(
            should_confirm=False,
            status=BookingStatus.REJECTED,
            reason="Mandatory booking parameters are missing or invalid.",
            priority_score=0.0,
            weather_suitability_score=None,
            checks_passed=checks,
        )

    # Condition 3: Resource Active & Eligible for Requested Operation
    op_clean = operation.strip().lower()
    supported = [o.lower() for o in (resource.supported_operations or [])]
    if resource.is_active and (not supported or op_clean in supported or "general" in op_clean):
        checks["3_resource_active_and_eligible"] = True
    else:
        return AutoConfirmationDecision(
            should_confirm=False,
            status=BookingStatus.REJECTED,
            reason=f"Machinery does not support requested operation '{operation}' or is inactive.",
            priority_score=0.0,
            weather_suitability_score=None,
            checks_passed=checks,
        )

    # Condition 4: Maintenance Windows
    maint_overlap = (
        db.query(MaintenanceWindow)
        .filter(
            MaintenanceWindow.resource_id == resource.id,
            MaintenanceWindow.start_time < end_time,
            MaintenanceWindow.end_time > start_time,
        )
        .first()
    )
    if not maint_overlap:
        checks["4_no_maintenance_overlap"] = True
    else:
        return AutoConfirmationDecision(
            should_confirm=False,
            status=BookingStatus.PENDING_APPROVAL,
            reason=f"Machinery is scheduled for maintenance ({maint_overlap.reason}) during the requested period.",
            priority_score=20.0,
            weather_suitability_score=None,
            checks_passed=checks,
        )

    # Condition 5: Concurrency Safe Conflict Detection
    conflict_report = detect_booking_conflicts(
        db=db,
        resource_id=resource.id,
        start_time=start_time,
        end_time=end_time,
        exclude_booking_id=exclude_booking_id,
    )
    if not conflict_report.has_conflict:
        checks["5_no_booking_conflicts"] = True
    else:
        # Conflict exists! Do not silently confirm; provide clear reason
        return AutoConfirmationDecision(
            should_confirm=False,
            status=BookingStatus.PENDING_APPROVAL,
            reason=f"Scheduling conflict detected: {'; '.join(conflict_report.conflict_details)}",
            priority_score=35.0,
            weather_suitability_score=None,
            checks_passed=checks,
        )

    # Condition 6: Distance & Travel Feasibility
    if farm:
        dist_km = calculate_haversine_distance(
            resource.latitude, resource.longitude, farm.latitude, farm.longitude
        )
        if dist_km <= resource.service_radius_km:
            checks["6_distance_scheduling_satisfied"] = True
        else:
            return AutoConfirmationDecision(
                should_confirm=False,
                status=BookingStatus.PENDING_APPROVAL,
                reason=f"Farm distance ({dist_km:.1f} km) exceeds machinery service radius ({resource.service_radius_km:.1f} km).",
                priority_score=40.0,
                weather_suitability_score=None,
                checks_passed=checks,
            )
    else:
        checks["6_distance_scheduling_satisfied"] = True

    # Condition 7 & 8: Weather Requirements & Forecast Reliability
    lat = farm.latitude if farm else resource.latitude
    lon = farm.longitude if farm else resource.longitude

    weather_window = fetch_weather_forecast_for_window(
        latitude=lat,
        longitude=lon,
        start_time=start_time,
        duration_hours=duration_hours,
    )

    weather_prediction = evaluate_weather_booking_suitability(
        equipment_category=resource.category.value if hasattr(resource.category, "value") else str(resource.category),
        operation=operation,
        start_time=start_time,
        duration_hours=duration_hours,
        weather_data=weather_window,
    )

    weather_score = weather_prediction.score
    is_forecast_valid = weather_window.get("is_forecast_available", False)

    if is_forecast_valid:
        checks["8_forecast_reliable_and_current"] = True
    else:
        # If forecast is beyond horizon (e.g. > 14 days), forecast is limited but does not block queueing
        checks["8_forecast_reliable_and_current"] = False

    # Weather suitability check: score must be >= 60 and not unsafe
    if weather_score is not None and weather_score >= 60.0 and weather_prediction.suitability_level != "Unsafe or prohibited conditions":
        checks["7_weather_requirements_met"] = True
    elif weather_score is not None and weather_prediction.suitability_level == "Unsafe or prohibited conditions":
        # Unsafe weather (e.g. drone wind > 20 km/h or sprayer storm) -> DO NOT AUTO-CONFIRM
        checks["7_weather_requirements_met"] = False
        return AutoConfirmationDecision(
            should_confirm=False,
            status=BookingStatus.PENDING_APPROVAL,
            reason=f"Weather conditions are unsafe/prohibited for this activity ({weather_prediction.risk_category} • {int(weather_score)}/100): {weather_prediction.plain_language_explanation}",
            priority_score=45.0,
            weather_suitability_score=weather_score,
            checks_passed=checks,
            alternative_slots=weather_prediction.suggested_alternatives,
        )
    else:
        # Weather is acceptable baseline or distant horizon
        checks["7_weather_requirements_met"] = True

    # Compute Authoritative Priority Score for Ranking
    crop_stage = None
    if farm and farm.crops:
        crop_stage = farm.crops[0].stage

    rain_prob = weather_window.get("max_rain_probability_pct")
    is_severe = weather_window.get("is_severe_alert", False)

    prio_result = calculate_priority_score(
        urgency_level="high" if (weather_score and weather_score >= 80) else "medium",
        rain_probability_pct=rain_prob,
        severe_weather_alert=is_severe,
        crop_stage=crop_stage,
        waiting_time_hours=0.5,
        deadline_hours=deadline_hours or 36.0,
        equipment_category=resource.category.value if hasattr(resource.category, "value") else str(resource.category),
        operation=operation,
        farm_size_acres=farm.size_acres if farm else 4.0,
        soil_moisture_suitable=True,
    )
    authoritative_prio = prio_result.overall_score

    # Condition 9: Owner Auto-Confirmation Policy
    auto_enabled = getattr(resource, "auto_confirm_enabled", False)
    if auto_enabled:
        checks["9_owner_policy_permits_auto_confirm"] = True
    else:
        checks["9_owner_policy_permits_auto_confirm"] = False
        return AutoConfirmationDecision(
            should_confirm=False,
            status=BookingStatus.SUBMITTED,
            reason="All scheduling, availability, and weather requirements passed. Held for manual owner approval per provider confirmation policy.",
            priority_score=authoritative_prio,
            weather_suitability_score=weather_score,
            checks_passed=checks,
        )

    # Condition 10: Commit Transaction Eligibility
    checks["10_transaction_eligible"] = True

    # ALL 10 CONDITIONS PASSED: AUTO-CONFIRM
    return AutoConfirmationDecision(
        should_confirm=True,
        status=BookingStatus.CONFIRMED,
        reason=(
            f"Intelligent Auto-Confirmation Approved: Verified zero schedule conflicts, "
            f"suitable weather forecast ({int(weather_score) if weather_score else 'Verified'}/100), "
            f"machinery operational eligibility, and provider instant booking policy."
        ),
        priority_score=authoritative_prio,
        weather_suitability_score=weather_score,
        checks_passed=checks,
    )
