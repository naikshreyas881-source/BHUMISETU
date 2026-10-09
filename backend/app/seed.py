import json
from datetime import datetime, timezone, date
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.marketplace import (
    Farm,
    Crop,
    Resource,
    ResourceCategory,
    PricingUnit,
    MaintenanceWindow,
    Booking,
    BookingStatus,
)


def seed_data():
    db = SessionLocal()
    try:
        print("[+] Seeding BHUMISETU demonstration data...")

        # 1. Create or retrieve demo users
        owner_manjunath = db.query(User).filter(User.email == "owner_manjunath@bhumisetu.org").first()
        if not owner_manjunath:
            owner_manjunath = User(
                email="owner_manjunath@bhumisetu.org",
                full_name="Manjunath Patil",
                phone_number="+919845012345",
                hashed_password=get_password_hash("OwnerSecure123"),
                role=UserRole.RESOURCE_OWNER,
                preferred_language="kn",
                is_active=True,
                is_verified=True,
            )
            db.add(owner_manjunath)

        provider_gowda = db.query(User).filter(User.email == "provider_gowda@bhumisetu.org").first()
        if not provider_gowda:
            provider_gowda = User(
                email="provider_gowda@bhumisetu.org",
                full_name="Hassan Krishi Seva",
                phone_number="+919845067890",
                hashed_password=get_password_hash("ProviderSecure123"),
                role=UserRole.SERVICE_PROVIDER,
                preferred_language="en",
                is_active=True,
                is_verified=True,
            )
            db.add(provider_gowda)

        farmer_ramesh = db.query(User).filter(User.email == "farmer1@bhumisetu.org").first()
        if not farmer_ramesh:
            farmer_ramesh = User(
                email="farmer1@bhumisetu.org",
                full_name="Ramesh Gowda",
                phone_number="+919876543210",
                hashed_password=get_password_hash("SecurePassword123"),
                role=UserRole.FARMER,
                preferred_language="kn",
                is_active=True,
                is_verified=True,
            )
            db.add(farmer_ramesh)

        admin_user = db.query(User).filter(User.email == "admin@bhumisetu.org").first()
        if not admin_user:
            admin_user = User(
                email="admin@bhumisetu.org",
                full_name="BhumiSetu System Admin",
                phone_number="+919999900000",
                hashed_password=get_password_hash("SecurePassword123"),
                role=UserRole.ADMINISTRATOR,
                preferred_language="en",
                is_active=True,
                is_verified=True,
            )
            db.add(admin_user)

        db.commit()
        db.refresh(owner_manjunath)
        db.refresh(provider_gowda)
        db.refresh(farmer_ramesh)

        # 2. Create Farmer Ramesh's Farm & Crops
        farm = db.query(Farm).filter(Farm.name == "Ramesh Gowda Mandya Farm").first()
        if not farm:
            farm = Farm(
                owner_id=farmer_ramesh.id,
                name="Ramesh Gowda Mandya Farm",
                location_name="Koppa, Mandya, Karnataka",
                latitude=12.5234,
                longitude=76.8967,
                size_acres=5.2,
                soil_type="Red Clay Loam",
                irrigation_type="Canal & Borewell",
            )
            db.add(farm)
            db.commit()
            db.refresh(farm)

            crop1 = Crop(
                farm_id=farm.id,
                crop_name="Paddy (Sona Masoori)",
                stage="Vegetative",
                planted_date=date(2026, 8, 15),
                expected_harvest_date=date(2026, 11, 20),
            )
            crop2 = Crop(
                farm_id=farm.id,
                crop_name="Sugarcane (Co 86032)",
                stage="Tillering",
                planted_date=date(2026, 6, 1),
                expected_harvest_date=date(2027, 4, 15),
            )
            db.add_all([crop1, crop2])
            db.commit()

        # 3. Create Demonstration Resources (Tagged with is_demo=True)
        demo_resources = [
            {
                "name": "Mahindra 575 DI Tractor (47 HP)",
                "category": ResourceCategory.TRACTOR,
                "description": "Reliable 47 HP agricultural tractor equipped with heavy-duty rotavator, reversible mouldboard plough, and trolley hitch.",
                "specifications": {"horsepower": 47, "fuel": "Diesel", "pto_rpm": 540, "lifting_capacity_kg": 1600},
                "supported_operations": ["ploughing", "tilling", "harrowing", "hauling", "leveling"],
                "price_per_unit": 650.0,
                "pricing_unit": PricingUnit.PER_HOUR,
                "location_name": "Mandya Town, Karnataka",
                "latitude": 12.5218,
                "longitude": 76.8951,
                "service_radius_km": 30.0,
                "owner_id": owner_manjunath.id,
                "rating": 4.9,
                "total_reviews": 38,
            },
            {
                "name": "Kubota DC-68G Paddy Combine Harvester",
                "category": ResourceCategory.HARVESTER,
                "description": "High-efficiency rubber-crawler combine harvester suited for wet paddy fields. Grain loss less than 1.5%.",
                "specifications": {"engine_power": 68, "cutter_width_m": 2.0, "grain_tank_liters": 1250},
                "supported_operations": ["harvesting", "threshing", "cleaning"],
                "price_per_unit": 2400.0,
                "pricing_unit": PricingUnit.PER_HOUR,
                "location_name": "Maddur, Mandya, Karnataka",
                "latitude": 12.5842,
                "longitude": 77.0425,
                "service_radius_km": 40.0,
                "owner_id": owner_manjunath.id,
                "rating": 4.8,
                "total_reviews": 24,
            },
            {
                "name": "DJI Agras T40 Agricultural Spraying Drone",
                "category": ResourceCategory.DRONE,
                "description": "Precision agricultural drone carrying 40kg payload. Spreads micronutrients, liquid bio-fertilizers, and crop protection sprays with centrifugal atomizers.",
                "specifications": {"payload_kg": 40, "spray_width_m": 11, "flow_rate_l_min": 12},
                "supported_operations": ["spraying", "fertilizer_distribution", "aerial_monitoring"],
                "price_per_unit": 450.0,
                "pricing_unit": PricingUnit.PER_ACRE,
                "location_name": "Hassan Rural, Karnataka",
                "latitude": 13.0033,
                "longitude": 76.1004,
                "service_radius_km": 50.0,
                "owner_id": provider_gowda.id,
                "rating": 4.95,
                "total_reviews": 42,
            },
            {
                "name": "Skilled Rice Transplanting & Weeding Crew (8 Workers)",
                "category": ResourceCategory.LABOUR,
                "description": "Experienced agricultural farm team specializing in SRI paddy transplanting, manual weed removal, and sugarcane earthing-up.",
                "specifications": {"team_size": 8, "experience_years": 12, "supervision_included": True},
                "supported_operations": ["transplanting", "weeding", "harvesting", "bunding"],
                "price_per_unit": 3600.0,
                "pricing_unit": PricingUnit.PER_DAY,
                "location_name": "Pandavapura, Mandya, Karnataka",
                "latitude": 12.4932,
                "longitude": 76.6713,
                "service_radius_km": 25.0,
                "owner_id": provider_gowda.id,
                "rating": 4.75,
                "total_reviews": 19,
            },
            {
                "name": "John Deere 5050D Tractor with 9-Tyne Cultivator",
                "category": ResourceCategory.TRACTOR,
                "description": "50 HP tractor suitable for deep soil tilling, seed bed preparation, and secondary cultivation.",
                "specifications": {"horsepower": 50, "fuel": "Diesel", "clutch": "Dual Clutch"},
                "supported_operations": ["ploughing", "cultivating", "sowing", "rotavating"],
                "price_per_unit": 700.0,
                "pricing_unit": PricingUnit.PER_HOUR,
                "location_name": "Mysuru South, Karnataka",
                "latitude": 12.2958,
                "longitude": 76.6394,
                "service_radius_km": 35.0,
                "owner_id": owner_manjunath.id,
                "rating": 4.88,
                "total_reviews": 51,
            },
            {
                "name": "Kirloskar 7.5 HP Portable Diesel Irrigation Pump",
                "category": ResourceCategory.IRRIGATION_PUMP,
                "description": "High-head portable diesel irrigation pump with suction hose and delivery pipes (up to 300 meters).",
                "specifications": {"power_hp": 7.5, "flow_rate_lps": 18, "head_m": 24},
                "supported_operations": ["irrigation", "water_pumping", "dewatering"],
                "price_per_unit": 180.0,
                "pricing_unit": PricingUnit.PER_HOUR,
                "location_name": "Srirangapatna, Mandya, Karnataka",
                "latitude": 12.4181,
                "longitude": 76.6947,
                "service_radius_km": 20.0,
                "owner_id": owner_manjunath.id,
                "rating": 4.7,
                "total_reviews": 15,
            },
        ]

        for res_data in demo_resources:
            existing = db.query(Resource).filter(Resource.name == res_data["name"]).first()
            if not existing:
                res = Resource(
                    name=res_data["name"],
                    category=res_data["category"],
                    description=res_data["description"],
                    specifications=res_data["specifications"],
                    supported_operations=res_data["supported_operations"],
                    price_per_unit=res_data["price_per_unit"],
                    pricing_unit=res_data["pricing_unit"],
                    location_name=res_data["location_name"],
                    latitude=res_data["latitude"],
                    longitude=res_data["longitude"],
                    service_radius_km=res_data["service_radius_km"],
                    is_verified=True,
                    is_active=True,
                    is_demo=True,  # Explicit demo flag
                    rating=res_data["rating"],
                    total_reviews=res_data["total_reviews"],
                    owner_id=res_data["owner_id"],
                )
                db.add(res)

        db.commit()
        print("[SUCCESS] Demonstration seed data populated successfully!")

    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
