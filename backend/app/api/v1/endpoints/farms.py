from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.marketplace import Farm, Crop
from app.schemas.marketplace import FarmCreate, FarmResponse, CropCreate, CropResponse

router = APIRouter()


@router.post("/", response_model=FarmResponse, status_code=status.HTTP_201_CREATED)
def create_farm(
    farm_in: FarmCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Register a new farm profile under the authenticated user."""
    farm = Farm(
        owner_id=current_user.id,
        name=farm_in.name,
        location_name=farm_in.location_name,
        latitude=farm_in.latitude,
        longitude=farm_in.longitude,
        size_acres=farm_in.size_acres,
        soil_type=farm_in.soil_type,
        irrigation_type=farm_in.irrigation_type,
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm


@router.get("/", response_model=List[FarmResponse])
def get_user_farms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all farms registered by the authenticated user."""
    farms = db.query(Farm).filter(Farm.owner_id == current_user.id).all()
    return farms


@router.get("/{farm_id}", response_model=FarmResponse)
def get_farm_details(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve details for a specific farm."""
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    if farm.owner_id != current_user.id and current_user.role != "administrator":
        raise HTTPException(status_code=403, detail="Unauthorized access to this farm profile")
    return farm


@router.post("/{farm_id}/crops", response_model=CropResponse, status_code=status.HTTP_201_CREATED)
def add_crop_to_farm(
    farm_id: int,
    crop_in: CropCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a crop record to an owned farm."""
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    if farm.owner_id != current_user.id and current_user.role != "administrator":
        raise HTTPException(status_code=403, detail="Unauthorized to add crops to this farm")

    crop = Crop(
        farm_id=farm.id,
        crop_name=crop_in.crop_name,
        stage=crop_in.stage,
        planted_date=crop_in.planted_date,
        expected_harvest_date=crop_in.expected_harvest_date,
    )
    db.add(crop)
    db.commit()
    db.refresh(crop)
    return crop
