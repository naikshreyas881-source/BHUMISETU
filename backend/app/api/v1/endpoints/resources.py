from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.audit import log_audit_event
from app.api.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.marketplace import Resource, ResourceCategory, MaintenanceWindow
from app.schemas.marketplace import (
    ResourceCreate,
    ResourceResponse,
    MaintenanceWindowCreate,
    MaintenanceWindowResponse,
)
from app.services.geo import calculate_haversine_distance

router = APIRouter()


@router.get("/", response_model=List[ResourceResponse])
def search_resources(
    category: Optional[ResourceCategory] = None,
    operation: Optional[str] = None,
    max_price: Optional[float] = Query(None, gt=0),
    search: Optional[str] = None,
    lat: Optional[float] = Query(None, ge=-90.0, le=90.0),
    lon: Optional[float] = Query(None, ge=-180.0, le=180.0),
    max_distance_km: Optional[float] = Query(None, gt=0),
    is_verified: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    """
    Search and filter agricultural equipment and services with spatial distance evaluation.
    """
    query = db.query(Resource).filter(Resource.is_active == True)

    if category:
        query = query.filter(Resource.category == category)

    if max_price:
        query = query.filter(Resource.price_per_unit <= max_price)

    if is_verified is not None:
        query = query.filter(Resource.is_verified == is_verified)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Resource.name.ilike(search_pattern),
                Resource.description.ilike(search_pattern),
                Resource.location_name.ilike(search_pattern),
            )
        )

    resources = query.all()

    # In-memory filtering for operations (JSON list) and spatial distance
    results = []
    for r in resources:
        # Check operation if specified
        if operation:
            supported = [op.lower() for op in (r.supported_operations or [])]
            if operation.lower() not in supported:
                continue

        # Check distance if coordinates are supplied
        dist = None
        if lat is not None and lon is not None:
            dist = calculate_haversine_distance(lat, lon, r.latitude, r.longitude)
            # Must be within resource's service radius
            if dist > r.service_radius_km:
                continue
            # Must also satisfy max_distance_km filter if provided
            if max_distance_km is not None and dist > max_distance_km:
                continue

        res_model = ResourceResponse.model_validate(r)
        res_model.distance_km = dist
        results.append(res_model)

    # Sort: nearest first if coordinates provided, else by rating descending
    if lat is not None and lon is not None:
        results.sort(key=lambda x: (x.distance_km or 9999, -x.rating))
    else:
        results.sort(key=lambda x: -x.rating)

    return results


@router.get("/{resource_id}", response_model=ResourceResponse)
def get_resource_details(resource_id: int, db: Session = Depends(get_db)):
    """Retrieve full details of a specific agricultural resource listing."""
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource


@router.post("/", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
def create_resource(
    resource_in: ResourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles([UserRole.RESOURCE_OWNER, UserRole.SERVICE_PROVIDER, UserRole.ADMINISTRATOR])
    ),
):
    """Publish a new agricultural machinery or service listing."""
    resource = Resource(
        owner_id=current_user.id,
        name=resource_in.name,
        category=resource_in.category,
        description=resource_in.description,
        specifications=resource_in.specifications,
        supported_operations=resource_in.supported_operations,
        price_per_unit=resource_in.price_per_unit,
        pricing_unit=resource_in.pricing_unit,
        location_name=resource_in.location_name,
        latitude=resource_in.latitude,
        longitude=resource_in.longitude,
        service_radius_km=resource_in.service_radius_km,
        is_verified=resource_in.is_verified,
        is_active=resource_in.is_active,
        is_demo=resource_in.is_demo,
        image_url=resource_in.image_url,
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)

    log_audit_event(
        db=db,
        action="RESOURCE_CREATE",
        user_id=current_user.id,
        resource_type="RESOURCE",
        resource_id=str(resource.id),
        details=f"Created {resource.category.value}: {resource.name}",
    )

    return resource


@router.post("/{resource_id}/maintenance", response_model=MaintenanceWindowResponse, status_code=status.HTTP_201_CREATED)
def schedule_maintenance(
    resource_id: int,
    maint_in: MaintenanceWindowCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles([UserRole.RESOURCE_OWNER, UserRole.SERVICE_PROVIDER, UserRole.ADMINISTRATOR])
    ),
):
    """Register a scheduled maintenance downtime period for equipment."""
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    if resource.owner_id != current_user.id and current_user.role != UserRole.ADMINISTRATOR:
        raise HTTPException(status_code=403, detail="Unauthorized to manage maintenance for this resource")

    if maint_in.end_time <= maint_in.start_time:
        raise HTTPException(status_code=400, detail="Maintenance end time must be after start time")

    maint = MaintenanceWindow(
        resource_id=resource.id,
        start_time=maint_in.start_time,
        end_time=maint_in.end_time,
        reason=maint_in.reason,
    )
    db.add(maint)
    db.commit()
    db.refresh(maint)

    log_audit_event(
        db=db,
        action="MAINTENANCE_SCHEDULED",
        user_id=current_user.id,
        resource_type="RESOURCE",
        resource_id=str(resource.id),
        details=f"Scheduled maintenance: {maint.reason}",
    )

    return maint
