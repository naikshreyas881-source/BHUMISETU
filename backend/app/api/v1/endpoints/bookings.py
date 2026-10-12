from datetime import timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.audit import log_audit_event
from app.api.deps import get_current_user
from app.models.user import User, UserRole
from app.models.marketplace import Resource, Booking, BookingStatus, Farm, PricingUnit
from app.schemas.marketplace import BookingCreate, BookingResponse, BookingStatusUpdate
from app.coordination.auto_confirm import evaluate_auto_confirmation

router = APIRouter()


def serialize_booking(b: Booking) -> BookingResponse:
    res = BookingResponse.model_validate(b)
    if b.resource:
        res.resource_name = b.resource.name
    if b.farmer:
        res.farmer_name = b.farmer.full_name
    return res


@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking_request(
    booking_in: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit an agricultural equipment or service request with strict idempotency and 10-point auto-confirmation evaluation."""
    # 1. Check idempotency key to prevent duplicate booking submissions
    existing_key = db.query(Booking).filter(Booking.idempotency_key == booking_in.idempotency_key).first()
    if existing_key:
        return serialize_booking(existing_key)

    # 2. Check resource existence and active status
    resource = db.query(Resource).filter(Resource.id == booking_in.resource_id).first()
    if not resource or not resource.is_active:
        raise HTTPException(status_code=404, detail="Selected resource is unavailable or does not exist")

    # 3. Check farm ownership if farm_id specified
    farm = None
    if booking_in.farm_id:
        farm = db.query(Farm).filter(Farm.id == booking_in.farm_id).first()
        if not farm or (farm.owner_id != current_user.id and current_user.role != UserRole.ADMINISTRATOR):
            raise HTTPException(status_code=400, detail="Invalid farm selected")

    # 4. Calculate end time and estimated rental cost
    end_time = booking_in.start_time + timedelta(hours=booking_in.duration_hours)

    if resource.pricing_unit == PricingUnit.PER_DAY:
        days = max(1.0, booking_in.duration_hours / 24.0)
        estimated_cost = round(days * resource.price_per_unit, 2)
    elif resource.pricing_unit == PricingUnit.PER_ACRE and booking_in.farm_id:
        farm_rec = db.query(Farm).filter(Farm.id == booking_in.farm_id).first()
        acres = farm_rec.size_acres if farm_rec else 1.0
        estimated_cost = round(acres * resource.price_per_unit, 2)
    else:  # default per hour
        estimated_cost = round(booking_in.duration_hours * resource.price_per_unit, 2)

    # 5. Concurrency check: Reject if there is an existing CONFIRMED booking overlapping this slot
    confirmed_conflict = (
        db.query(Booking)
        .filter(
            Booking.resource_id == resource.id,
            Booking.status == BookingStatus.CONFIRMED,
            Booking.start_time < end_time,
            Booking.end_time > booking_in.start_time,
        )
        .first()
    )
    if confirmed_conflict:
        alt_time = confirmed_conflict.end_time + timedelta(hours=1)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Scheduling conflict: Machinery '{resource.name}' is already confirmed for booking #{confirmed_conflict.id} until {confirmed_conflict.end_time.strftime('%Y-%m-%d %H:%M')}. Suggested alternative start: {alt_time.strftime('%Y-%m-%d %H:%M')}.",
        )

    # 6. Evaluate 10-point Authoritative Intelligent Auto-Confirmation
    decision = evaluate_auto_confirmation(
        db=db,
        current_user=current_user,
        resource=resource,
        farm=farm,
        operation=booking_in.operation,
        start_time=booking_in.start_time,
        duration_hours=booking_in.duration_hours,
    )

    final_status = BookingStatus.CONFIRMED if decision.should_confirm else BookingStatus.SUBMITTED

    booking = Booking(
        farmer_id=current_user.id,
        resource_id=resource.id,
        farm_id=booking_in.farm_id,
        operation=booking_in.operation,
        start_time=booking_in.start_time,
        end_time=end_time,
        duration_hours=booking_in.duration_hours,
        estimated_cost=estimated_cost,
        status=final_status,
        idempotency_key=booking_in.idempotency_key,
        auto_confirmed=decision.should_confirm,
        confirmation_reason=decision.reason,
        priority_score=decision.priority_score,
        weather_suitability_score=decision.weather_suitability_score,
        notes=booking_in.notes,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    log_audit_event(
        db=db,
        action="BOOKING_SUBMIT",
        user_id=current_user.id,
        resource_type="BOOKING",
        resource_id=str(booking.id),
        details=(
            f"Farmer {current_user.full_name} booked {resource.name} for {booking.duration_hours}h. "
            f"Status: {final_status.value} (Auto-confirmed: {decision.should_confirm}). Cost: Rs.{estimated_cost}"
        ),
    )

    return serialize_booking(booking)


@router.get("/", response_model=List[BookingResponse])
def list_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve bookings relevant to the authenticated user's role."""
    if current_user.role == UserRole.ADMINISTRATOR:
        bookings = db.query(Booking).order_by(desc(Booking.created_at)).all()
    elif current_user.role in [UserRole.RESOURCE_OWNER, UserRole.SERVICE_PROVIDER]:
        # View incoming bookings for own equipment OR own bookings as farmer
        bookings = (
            db.query(Booking)
            .join(Resource, Booking.resource_id == Resource.id)
            .filter((Resource.owner_id == current_user.id) | (Booking.farmer_id == current_user.id))
            .order_by(desc(Booking.created_at))
            .all()
        )
    else:
        # Farmer views their own bookings
        bookings = (
            db.query(Booking)
            .filter(Booking.farmer_id == current_user.id)
            .order_by(desc(Booking.created_at))
            .all()
        )

    return [serialize_booking(b) for b in bookings]


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve specific booking record with authorization verification."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking record not found")

    is_farmer = booking.farmer_id == current_user.id
    is_owner = booking.resource and booking.resource.owner_id == current_user.id
    is_admin = current_user.role == UserRole.ADMINISTRATOR

    if not (is_farmer or is_owner or is_admin):
        raise HTTPException(status_code=403, detail="Unauthorized to view this booking")

    return serialize_booking(booking)


