from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from app.models.marketplace import Resource, Farm, Booking, MaintenanceWindow, BookingStatus, PricingUnit
from app.services.geo import calculate_haversine_distance


class SuitabilityEvaluation:
    def __init__(
        self,
        is_feasible: bool,
        rejection_reasons: List[str],
        feasibility_reasons: List[str],
        estimated_cost: float,
        distance_km: Optional[float] = None,
        travel_time_hours: float = 0.0,
    ):
        self.is_feasible = is_feasible
        self.rejection_reasons = rejection_reasons
        self.feasibility_reasons = feasibility_reasons
        self.estimated_cost = estimated_cost
        self.distance_km = distance_km
        self.travel_time_hours = travel_time_hours

    def to_dict(self) -> Dict[str, Any]:
        return {
            "is_feasible": self.is_feasible,
            "rejection_reasons": self.rejection_reasons,
            "feasibility_reasons": self.feasibility_reasons,
            "estimated_cost": self.estimated_cost,
            "distance_km": self.distance_km,
            "travel_time_hours": self.travel_time_hours,
        }


def evaluate_resource_suitability(
    resource: Resource,
    operation: str,
    start_time: datetime,
    duration_hours: float,
    farm: Optional[Farm] = None,
    max_budget: Optional[float] = None,
    existing_bookings: Optional[List[Booking]] = None,
    maintenance_windows: Optional[List[MaintenanceWindow]] = None,
) -> SuitabilityEvaluation:
    """
    Evaluates hard constraints strictly before ranking.
    A resource that fails ANY hard constraint is marked is_feasible = False.
    """
    rejection_reasons: List[str] = []
    feasibility_reasons: List[str] = []

    # 1. Active Status Hard Constraint
    if not resource.is_active:
        rejection_reasons.append("Resource is currently inactive or decommissioned.")

    # 2. Equipment Capabilities Hard Constraint
    supported_ops = [op.lower().strip() for op in (resource.supported_operations or [])]
    op_clean = operation.lower().strip()
    if op_clean not in supported_ops:
        rejection_reasons.append(
            f"Equipment cannot perform requested operation '{operation}'. Supported operations: {', '.join(resource.supported_operations)}."
        )
    else:
        feasibility_reasons.append(f"Supports required agricultural operation: '{operation}'.")

    # 3. Geographic Distance & Service Radius Hard Constraint
    distance_km = None
    travel_time_hours = 0.0
    if farm:
        distance_km = calculate_haversine_distance(
            farm.latitude, farm.longitude, resource.latitude, resource.longitude
        )
        # Approximate tractor/machinery road transit speed = 25 km/h
        travel_time_hours = round(distance_km / 25.0, 2)

        if distance_km > resource.service_radius_km:
            rejection_reasons.append(
                f"Farm is {distance_km} km away, which exceeds the resource maximum service radius of {resource.service_radius_km} km."
            )
        else:
            feasibility_reasons.append(
                f"Farm is {distance_km} km away, within the {resource.service_radius_km} km operational service radius (est. travel: {travel_time_hours}h)."
            )

    # 4. Rental Cost & Budget Hard Constraint
    end_time = start_time + timedelta(hours=duration_hours)
    if resource.pricing_unit == PricingUnit.PER_DAY:
        days = max(1.0, duration_hours / 24.0)
        estimated_cost = round(days * resource.price_per_unit, 2)
    elif resource.pricing_unit == PricingUnit.PER_ACRE and farm:
        estimated_cost = round(farm.size_acres * resource.price_per_unit, 2)
    else:
        estimated_cost = round(duration_hours * resource.price_per_unit, 2)

    if max_budget is not None and estimated_cost > max_budget:
        rejection_reasons.append(
            f"Estimated cost (Rs.{estimated_cost}) exceeds your stated budget limit of Rs.{max_budget}."
        )
    else:
        feasibility_reasons.append(f"Estimated rental cost is Rs.{estimated_cost} ({resource.pricing_unit.value}).")

    # 5. Maintenance Downtime Hard Constraint
    if maintenance_windows:
        for mw in maintenance_windows:
            # Overlap check: [start_time, end_time) overlaps [mw.start_time, mw.end_time)
            # Ensure timezone-aware comparisons
            mw_start = mw.start_time if mw.start_time.tzinfo else mw.start_time.replace(tzinfo=timezone.utc)
            mw_end = mw.end_time if mw.end_time.tzinfo else mw.end_time.replace(tzinfo=timezone.utc)
            req_start = start_time if start_time.tzinfo else start_time.replace(tzinfo=timezone.utc)
            req_end = end_time if end_time.tzinfo else end_time.replace(tzinfo=timezone.utc)

            if req_start < mw_end and req_end > mw_start:
                rejection_reasons.append(
                    f"Resource is scheduled for maintenance during this window: '{mw.reason}' ({mw.start_time.strftime('%Y-%m-%d %H:%M')} to {mw.end_time.strftime('%H:%M')})."
                )

    # 6. Active Bookings Hard Constraint (Double-booking prevention)
    if existing_bookings:
        for b in existing_bookings:
            if b.status in [BookingStatus.SUBMITTED, BookingStatus.CONFIRMED, BookingStatus.PENDING_APPROVAL]:
                b_start = b.start_time if b.start_time.tzinfo else b.start_time.replace(tzinfo=timezone.utc)
                b_end = b.end_time if b.end_time.tzinfo else b.end_time.replace(tzinfo=timezone.utc)
                req_start = start_time if start_time.tzinfo else start_time.replace(tzinfo=timezone.utc)
                req_end = end_time if end_time.tzinfo else end_time.replace(tzinfo=timezone.utc)

                if req_start < b_end and req_end > b_start:
                    rejection_reasons.append(
                        f"Resource is already reserved by another farmer from {b.start_time.strftime('%Y-%m-%d %H:%M')} to {b.end_time.strftime('%H:%M')}."
                    )

    is_feasible = len(rejection_reasons) == 0
    if is_feasible:
        feasibility_reasons.append(
            f"Resource is fully available for the requested slot: {start_time.strftime('%Y-%m-%d %H:%M')} to {end_time.strftime('%H:%M')}."
        )

    return SuitabilityEvaluation(
        is_feasible=is_feasible,
        rejection_reasons=rejection_reasons,
        feasibility_reasons=feasibility_reasons,
        estimated_cost=estimated_cost,
        distance_km=distance_km,
        travel_time_hours=travel_time_hours,
    )
