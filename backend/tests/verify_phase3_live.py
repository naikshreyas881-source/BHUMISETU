import sys
import uuid
from datetime import datetime, timezone, timedelta
import httpx

BASE_URL = "http://127.0.0.1:8000/api/v1"

def run_phase3_live_verification():
    print("================================================================================")
    print(" BHUMISETU PHASE 3 LIVE COORDINATION ENGINE VERIFICATION")
    print("================================================================================")

    # 1. Farmer Login
    print("\n[+] 1. Farmer Authentication...")
    farmer_login = httpx.post(
        f"{BASE_URL}/auth/login",
        json={"email": "farmer1@bhumisetu.org", "password": "SecurePassword123"},
        timeout=10.0
    )
    assert farmer_login.status_code == 200, f"Farmer login failed: {farmer_login.text}"
    token = farmer_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("    [SUCCESS] Authenticated farmer1@bhumisetu.org.")

    # 2. Retrieve demonstration resources
    print("\n[+] 2. Fetching available demonstration machinery...")
    res = httpx.get(f"{BASE_URL}/resources/", headers=headers, timeout=10.0)
    assert res.status_code == 200, f"Resources fetch failed: {res.text}"
    resources = res.json()
    assert len(resources) > 0, "No resources found in database"
    tractor = next((r for r in resources if r["category"] == "tractor"), resources[0])
    harvester = next((r for r in resources if r["category"] == "harvester"), resources[-1])
    print(f"    Selected Tractor ID {tractor['id']}: {tractor['name']}")
    print(f"    Selected Harvester ID {harvester['id']}: {harvester['name']}")

    # 3. Test Suitability Matching and Hard Constraints
    print("\n[+] 3. Testing Suitability Matching & Hard Constraint Enforcement...")
    now = datetime.now(timezone.utc)
    start_dt = now + timedelta(days=6, hours=8)

    # 3a. Suitable check
    suitability_req = {
        "resource_id": tractor["id"],
        "operation": "ploughing",
        "start_time": start_dt.isoformat(),
        "duration_hours": 4.0,
        "max_budget": 5000.0
    }
    s_res = httpx.post(f"{BASE_URL}/coordination/check-suitability", json=suitability_req, headers=headers, timeout=10.0)
    assert s_res.status_code == 200, f"Suitability check failed: {s_res.text}"
    s_data = s_res.json()
    print(f"    Suitability Result: is_feasible={s_data['is_feasible']}, estimated_cost=Rs.{s_data['estimated_cost']}")
    assert s_data["is_feasible"] is True, "Expected tractor to be feasible for ploughing within budget"
    print("    [SUCCESS] Hard constraints satisfied for matching request.")

    # 3b. Incompatible operation check
    unsuitable_req = dict(suitability_req)
    unsuitable_req["operation"] = "paddy_harvesting_heavy"
    s_res2 = httpx.post(f"{BASE_URL}/coordination/check-suitability", json=unsuitable_req, headers=headers, timeout=10.0)
    assert s_res2.status_code == 200
    s_data2 = s_res2.json()
    print(f"    Incompatible Operation Check: is_feasible={s_data2['is_feasible']}, reasons={s_data2['rejection_reasons']}")
    assert s_data2["is_feasible"] is False, "Expected hard constraint failure for incompatible operation"
    assert any("cannot perform" in r for r in s_data2["rejection_reasons"])
    print("    [SUCCESS] Hard constraint correctly blocked unsupported operation.")

    # 4. Test Explainable Priority Scoring (0-100) & Missing Data Handling
    print("\n[+] 4. Testing Explainable Priority Scoring & Transparent Missing Data Fallback...")
    priority_req = {
        "urgency_level": "critical",
        "rain_probability_pct": 85.0,
        "severe_weather_alert": True,
        "crop_stage": "Harvesting",
        "farm_size_acres": 6.0,
        "deadline_hours": 10.0,
        "soil_moisture_suitable": True
    }
    p_res = httpx.post(f"{BASE_URL}/coordination/priority-score", json=priority_req, headers=headers, timeout=10.0)
    assert p_res.status_code == 200, f"Priority score failed: {p_res.text}"
    p_data = p_res.json()
    print(f"    Overall Priority Score: {p_data['overall_score']} / 100")
    print(f"    Breakdown factors evaluated: {list(p_data['breakdown'].keys())}")
    print(f"    Plain-language explanation:\n      \"{p_data['plain_language_explanation'][:120]}...\"")
    assert p_data["overall_score"] >= 80.0, "Expected high priority score under emergency conditions"
    assert "weather_risk" in p_data["breakdown"]
    assert p_data["breakdown"]["weather_risk"]["score"] == 25.0
    print("    [SUCCESS] Critical weather risk priority computation verified.")

    # 4b. Test Missing Weather Data (Must use neutral baseline 12.5 and disclose source)
    p_missing_req = {
        "urgency_level": "medium",
        "crop_stage": "Vegetative",
        "rain_probability_pct": None
    }
    p_miss_res = httpx.post(f"{BASE_URL}/coordination/priority-score", json=p_missing_req, headers=headers, timeout=10.0)
    assert p_miss_res.status_code == 200
    p_miss_data = p_miss_res.json()
    print(f"    Missing Weather Score: {p_miss_data['overall_score']} / 100")
    print(f"    Weather factor with missing data: {p_miss_data['breakdown']['weather_risk']['score']} / 25.0")
    print(f"    Missing information disclosures: {p_miss_data['missing_information']}")
    assert p_miss_data["breakdown"]["weather_risk"]["score"] == 12.5, "Missing weather must default to neutral 12.5 baseline"
    assert any("precipitation" in m.lower() or "weather" in m.lower() for m in p_miss_data["missing_information"]), "Missing weather/precipitation must be disclosed"
    print("    [SUCCESS] Transparent missing weather baseline and disclosure verified.")

    # 5. Test Conflict Detection and Smart Alternative Discovery
    print("\n[+] 5. Testing Interval Conflict Detection & Overlap Prevention...")
    # 5a. Check before booking
    conflict_start = now + timedelta(days=7, hours=9)
    c_req = {
        "resource_id": tractor["id"],
        "start_time": conflict_start.isoformat(),
        "duration_hours": 4.0
    }
    c_res = httpx.post(f"{BASE_URL}/coordination/check-conflicts", json=c_req, headers=headers, timeout=10.0)
    assert c_res.status_code == 200
    c_data = c_res.json()
    print(f"    Pre-booking conflict status: has_conflict={c_data['has_conflict']}")
    assert c_data["has_conflict"] is False

    # 5b. Create active booking for this exact interval
    idemp_key = f"coord_live_{uuid.uuid4().hex}"
    book_payload = {
        "resource_id": tractor["id"],
        "operation": "ploughing",
        "start_time": conflict_start.isoformat(),
        "duration_hours": 4.0,
        "idempotency_key": idemp_key,
        "notes": "Live coordination interval test"
    }
    book_res = httpx.post(f"{BASE_URL}/bookings/", json=book_payload, headers=headers, timeout=10.0)
    assert book_res.status_code == 201, f"Booking creation failed: {book_res.text}"
    booking_id = book_res.json()["id"]
    print(f"    Created active booking ID: {booking_id}")

    # 5c. Check conflicts for overlapping window (e.g. 2 hours in)
    overlap_check_req = {
        "resource_id": tractor["id"],
        "start_time": (conflict_start + timedelta(hours=2)).isoformat(),
        "duration_hours": 3.0
    }
    c_res2 = httpx.post(f"{BASE_URL}/coordination/check-conflicts", json=overlap_check_req, headers=headers, timeout=10.0)
    assert c_res2.status_code == 200
    c_data2 = c_res2.json()
    print(f"    Post-booking conflict status: has_conflict={c_data2['has_conflict']}")
    print(f"    Conflict type: {c_data2['conflict_type']}")
    print(f"    Conflicting booking IDs: {c_data2['conflicting_booking_ids']}")
    assert c_data2["has_conflict"] is True, "Interval overlap must detect active booking conflict"
    assert booking_id in c_data2["conflicting_booking_ids"]
    print("    [SUCCESS] Interval overlap conflict detected with exact booking ID linkage.")

    # 6. Test Smart Agricultural Resource Recommendations
    print("\n[+] 6. Testing Explainable Recommendations Engine...")
    rec_req = {
        "resource_id": tractor["id"],
        "operation": "ploughing",
        "start_time": (now + timedelta(days=8, hours=8)).isoformat(),
        "duration_hours": 4.0
    }
    rec_res = httpx.post(f"{BASE_URL}/coordination/recommend", json=rec_req, headers=headers, timeout=10.0)
    assert rec_res.status_code == 200, f"Recommendation failed: {rec_res.text}"
    rec_data = rec_res.json()
    print(f"    Preferred Feasible: {rec_data['preferred_feasible']}")
    print(f"    Explainable Recommendation Summary:\n      \"{rec_data['explainable_recommendation'][:140]}...\"")
    print(f"    Alternative resources found: {len(rec_data['alternative_resources'])}")
    print(f"    Alternative time slots found: {len(rec_data['alternative_time_slots'])}")
    assert "explainable_recommendation" in rec_data
    assert len(rec_data["explainable_recommendation"]) > 10
    print("    [SUCCESS] Explainable resource recommendations generated successfully.")

    print("\n================================================================================")
    print(" ALL PHASE 3 LIVE VERIFICATIONS PASSED SUCCESSFULLY!")
    print("================================================================================")

if __name__ == "__main__":
    try:
        run_phase3_live_verification()
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[ERROR] Live verification failed: {e}", file=sys.stderr)
        sys.exit(1)
