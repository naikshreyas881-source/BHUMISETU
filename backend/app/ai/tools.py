"""
FarmVoice AI — Tool Function Declarations and Backend Execution Handlers.
Strict backend enforcement: LLM or voice calls cannot bypass database validation or business rules.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.marketplace import Resource, Booking, BookingStatus, MaintenanceWindow
from app.models.audit import AuditLog
from app.coordination.suitability import evaluate_resource_suitability
from app.coordination.priority import calculate_priority_score
from app.coordination.conflicts import detect_booking_conflicts
from app.services.geo import calculate_haversine_distance

# In-memory session draft store with expiration
# (Binds explicit spoken confirmation to exact summary before database insert)
BOOKING_DRAFTS: Dict[str, Dict[str, Any]] = {}

GEMINI_TOOL_DECLARATIONS = [
    {
        "name": "search_agricultural_resources",
        "description": "Searches for agricultural machinery, labour, or implements in Karnataka by category or operation.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "operation": {
                    "type": "STRING",
                    "description": "Farming operation needed, e.g. ploughing, harvesting, tilling, spraying"
                },
                "category": {
                    "type": "STRING",
                    "description": "Machinery category: tractor, harvester, drone, sprayer, implement"
                },
                "max_hourly_budget": {
                    "type": "NUMBER",
                    "description": "Maximum price in INR per hour"
                }
            }
        }
    },
    {
        "name": "check_equipment_availability",
        "description": "Checks if a specific machinery or resource is free of booking conflicts and maintenance downtime.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "resource_id": {
                    "type": "INTEGER",
                    "description": "Unique identifier of the resource"
                },
                "start_time": {
                    "type": "STRING",
                    "description": "ISO 8601 formatted start time, e.g. 2026-10-15T08:00:00Z"
                },
                "duration_hours": {
                    "type": "NUMBER",
                    "description": "Duration in hours (e.g. 4.0)"
                }
            },
            "required": ["resource_id", "start_time", "duration_hours"]
        }
    },
    {
        "name": "create_booking_draft",
        "description": "Creates an explicit booking draft for user confirmation. Does NOT finalize database booking.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "resource_id": {
                    "type": "INTEGER",
                    "description": "Unique identifier of the resource"
                },
                "operation": {
                    "type": "STRING",
                    "description": "Required agricultural operation"
                },
                "start_time": {
                    "type": "STRING",
                    "description": "ISO 8601 start time"
                },
                "duration_hours": {
                    "type": "NUMBER",
                    "description": "Duration in hours"
                }
            },
            "required": ["resource_id", "operation", "start_time", "duration_hours"]
        }
    },
    {
        "name": "confirm_booking",
        "description": "Confirms an existing booking draft after explicit user confirmation.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "draft_id": {
                    "type": "STRING",
                    "description": "Draft ID generated during create_booking_draft"
                },
                "confirmation_phrase": {
                    "type": "STRING",
                    "description": "The farmer's spoken or clicked confirmation phrase (e.g. 'confirm', 'yes', 'hudu')"
                }
            },
            "required": ["draft_id", "confirmation_phrase"]
        }
    }
]

def execute_search_resources(
    db: Session,
    operation: Optional[str] = None,
    category: Optional[str] = None,
    max_hourly_budget: Optional[float] = None
) -> List[Dict[str, Any]]:
    query = db.query(Resource).filter(Resource.is_active.is_(True))
    if category:
        query = query.filter(func.lower(Resource.category) == category.lower())
    
    results = query.all()
    filtered = []
    for r in results:
        if operation and operation.lower() not in [op.lower() for op in r.supported_operations]:
            continue
        if max_hourly_budget and r.price_per_unit > max_hourly_budget:
            continue
        filtered.append({
            "id": r.id,
            "name": r.name,
            "category": r.category.value if hasattr(r.category, "value") else str(r.category),
            "price_per_unit": r.price_per_unit,
            "pricing_unit": r.pricing_unit.value if hasattr(r.pricing_unit, "value") else str(r.pricing_unit),
            "location_name": r.location_name,
            "service_radius_km": r.service_radius_km,
            "supported_operations": r.supported_operations,
            "rating": r.rating,
            "is_demo": r.is_demo
        })
    return filtered[:6]

def execute_check_availability(
    db: Session,
    resource_id: int,
    start_time_iso: str,
    duration_hours: float
) -> Dict[str, Any]:
    try:
        start_time = datetime.fromisoformat(start_time_iso.replace("Z", "+00:00"))
    except Exception:
        start_time = datetime.now(timezone.utc) + timedelta(days=1)
    
    end_time = start_time + timedelta(hours=duration_hours)
    
    report = detect_booking_conflicts(
        db=db,
        resource_id=resource_id,
        start_time=start_time,
        end_time=end_time
    )
    
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    res_name = resource.name if resource else f"Resource #{resource_id}"
    
    return {
        "resource_id": resource_id,
        "resource_name": res_name,
        "has_conflict": report.has_conflict,
        "conflict_type": report.conflict_type,
        "conflict_details": report.conflict_details,
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat(),
        "is_available": not report.has_conflict
    }

def execute_create_booking_draft(
    db: Session,
    user_id: int,
    resource_id: int,
    operation: str,
    start_time_iso: str,
    duration_hours: float
) -> Dict[str, Any]:
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        return {"error": f"Resource ID {resource_id} not found."}
    
    try:
        start_time = datetime.fromisoformat(start_time_iso.replace("Z", "+00:00"))
    except Exception:
        start_time = datetime.now(timezone.utc) + timedelta(days=2)
    end_time = start_time + timedelta(hours=duration_hours)
    
    # Check conflict before drafting
    conflict = detect_booking_conflicts(db=db, resource_id=resource_id, start_time=start_time, end_time=end_time)
    if conflict.has_conflict:
        return {
            "error": "Scheduling conflict detected. Cannot create booking draft.",
            "conflict_details": conflict.conflict_details
        }
    
    total_cost = round(float(resource.price_per_unit * duration_hours), 2)
    draft_id = f"draft_{uuid.uuid4().hex[:8]}"
    idempotency_key = f"voice_book_{uuid.uuid4().hex}"
    
    summary = {
        "draft_id": draft_id,
        "user_id": user_id,
        "resource_id": resource.id,
        "resource_name": resource.name,
        "operation": operation,
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat(),
        "duration_hours": duration_hours,
        "total_cost": total_cost,
        "idempotency_key": idempotency_key,
        "location_name": resource.location_name,
        "requires_explicit_confirmation": True
    }
    
    BOOKING_DRAFTS[draft_id] = summary
    return summary

def execute_confirm_booking(
    db: Session,
    user_id: int,
    draft_id: str,
    confirmation_phrase: str
) -> Dict[str, Any]:
    draft = BOOKING_DRAFTS.get(draft_id)
    if not draft:
        return {"error": f"Booking draft '{draft_id}' expired or not found. Please request a new draft."}
    
    if draft["user_id"] != user_id:
        return {"error": "Unauthorized: draft belongs to another user session."}
    
    conf_clean = confirmation_phrase.lower().strip()
    valid_confirmations = [
        "confirm", "yes", "confirm booking", "hudu", "agide", "sari", "ok", "proceed",
        "ಹೌದು", "ಖಚಿತಪಡಿಸಿ", "ದೃಢೀಕರಿಸಿ", "ಖಚಿತ", "ಸರಿ"
    ]
    if not any(v in conf_clean for v in valid_confirmations):
        return {
            "error": f"Confirmation rejected. Spoken phrase '{confirmation_phrase}' did not confirm the booking.",
            "status": "awaiting_confirmation",
            "draft_summary": draft
        }
    
    # Check idempotency
    existing = db.query(Booking).filter(Booking.idempotency_key == draft["idempotency_key"]).first()
    if existing:
        return {
            "booking_id": existing.id,
            "status": existing.status.value,
            "message": "Booking was already confirmed (idempotent)."
        }
    
    # Create database booking
    start_dt = datetime.fromisoformat(draft["start_time"])
    end_dt = datetime.fromisoformat(draft["end_time"])
    
    booking = Booking(
        farmer_id=user_id,
        resource_id=draft["resource_id"],
        operation=draft["operation"],
        start_time=start_dt,
        end_time=end_dt,
        duration_hours=draft["duration_hours"],
        estimated_cost=draft["total_cost"],
        status=BookingStatus.SUBMITTED,
        idempotency_key=draft["idempotency_key"],
        notes=f"Booked via FarmVoice AI Voice Assistant (Draft {draft_id})"
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    
    # Audit log
    import json
    from app.core.audit import log_audit_event
    log_audit_event(
        db=db,
        user_id=user_id,
        action="VOICE_BOOKING_CREATED",
        resource_type="booking",
        resource_id=str(draft["resource_id"]),
        details=json.dumps({
            "draft_id": draft_id,
            "cost": draft["total_cost"],
            "operation": draft["operation"]
        })
    )
    
    # Clean up draft
    BOOKING_DRAFTS.pop(draft_id, None)
    
    return {
        "booking_id": booking.id,
        "resource_name": draft["resource_name"],
        "operation": draft["operation"],
        "total_cost": draft["total_cost"],
        "start_time": draft["start_time"],
        "status": "submitted",
        "message": "Booking request successfully confirmed and submitted to equipment owner."
    }
