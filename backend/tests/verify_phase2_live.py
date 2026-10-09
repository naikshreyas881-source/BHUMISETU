import sys
import uuid
from datetime import datetime, timezone, timedelta
import httpx

BASE_URL = "http://127.0.0.1:8000/api/v1"

def run_phase2_live_verification():
    print("--- 1. Testing Live Marketplace Resources Retrieval ---")
    res = httpx.get(f"{BASE_URL}/resources/", timeout=5.0)
    assert res.status_code == 200, f"Failed with {res.status_code}"
    resources = res.json()
    print(f"Retrieved {len(resources)} marketplace listings from database.")
    assert len(resources) >= 5, "Expected demonstration resources to be populated"
    
    # Verify demo flag is present
    demo_count = sum(1 for r in resources if r["is_demo"] is True)
    print(f"Demonstration listings identified: {demo_count}")
    assert demo_count > 0, "Demonstration records must be tagged with is_demo=True"

    print("\n--- 2. Testing Category & Distance Filtering ---")
    tractors = httpx.get(f"{BASE_URL}/resources/?category=tractor&lat=12.52&lon=76.89", timeout=5.0).json()
    print(f"Found {len(tractors)} tractors near Mandya:")
    for t in tractors:
        print(f"  - {t['name']} @ Rs.{t['price_per_unit']}/{t['pricing_unit']} (Distance: {t.get('distance_km')} km)")
        assert t["category"] == "tractor"
        assert t.get("distance_km") is not None

    print("\n--- 3. Logging in as Farmer Ramesh ---")
    farmer_login = httpx.post(
        f"{BASE_URL}/auth/login",
        json={"email": "farmer1@bhumisetu.org", "password": "SecurePassword123"},
        timeout=5.0
    )
    assert farmer_login.status_code == 200
    farmer_token = farmer_login.json()["access_token"]
    farmer_headers = {"Authorization": f"Bearer {farmer_token}"}
    print("Farmer authenticated successfully.")

    print("\n--- 4. Registering a New Farm Profile ---")
    farm_data = {
        "name": f"Kaveri Basin Farm #{uuid.uuid4().hex[:4]}",
        "location_name": "Srirangapatna, Mandya",
        "latitude": 12.4181,
        "longitude": 76.6947,
        "size_acres": 4.5,
        "soil_type": "Clay Alluvial",
        "irrigation_type": "Canal"
    }
    farm_res = httpx.post(f"{BASE_URL}/farms/", json=farm_data, headers=farmer_headers, timeout=5.0)
    assert farm_res.status_code == 201
    farm = farm_res.json()
    print(f"Registered farm: {farm['name']} (ID: {farm['id']})")

    print("\n--- 5. Submitting Booking Request with Idempotency Key ---")
    selected_tractor = tractors[0]
    idempotency_key = f"live_idemp_{uuid.uuid4().hex}"
    start_time = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    booking_req = {
        "resource_id": selected_tractor["id"],
        "farm_id": farm["id"],
        "operation": "ploughing",
        "start_time": start_time,
        "duration_hours": 5.0,
        "idempotency_key": idempotency_key,
        "notes": "Need deep ploughing before monsoon"
    }
    book_res = httpx.post(f"{BASE_URL}/bookings/", json=booking_req, headers=farmer_headers, timeout=5.0)
    assert book_res.status_code == 201
    booking = book_res.json()
    print(f"Booking created: #{booking['id']} | Status: {booking['status']} | Cost: Rs.{booking['estimated_cost']}")
    assert booking["status"] == "submitted"

    print("\n--- 6. Verifying Idempotency Safety ---")
    dup_res = httpx.post(f"{BASE_URL}/bookings/", json=booking_req, headers=farmer_headers, timeout=5.0)
    assert dup_res.status_code == 201
    assert dup_res.json()["id"] == booking["id"]
    print("Idempotency verified: re-submission returned identical booking without duplicate insertion.")

    print("\n--- 7. Logging in as Equipment Owner Manjunath ---")
    owner_login = httpx.post(
        f"{BASE_URL}/auth/login",
        json={"email": "owner_manjunath@bhumisetu.org", "password": "OwnerSecure123"},
        timeout=5.0
    )
    assert owner_login.status_code == 200
    owner_token = owner_login.json()["access_token"]
    owner_headers = {"Authorization": f"Bearer {owner_token}"}
    print("Owner authenticated successfully.")

    print("\n--- 8. Owner Approving Booking (Transition to CONFIRMED) ---")
    approve_res = httpx.patch(
        f"{BASE_URL}/bookings/{booking['id']}/status",
        json={"status": "confirmed"},
        headers=owner_headers,
        timeout=5.0
    )
    assert approve_res.status_code == 200
    updated_booking = approve_res.json()
    print(f"Booking #{booking['id']} status updated to: {updated_booking['status']}")
    assert updated_booking["status"] == "confirmed"

    print("\n=======================================================")
    print("ALL LIVE END-TO-END MARKETPLACE VERIFICATIONS SUCCEEDED!")
    print("=======================================================")

if __name__ == "__main__":
    run_phase2_live_verification()
