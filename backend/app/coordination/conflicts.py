from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.marketplace import Booking, MaintenanceWindow, BookingStatus


class ConflictReport:
    def __init__(
        self,
        has_conflict: bool,
        conflict_type: Optional[str] = None,  # "BOOKING_OVERLAP", "MAINTENANCE_DOWNTIME", "MULTIPLE_CONFLICTS"
        conflict_details: List[str] = None,
        conflicting_booking_ids: List[int] = None,
        conflicting_maintenance_ids: List[int] = None,
    ):
        self.has_conflict = has_conflict
        self.conflict_type = conflict_type
        self.conflict_details = conflict_details or []
        self.conflicting_booking_ids = conflicting_booking_ids or []
        self.conflicting_maintenance_ids = conflicting_maintenance_ids or []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "has_conflict": self.has_conflict,
            "conflict_type": self.conflict_type,
            "conflict_details": self.conflict_details,
            "conflicting_booking_ids": self.conflicting_booking_ids,
            "conflicting_maintenance_ids": self.conflicting_maintenance_ids,
        }


def detect_booking_conflicts(
    db: Session,
    resource_id: int,
    start_time: datetime,
    end_time: datetime,
    exclude_booking_id: Optional[int] = None,
) -> ConflictReport:
    """
    Checks for interval overlaps [start_time, end_time) against:
    1. Active bookings (SUBMITTED, CONFIRMED, PENDING_APPROVAL)
    2. Scheduled maintenance windows
    """
    conflict_details: List[str] = []
    conflicting_bookings: List[int] = []
    conflicting_maintenances: List[int] = []

    # Ensure UTC awareness for query comparisons
    req_start = start_time if start_time.tzinfo else start_time.replace(tzinfo=timezone.utc)
    req_end = end_time if end_time.tzinfo else end_time.replace(tzinfo=timezone.utc)

    # 1. Query overlapping bookings: [start, end) overlaps if b.start < req_end AND b.end > req_start
    booking_query = db.query(Booking).filter(
        Booking.resource_id == resource_id,
        Booking.status.in_([BookingStatus.SUBMITTED, BookingStatus.CONFIRMED, BookingStatus.PENDING_APPROVAL]),
        Booking.start_time < req_end,
        Booking.end_time > req_start,
    )
    if exclude_booking_id:
        booking_query = booking_query.filter(Booking.id != exclude_booking_id)

    overlapping_bookings = booking_query.all()
    for b in overlapping_bookings:
        conflicting_bookings.append(b.id)
        b_s = b.start_time.strftime("%Y-%m-%d %H:%M")
        b_e = b.end_time.strftime("%H:%M")
        conflict_details.append(
            f"Overlaps with existing booking #{b.id} ({b.operation}) scheduled from {b_s} to {b_e} [Status: {b.status.value}]."
        )

    # 2. Query overlapping maintenance downtime
    overlapping_maint = db.query(MaintenanceWindow).filter(
        MaintenanceWindow.resource_id == resource_id,
        MaintenanceWindow.start_time < req_end,
        MaintenanceWindow.end_time > req_start,
    ).all()

    for m in overlapping_maint:
        conflicting_maintenances.append(m.id)
        m_s = m.start_time.strftime("%Y-%m-%d %H:%M")
        m_e = m.end_time.strftime("%H:%M")
        conflict_details.append(
            f"Overlaps with scheduled maintenance window #{m.id}: '{m.reason}' from {m_s} to {m_e}."
        )

    has_conflict = len(conflict_details) > 0
    conflict_type = None
    if has_conflict:
        if conflicting_bookings and conflicting_maintenances:
            conflict_type = "MULTIPLE_CONFLICTS"
        elif conflicting_bookings:
            conflict_type = "BOOKING_OVERLAP"
        else:
            conflict_type = "MAINTENANCE_DOWNTIME"

    return ConflictReport(
        has_conflict=has_conflict,
        conflict_type=conflict_type,
        conflict_details=conflict_details,
        conflicting_booking_ids=conflicting_bookings,
        conflicting_maintenance_ids=conflicting_maintenances,
    )
