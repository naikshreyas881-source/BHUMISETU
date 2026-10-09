import uuid
from datetime import datetime, timedelta, timezone, date
from app.models.marketplace import (
    Resource,
    ResourceCategory,
    PricingUnit,
    Farm,
    Booking,
    MaintenanceWindow,
    BookingStatus,
)
from app.coordination import (
    evaluate_resource_suitability,
    calculate_priority_score,
    detect_booking_conflicts,
    find_feasible_slots,
    recommend_alternatives,
)


def test_suitability_matching_and_hard_constraints(client, db_session):
    # 1. Create a tractor resource
    tractor = Resource(
        name="Test Coordination Tractor",
        category=ResourceCategory.TRACTOR,
        description="50 HP tractor for ploughing and tilling",
        supported_operations=["ploughing", "tilling"],
        price_per_unit=500.0,
        pricing_unit=PricingUnit.PER_HOUR,
        location_name="Mandya",
        latitude=12.52,
        longitude=76.89,
        service_radius_km=20.0,
        owner_id=1,
    )
    db_session.add(tractor)
    db_session.commit()
    db_session.refresh(tractor)

    # 2. Create a farm within radius (5 km away)
    near_farm = Farm(
        owner_id=1,
        name="Near Farm",
        location_name="Mandya Rural",
        latitude=12.55,
        longitude=76.91,
        size_acres=3.0,
    )
    # 3. Create a farm out of radius (100 km away in Bengaluru)
    far_farm = Farm(
        owner_id=1,
        name="Far Farm",
        location_name="Bengaluru",
        latitude=12.97,
        longitude=77.59,
        size_acres=5.0,
    )
    db_session.add_all([near_farm, far_farm])
    db_session.commit()

    start_time = datetime(2026, 10, 15, 8, 0, tzinfo=timezone.utc)

    # Case A: Success matching
    res_ok = evaluate_resource_suitability(
        resource=tractor,
        operation="ploughing",
        start_time=start_time,
        duration_hours=4.0,
        farm=near_farm,
        max_budget=3000.0,
    )
    assert res_ok.is_feasible is True
    assert len(res_ok.rejection_reasons) == 0
    assert res_ok.estimated_cost == 2000.0  # 4 * 500

    # Case B: Hard Constraint - Unsupported Operation
    res_bad_op = evaluate_resource_suitability(
        resource=tractor,
        operation="aerial_spraying",
        start_time=start_time,
        duration_hours=4.0,
        farm=near_farm,
    )
    assert res_bad_op.is_feasible is False
    assert any("aerial_spraying" in r for r in res_bad_op.rejection_reasons)

    # Case C: Hard Constraint - Service Area / Distance Exceeded
    res_far = evaluate_resource_suitability(
        resource=tractor,
        operation="ploughing",
        start_time=start_time,
        duration_hours=4.0,
        farm=far_farm,
    )
    assert res_far.is_feasible is False
    assert any("exceeds the resource maximum service radius" in r for r in res_far.rejection_reasons)

    # Case D: Hard Constraint - Budget Exceeded
    res_budget = evaluate_resource_suitability(
        resource=tractor,
        operation="ploughing",
        start_time=start_time,
        duration_hours=4.0,
        farm=near_farm,
        max_budget=1500.0,  # cost is 2000
    )
    assert res_budget.is_feasible is False
    assert any("exceeds your stated budget" in r for r in res_budget.rejection_reasons)

    # Case E: Hard Constraint - Maintenance Window Overlap
    maint = MaintenanceWindow(
        resource_id=tractor.id,
        start_time=datetime(2026, 10, 15, 7, 0, tzinfo=timezone.utc),
        end_time=datetime(2026, 10, 15, 10, 0, tzinfo=timezone.utc),
        reason="Hydraulic Pump Overhaul",
    )
    db_session.add(maint)
    db_session.commit()

    res_maint = evaluate_resource_suitability(
        resource=tractor,
        operation="ploughing",
        start_time=start_time,  # 8am to 12pm overlaps 7am to 10am
        duration_hours=4.0,
        farm=near_farm,
        maintenance_windows=[maint],
    )
    assert res_maint.is_feasible is False
    assert any("Hydraulic Pump Overhaul" in r for r in res_maint.rejection_reasons)


def test_priority_score_calculation_and_missing_data():
    # 1. High-priority case: Critical urgency + Harvesting crop + Rain threat + Tight deadline
    high_res = calculate_priority_score(
        urgency_level="critical",
        rain_probability_pct=85.0,
        severe_weather_alert=True,
        crop_stage="Harvesting",
        farm_size_acres=6.0,
        deadline_hours=10.0,
        soil_moisture_suitable=True,
    )
    assert 85.0 <= high_res.overall_score <= 100.0
    assert high_res.breakdown["urgency"].score == 25.0
    assert high_res.breakdown["weather_risk"].score == 25.0
    assert high_res.breakdown["crop_readiness"].score == 20.0
    assert len(high_res.missing_information) == 0
    assert "Overall Priority Assessment" in high_res.plain_language_explanation

    # 2. Transparent missing data case: No weather data, no crop stage, no deadline
    missing_res = calculate_priority_score(
        urgency_level="medium",
        rain_probability_pct=None,  # Missing weather!
        crop_stage=None,            # Missing crop!
        deadline_hours=None,        # Missing deadline!
    )
    assert 0.0 <= missing_res.overall_score <= 100.0
    # Weather risk should NOT be 0; it must be the transparent neutral baseline of 12.5
    assert missing_res.breakdown["weather_risk"].score == 12.5
    assert len(missing_res.missing_information) >= 2
    assert any("precipitation" in m.lower() for m in missing_res.missing_information)
    assert "Missing parameters" in missing_res.plain_language_explanation