@router.patch("/{booking_id}/status", response_model=BookingResponse)
def update_booking_status(
    booking_id: int,
    status_update: BookingStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Execute backend-enforced status transition:
    - Resource Owner/Admin: approve (CONFIRMED) or reject (REJECTED)
    - Farmer/Admin: cancel (CANCELLED)
    - Owner/Farmer/Admin: complete (COMPLETED)
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking record not found")

    is_farmer = booking.farmer_id == current_user.id
    is_owner = booking.resource and booking.resource.owner_id == current_user.id
    is_admin = current_user.role == UserRole.ADMINISTRATOR

    target_status = status_update.status
    current_status = booking.status

    # Rule 1: Approval / Rejection can only be performed by Owner or Admin
    if target_status in [BookingStatus.CONFIRMED, BookingStatus.REJECTED]:
        if not (is_owner or is_admin):
            raise HTTPException(status_code=403, detail="Only the resource owner or administrator can approve/reject requests")
        if current_status not in [BookingStatus.SUBMITTED, BookingStatus.PENDING_APPROVAL]:
            raise HTTPException(status_code=400, detail=f"Cannot transition booking from {current_status.value} to {target_status.value}")

    # Rule 2: Cancellation can be performed by Farmer or Admin
    elif target_status == BookingStatus.CANCELLED:
        if not (is_farmer or is_admin):
            raise HTTPException(status_code=403, detail="Only the booking requester or administrator can cancel this booking")
        if current_status in [BookingStatus.COMPLETED, BookingStatus.CANCELLED]:
            raise HTTPException(status_code=400, detail="Cannot cancel a booking that is already completed or cancelled")

    # Rule 3: Completion can be performed once confirmed
    elif target_status == BookingStatus.COMPLETED:
        if not (is_farmer or is_owner or is_admin):
            raise HTTPException(status_code=403, detail="Unauthorized to mark this booking as completed")
        if current_status != BookingStatus.CONFIRMED:
            raise HTTPException(status_code=400, detail="Only confirmed bookings can be marked as completed")

    # Update status
    booking.status = target_status
    if status_update.rejection_reason:
        booking.rejection_reason = status_update.rejection_reason

    db.commit()
    db.refresh(booking)

    log_audit_event(
        db=db,
        action="BOOKING_STATUS_CHANGE",
        user_id=current_user.id,
        resource_type="BOOKING",
        resource_id=str(booking.id),
        details=f"Status transitioned from {current_status.value} to {target_status.value} by {current_user.full_name}",
    )

    return serialize_booking(booking)
