import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    Date,
    Text,
    Enum,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class ResourceCategory(str, enum.Enum):
    TRACTOR = "tractor"
    HARVESTER = "harvester"
    CULTIVATOR = "cultivator"
    SEED_DRILL = "seed_drill"
    SPRAYER = "sprayer"
    DRONE = "drone"
    IRRIGATION_PUMP = "irrigation_pump"
    TRANSPORT = "transport"
    LABOUR = "labour"
    HARVESTING_SERVICE = "harvesting_service"
    SPRAYING_SERVICE = "spraying_service"
    OTHER = "other"


class PricingUnit(str, enum.Enum):
    PER_HOUR = "per_hour"
    PER_ACRE = "per_acre"
    PER_DAY = "per_day"


class BookingStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    PENDING_APPROVAL = "pending_approval"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class Farm(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    location_name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    size_acres = Column(Float, nullable=False)
    soil_type = Column(String(100), nullable=True)
    irrigation_type = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    owner = relationship("User")
    crops = relationship("Crop", back_populates="farm", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="farm")


class Crop(Base):
    __tablename__ = "crops"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    crop_name = Column(String(100), nullable=False)
    stage = Column(String(100), nullable=False)  # Sowing, Vegetative, Flowering, Harvesting
    planted_date = Column(Date, nullable=True)
    expected_harvest_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    farm = relationship("Farm", back_populates="crops")


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    category = Column(Enum(ResourceCategory), nullable=False, index=True)
    description = Column(Text, nullable=False)
    specifications = Column(JSON, nullable=True)  # { "horsepower": 50, "fuel_type": "diesel", ... }
    supported_operations = Column(JSON, nullable=False, default=list)  # ["ploughing", "tilling"]
    price_per_unit = Column(Float, nullable=False)
    pricing_unit = Column(Enum(PricingUnit), nullable=False, default=PricingUnit.PER_HOUR)
    location_name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    service_radius_km = Column(Float, nullable=False, default=25.0)
    is_verified = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_demo = Column(Boolean, default=False, nullable=False)  # Label demo seed data
    rating = Column(Float, default=4.8, nullable=False)
    total_reviews = Column(Integer, default=0, nullable=False)
    image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    owner = relationship("User")
    maintenance_windows = relationship("MaintenanceWindow", back_populates="resource", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="resource")


class MaintenanceWindow(Base):
    __tablename__ = "maintenance_windows"

    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(Integer, ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    start_time = Column(DateTime(timezone=True), nullable=False, index=True)
    end_time = Column(DateTime(timezone=True), nullable=False, index=True)
    reason = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    resource = relationship("Resource", back_populates="maintenance_windows")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_id = Column(Integer, ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="SET NULL"), nullable=True, index=True)
    operation = Column(String(100), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False, index=True)
    end_time = Column(DateTime(timezone=True), nullable=False, index=True)
    duration_hours = Column(Float, nullable=False)
    estimated_cost = Column(Float, nullable=False)
    status = Column(Enum(BookingStatus), default=BookingStatus.SUBMITTED, nullable=False, index=True)
    idempotency_key = Column(String(100), unique=True, index=True, nullable=False)
    notes = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    farmer = relationship("User", foreign_keys=[farmer_id])
    resource = relationship("Resource", back_populates="bookings")
    farm = relationship("Farm", back_populates="bookings")