def test_interval_conflicts_and_smart_scheduling(client, db_session):
    # 1. Create equipment
    drone = Resource(
        name="Spray Drone Pro",
        category=ResourceCategory.DRONE,
        description="Drone for crop spraying",
        supported_operations=["spraying"],
        price_per_unit=400.0,
        pricing_unit=PricingUnit.PER_ACRE,
        location_name="Hassan",
        latitude=13.00,
        longitude=76.10,
        service_radius_km=30.0,
        owner_id=1,
    )
    db_session.add(drone)
    db_session.commit()
    db_session.refresh(drone)

    # 2. Add an active booking on 2026-10-20 from 10:00 to 14:00
    b_start = datetime(2026, 10, 20, 10, 0, tzinfo=timezone.utc)
    b_end = datetime(2026, 10, 20, 14, 0, tzinfo=timezone.utc)
    booking1 = Booking(
        farmer_id=1,
        resource_id=drone.id,
        operation="spraying",
        start_time=b_start,
        end_time=b_end,
        duration_hours=4.0,
        estimated_cost=1200.0,
        status=BookingStatus.CONFIRMED,
        idempotency_key=f"b_{uuid.uuid4().hex}",
    )
    db_session.add(booking1)
    db_session.commit()

    # 3. Test conflict detection for overlapping window (12:00 to 16:00)
    conflict_report = detect_booking_conflicts(
        db=db_session,
        resource_id=drone.id,
        start_time=datetime(2026, 10, 20, 12, 0, tzinfo=timezone.utc),
        end_time=datetime(2026, 10, 20, 16, 0, tzinfo=timezone.utc),
    )
    assert conflict_report.has_conflict is True
    assert conflict_report.conflict_type == "BOOKING_OVERLAP"
    assert booking1.id in conflict_report.conflicting_booking_ids

    # 4. Test non-conflicting window on same day (06:00 to 09:30)
    free_report = detect_booking_conflicts(
        db=db_session,
        resource_id=drone.id,
        start_time=datetime(2026, 10, 20, 6, 0, tzinfo=timezone.utc),
        end_time=datetime(2026, 10, 20, 9, 30, tzinfo=timezone.utc),
    )
    assert free_report.has_conflict is False

    # 5. Smart scheduling: find open alternative slots
    slots = find_feasible_slots(
        db=db_session,
        resource=drone,
        target_date=date(2026, 10, 20),
        duration_hours=3.0,
    )
    assert len(slots) > 0
    # The 06:30 morning shift should be free
    assert any("Morning Shift" in s.label for s in slots)


def test_coordination_api_endpoints(client, db_session):
    # 0. Create test resource
    res = Resource(
        name="API Test Tractor",
        category=ResourceCategory.TRACTOR,
        description="Test tractor",
        supported_operations=["ploughing"],
        price_per_unit=550.0,
        pricing_unit=PricingUnit.PER_HOUR,
        location_name="Mandya",
        latitude=12.52,
        longitude=76.89,
        service_radius_km=25.0,
        owner_id=1,
    )
    db_session.add(res)
    db_session.commit()
    db_session.refresh(res)

    # 1. API Suitability Check
    suit_req = {
        "resource_id": res.id,
        "operation": "ploughing",
        "start_time": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
        "duration_hours": 3.0,
    }
    suit_res = client.post("/api/v1/coordination/check-suitability", json=suit_req)
    assert suit_res.status_code == 200
    data = suit_res.json()
    assert "is_feasible" in data

    # 2. API Priority Score
    prio_req = {
        "urgency_level": "high",
        "rain_probability_pct": 65.0,
        "crop_stage": "Harvesting",
        "farm_size_acres": 4.5,
        "deadline_hours": 18.0,
    }
    prio_res = client.post("/api/v1/coordination/priority-score", json=prio_req)
    assert prio_res.status_code == 200
    prio_data = prio_res.json()
    assert 0.0 <= prio_data["overall_score"] <= 100.0
    assert "urgency" in prio_data["breakdown"]
    assert "weather_risk" in prio_data["breakdown"]

    # 3. API Recommendations & Alternatives
    rec_req = {
        "resource_id": res.id,
        "operation": "ploughing",
        "start_time": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(),
        "duration_hours": 4.0,
    }
    rec_res = client.post("/api/v1/coordination/recommend", json=rec_req)
    assert rec_res.status_code == 200
    rec_data = rec_res.json()
    assert "explainable_recommendation" in rec_data
    assert len(rec_data["explainable_recommendation"]) > 10
