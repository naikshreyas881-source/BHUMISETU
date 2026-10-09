from datetime import datetime, timedelta, timezone, date
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.marketplace import Resource
from app.coordination.conflicts import detect_booking_conflicts


class FeasibleSlot:
    def __init__(self, start_time: datetime, end_time: datetime, label: str):
        self.start_time = start_time
        self.end_time = end_time
        self.label = label

    def to_dict(self) -> Dict[str, Any]:
        return {
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat(),
            "label": self.label,
            "display": f"{self.start_time.strftime('%a, %b %d')} • {self.start_time.strftime('%I:%M %p')} - {self.end_time.strftime('%I:%M %p')}",
        }


def find_feasible_slots(
    db: Session,
    resource: Resource,
    target_date: date,
    duration_hours: float,
    search_days: int = 3,
) -> List[FeasibleSlot]:
    """
    Scans typical farming operational windows (Morning 6am, Midday 11am, Afternoon 3pm)
    to discover non-conflicting time windows on the requested resource.
    """
    candidate_slots: List[FeasibleSlot] = []

    # Standard daily agricultural shifts:
    # Shift 1: Morning (06:30)
    # Shift 2: Mid-day (11:30)
    # Shift 3: Late Afternoon (15:30)
    shift_hours = [
        (6, 30, "Morning Shift"),
        (11, 30, "Mid-day Shift"),
        (15, 30, "Late Afternoon Shift"),
    ]

    for day_offset in range(search_days):
        current_day = target_date + timedelta(days=day_offset)

        for hour, minute, shift_name in shift_hours:
            candidate_start = datetime(
                current_day.year,
                current_day.month,
                current_day.day,
                hour,
                minute,
                tzinfo=timezone.utc,
            )
            candidate_end = candidate_start + timedelta(hours=duration_hours)

            # Check if this candidate slot is free of conflicts
            conflict_report = detect_booking_conflicts(
                db=db,
                resource_id=resource.id,
                start_time=candidate_start,
                end_time=candidate_end,
            )

            if not conflict_report.has_conflict:
                slot_label = f"{shift_name} on {current_day.strftime('%A, %b %d')}"
                candidate_slots.append(
                    FeasibleSlot(
                        start_time=candidate_start,
                        end_time=candidate_end,
                        label=slot_label,
                    )
                )

            # Return up to 5 best alternatives
            if len(candidate_slots) >= 5:
                return candidate_slots

    return candidate_slots
