import uuid
from datetime import datetime, timezone, timedelta
from app.models.marketplace import Resource, ResourceCategory, PricingUnit, Booking, BookingStatus, Farm
from app.coordination.priority import calculate_priority_score
from app.coordination.weather_prediction import evaluate_weather_booking_suitability
from app.coordination.auto_confirm import evaluate_auto_confirmation


def test_six_factor_priority_score_exact_weights():
    """Verify that priority calculation evaluates all 6 factors matching exact configurable weights (25, 25, 20, 10, 10, 10)."""
    # 1. High urgency, high rain risk, harvesting stage, 24h deadline
    res = calculate_priority_score(
        urgency_level="critical",  # 25 pts
        rain_probability_pct=85.0,  # 25 pts
        crop_stage="harvesting",  # 20 pts
        waiting_time_hours=48.0,  # 10 pts
        deadline_hours=12.0,  # 10 pts
        equipment_category="harvester",
        operation="paddy harvest",
        farm_size_acres=5.0,
        soil_moisture_suitable=True,  # 10 pts
    )
    assert res.overall_score == 100.0
    assert res.breakdown["urgency"].score == 25.0
    assert res.breakdown["weather_risk"].score == 25.0
    assert res.breakdown["crop_readiness"].score == 20.0
    assert res.breakdown["waiting_time"].score == 10.0
    assert res.breakdown["deadline_proximity"].score == 10.0
    assert res.breakdown["operational_feasibility"].score == 10.0
    # Backward compatibility aliases
    assert res.breakdown["farm_impact"].score == 10.0
    assert res.breakdown["agronomic_window"].score == 10.0

    # 2. Low urgency, dry weather, vegetative stage
    res_low = calculate_priority_score(
        urgency_level="low",  # 4 pts
        rain_probability_pct=5.0,  # 5 pts
        crop_stage="vegetative",  # 8 pts
        waiting_time_hours=1.0,  # 2 pts
        deadline_hours=72.0,  # 4 pts
        soil_moisture_suitable=False,  # 3 pts
    )
    assert res_low.overall_score == 22.15


def test_drone_flight_safety_and_prohibited_cutoffs():
    """Verify drone aerial spraying enforces strictly 20 km/h wind and 0 mm rain flight safety cutoffs."""
    now = datetime.now(timezone.utc)

    # 1. Wind exceeds 20 km/h -> Unsafe or prohibited conditions
    high_wind = {
        "is_forecast_available": True,
        "temperature_c": 26.0,
        "relative_humidity_pct": 60.0,
        "max_rain_probability_pct": 0.0,
        "total_expected_rainfall_mm": 0.0,
        "max_wind_speed_kmh": 22.5,  # Exceeds 20 km/h
        "weather_condition": "Windy",
        "is_severe_alert": False,
        "alternative_slots": [],
    }
    result_wind = evaluate_weather_booking_suitability(
        equipment_category="drone",
        operation="aerial spraying",
        start_time=now + timedelta(hours=3),
        duration_hours=2.0,
        weather_data=high_wind,
    )
    assert result_wind.suitability_level == "Unsafe or prohibited conditions"
    assert result_wind.risk_category == "High Risk"
    assert any("Drone Safety Limit" in f["factor"] for f in result_wind.factors)

    # 2. Rain > 0 mm -> Prohibited
    rainy = {
        "is_forecast_available": True,
        "temperature_c": 24.0,
        "relative_humidity_pct": 80.0,
        "max_rain_probability_pct": 70.0,
        "total_expected_rainfall_mm": 1.2,
        "max_wind_speed_kmh": 8.0,
        "weather_condition": "Light drizzle",
        "is_severe_alert": False,
        "alternative_slots": [],
    }
    result_rain = evaluate_weather_booking_suitability(
        equipment_category="drone",
        operation="spraying",
        start_time=now + timedelta(hours=3),
        duration_hours=2.0,
        weather_data=rainy,
    )
    assert result_rain.suitability_level == "Unsafe or prohibited conditions"
    assert any("Drone Rotor Hazard" in f["factor"] for f in result_rain.factors)


