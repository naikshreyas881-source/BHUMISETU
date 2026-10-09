from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.marketplace import Resource, Farm
from app.coordination.suitability import evaluate_resource_suitability
from app.coordination.scheduler import find_feasible_slots, FeasibleSlot


class RecommendationResult:
    def __init__(
        self,
        preferred_feasible: bool,
        preferred_reasons: List[str],
        alternative_resources: List[Dict[str, Any]],
        alternative_time_slots: List[Dict[str, Any]],
        explainable_recommendation: str,
    ):
        self.preferred_feasible = preferred_feasible
        self.preferred_reasons = preferred_reasons
        self.alternative_resources = alternative_resources
        self.alternative_time_slots = alternative_time_slots
        self.explainable_recommendation = explainable_recommendation

    def to_dict(self) -> Dict[str, Any]:
        return {
            "preferred_feasible": self.preferred_feasible,
            "preferred_reasons": self.preferred_reasons,
            "alternative_resources": self.alternative_resources,
            "alternative_time_slots": self.alternative_time_slots,
            "explainable_recommendation": self.explainable_recommendation,
        }


def recommend_alternatives(
    db: Session,
    resource: Resource,
    operation: str,
    start_time: datetime,
    duration_hours: float,
    farm: Optional[Farm] = None,
    max_budget: Optional[float] = None,
) -> RecommendationResult:
    """
    Evaluates requested resource and discovers feasible alternatives:
    - If preferred resource has conflict/hard constraint: recommends equivalent standby resources nearby
    - Recommends alternative open time slots on the requested resource
    """
    # 1. Evaluate preferred resource suitability
    pref_eval = evaluate_resource_suitability(
        resource=resource,
        operation=operation,
        start_time=start_time,
        duration_hours=duration_hours,
        farm=farm,
        max_budget=max_budget,
        existing_bookings=resource.bookings,
        maintenance_windows=resource.maintenance_windows,
    )

    alt_resources: List[Dict[str, Any]] = []
    alt_slots: List[Dict[str, Any]] = []

    # If preferred resource is not feasible, look for alternatives
    if not pref_eval.is_feasible:
        # Search for other active resources in same category
        query = db.query(Resource).filter(
            Resource.id != resource.id,
            Resource.category == resource.category,
            Resource.is_active == True,
        )
        candidates = query.all()

        for cand in candidates:
            cand_eval = evaluate_resource_suitability(
                resource=cand,
                operation=operation,
                start_time=start_time,
                duration_hours=duration_hours,
                farm=farm,
                max_budget=max_budget,
                existing_bookings=cand.bookings,
                maintenance_windows=cand.maintenance_windows,
            )
            if cand_eval.is_feasible:
                alt_resources.append({
                    "id": cand.id,
                    "name": cand.name,
                    "category": cand.category.value,
                    "price_per_unit": cand.price_per_unit,
                    "pricing_unit": cand.pricing_unit.value,
                    "distance_km": cand_eval.distance_km,
                    "estimated_cost": cand_eval.estimated_cost,
                    "rating": cand.rating,
                    "reasons": cand_eval.feasibility_reasons,
                })

        # Also find alternative open slots on the requested resource
        target_date = start_time.date()
        open_slots = find_feasible_slots(
            db=db,
            resource=resource,
            target_date=target_date,
            duration_hours=duration_hours,
        )
        alt_slots = [s.to_dict() for s in open_slots]

    # Synthesize explainable recommendation text
    if pref_eval.is_feasible:
        farm_text = f", is {pref_eval.distance_km} km from your farm" if pref_eval.distance_km is not None else ""
        recommendation_text = (
            f"This {resource.category.replace('_', ' ')} '{resource.name}' supports {operation}{farm_text}, "
            f"is available from {start_time.strftime('%I:%M %p')} to {(start_time + (open_slots[0].end_time - open_slots[0].start_time if False else duration_hours * 1)).strftime('%I:%M %p') if False else ''} on {start_time.strftime('%b %d')}, "
            f"and fits your estimated rental budget of Rs.{pref_eval.estimated_cost}."
        )
        # Cleaner text
        recommendation_text = (
            f"'{resource.name}' is highly recommended: It supports {operation}{farm_text}, "
            f"is fully available for the requested {duration_hours}h window, and matches your stated budget (Rs.{pref_eval.estimated_cost})."
        )
    else:
        rejection_summary = "; ".join(pref_eval.rejection_reasons)
        if alt_resources:
            top_alt = alt_resources[0]
            recommendation_text = (
                f"Preferred resource '{resource.name}' is unavailable ({rejection_summary}). "
                f"Alternative standby resource '{top_alt['name']}' is available immediately for {operation} "
                f"at Rs.{top_alt['price_per_unit']}/{top_alt['pricing_unit']}."
            )
        elif alt_slots:
            top_slot = alt_slots[0]
            recommendation_text = (
                f"Preferred resource '{resource.name}' has a scheduling conflict ({rejection_summary}). "
                f"Recommended alternative time slot: {top_slot['display']}."
            )
        else:
            recommendation_text = (
                f"Preferred resource '{resource.name}' is unavailable ({rejection_summary}), "
                f"and no immediate alternative units were found within the service radius."
            )

    return RecommendationResult(
        preferred_feasible=pref_eval.is_feasible,
        preferred_reasons=pref_eval.feasibility_reasons if pref_eval.is_feasible else pref_eval.rejection_reasons,
        alternative_resources=alt_resources,
        alternative_time_slots=alt_slots,
        explainable_recommendation=recommendation_text,
    )
