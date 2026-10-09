from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.models.marketplace import ResourceCategory, PricingUnit, BookingStatus


# Crop Schemas
class CropBase(BaseModel):
    crop_name: str = Field(..., min_length=2, max_length=100)
    stage: str = Field(..., min_length=2, max_length=100)
    planted_date: Optional[date] = None
    expected_harvest_date: Optional[date] = None


class CropCreate(CropBase):
    pass


class CropResponse(CropBase):
    id: int
    farm_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Farm Schemas
class FarmBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    location_name: str = Field(..., min_length=2, max_length=255)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    size_acres: float = Field(..., gt=0.0)
    soil_type: Optional[str] = Field(None, max_length=100)
    irrigation_type: Optional[str] = Field(None, max_length=100)


class FarmCreate(FarmBase):
    pass


class FarmResponse(FarmBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime
    crops: List[CropResponse] = []

    model_config = ConfigDict(from_attributes=True)


# Maintenance Window Schemas
class MaintenanceWindowBase(BaseModel):
    start_time: datetime
    end_time: datetime
    reason: str = Field(..., min_length=2, max_length=255)


class MaintenanceWindowCreate(MaintenanceWindowBase):
    pass


class MaintenanceWindowResponse(MaintenanceWindowBase):
    id: int
    resource_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Resource Schemas
class ResourceBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    category: ResourceCategory
    description: str = Field(..., min_length=5)
    specifications: Optional[Dict[str, Any]] = None
    supported_operations: List[str] = Field(default_factory=list)
    price_per_unit: float = Field(..., gt=0.0)
    pricing_unit: PricingUnit = PricingUnit.PER_HOUR
    location_name: str = Field(..., min_length=2, max_length=255)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    service_radius_km: float = Field(default=25.0, gt=0.0)
    is_verified: bool = True
    is_active: bool = True
    is_demo: bool = False
    image_url: Optional[str] = None


class ResourceCreate(ResourceBase):
    pass


class ResourceResponse(ResourceBase):
    id: int
    owner_id: int
    rating: float
    total_reviews: int
    created_at: datetime
    updated_at: datetime
    distance_km: Optional[float] = None  # Populated when queried with user coordinates
    maintenance_windows: List[MaintenanceWindowResponse] = []

    model_config = ConfigDict(from_attributes=True)


# Booking Schemas
class BookingCreate(BaseModel):
    resource_id: int
    farm_id: Optional[int] = None
    operation: str = Field(..., min_length=2, max_length=100)
    start_time: datetime
    duration_hours: float = Field(..., gt=0.0, le=72.0)
    idempotency_key: str = Field(..., min_length=10, max_length=100)
    notes: Optional[str] = None


class BookingStatusUpdate(BaseModel):
    status: BookingStatus
    rejection_reason: Optional[str] = None


class BookingResponse(BaseModel):
    id: int
    farmer_id: int
    resource_id: int
    farm_id: Optional[int] = None
    operation: str
    start_time: datetime
    end_time: datetime
    duration_hours: float
    estimated_cost: float
    status: BookingStatus
    idempotency_key: str
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # Attached relationships if joined
    resource_name: Optional[str] = None
    farmer_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