def test_auto_confirmation_when_all_ten_checks_pass(client, db_session):
    """Verify that when a resource has auto_confirm_enabled=True and all 10 checks pass, booking is auto-confirmed."""
    # 1. Register Owner
    owner_email = f"auto_owner_{uuid.uuid4().hex[:6]}@bhumisetu.org"
    client.post("/api/v1/auth/register", json={
        "email": owner_email,
        "full_name": "Instant Booking Owner",
        "password": "Password123",
        "role": "resource_owner",
    })
    login_owner = client.post("/api/v1/auth/login", json={"email": owner_email, "password": "Password123"})
    owner_headers = {"Authorization": f"Bearer {login_owner.json()['access_token']}"}

    # 2. Create listing with auto_confirm_enabled = True
    res_resp = client.post("/api/v1/resources/", json={
        "name": "Auto-Confirm Kubota Tractor",
        "category": "tractor",
        "description": "Auto confirmation enabled tractor",
        "supported_operations": ["ploughing", "tilling"],
        "price_per_unit": 750.0,
        "pricing_unit": "per_hour",
        "location_name": "Mandya",
        "latitude": 12.52,
        "longitude": 76.89,
        "service_radius_km": 40.0,
        "auto_confirm_enabled": True,
    }, headers=owner_headers)
    assert res_resp.status_code == 201
    resource_id = res_resp.json()["id"]

    # 3. Register Farmer
    farmer_email = f"auto_farmer_{uuid.uuid4().hex[:6]}@bhumisetu.org"
    client.post("/api/v1/auth/register", json={
        "email": farmer_email,
        "full_name": "Progressive Farmer",
        "password": "Password123",
        "role": "farmer",
    })
    login_farmer = client.post("/api/v1/auth/login", json={"email": farmer_email, "password": "Password123"})
    farmer_headers = {"Authorization": f"Bearer {login_farmer.json()['access_token']}"}

    # 4. Submit booking request
    start_time = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    idempotency_key = f"auto_book_{uuid.uuid4().hex}"
    book_resp = client.post("/api/v1/bookings/", json={
        "resource_id": resource_id,
        "operation": "ploughing",
        "start_time": start_time,
        "duration_hours": 3.0,
        "idempotency_key": idempotency_key,
        "notes": "Instant confirmation test",
    }, headers=farmer_headers)

    assert book_resp.status_code == 201
    booking_data = book_resp.json()
    assert booking_data["status"] == "confirmed"
    assert booking_data["auto_confirmed"] is True
    assert "Intelligent Auto-Confirmation Approved" in booking_data["confirmation_reason"]
    assert booking_data["priority_score"] is not None


def test_concurrency_conflict_returns_409(client, db_session):
    """Verify that overlapping requests against an already confirmed booking return HTTP 409 Conflict."""
    # 1. Setup confirmed booking
    owner_email = f"conflict_owner_{uuid.uuid4().hex[:6]}@bhumisetu.org"
    client.post("/api/v1/auth/register", json={
        "email": owner_email,
        "full_name": "Conflict Test Owner",
        "password": "Password123",
        "role": "resource_owner",
    })
    login_owner = client.post("/api/v1/auth/login", json={"email": owner_email, "password": "Password123"})
    owner_headers = {"Authorization": f"Bearer {login_owner.json()['access_token']}"}

    res_resp = client.post("/api/v1/resources/", json={
        "name": "Single Harvester",
        "category": "harvester",
        "description": "Only one harvester available",
        "supported_operations": ["harvesting"],
        "price_per_unit": 2000.0,
        "pricing_unit": "per_hour",
        "location_name": "Mysuru",
        "latitude": 12.30,
        "longitude": 76.65,
        "service_radius_km": 30.0,
        "auto_confirm_enabled": True,
    }, headers=owner_headers)
    resource_id = res_resp.json()["id"]

    farmer_email = f"farmer_first_{uuid.uuid4().hex[:6]}@bhumisetu.org"
    client.post("/api/v1/auth/register", json={
        "email": farmer_email,
        "full_name": "First Farmer",
        "password": "Password123",
        "role": "farmer",
    })
    login_farmer = client.post("/api/v1/auth/login", json={"email": farmer_email, "password": "Password123"})
    farmer_headers = {"Authorization": f"Bearer {login_farmer.json()['access_token']}"}

    start_dt = datetime.now(timezone.utc) + timedelta(days=2, hours=10)
    # First booking confirms
    client.post("/api/v1/bookings/", json={
        "resource_id": resource_id,
        "operation": "harvesting",
        "start_time": start_dt.isoformat(),
        "duration_hours": 4.0,
        "idempotency_key": f"key_first_{uuid.uuid4().hex}",
    }, headers=farmer_headers)

    # Second farmer requests overlapping time: 2 hours after start_dt
    farmer_email_2 = f"farmer_second_{uuid.uuid4().hex[:6]}@bhumisetu.org"
    client.post("/api/v1/auth/register", json={
        "email": farmer_email_2,
        "full_name": "Second Farmer",
        "password": "Password123",
        "role": "farmer",
    })
    login_farmer_2 = client.post("/api/v1/auth/login", json={"email": farmer_email_2, "password": "Password123"})
    farmer_headers_2 = {"Authorization": f"Bearer {login_farmer_2.json()['access_token']}"}

    overlap_resp = client.post("/api/v1/bookings/", json={
        "resource_id": resource_id,
        "operation": "harvesting",
        "start_time": (start_dt + timedelta(hours=2)).isoformat(),  # Overlaps!
        "duration_hours": 3.0,
        "idempotency_key": f"key_second_{uuid.uuid4().hex}",
    }, headers=farmer_headers_2)

    assert overlap_resp.status_code == 409
    assert "Scheduling conflict" in overlap_resp.json()["detail"]
