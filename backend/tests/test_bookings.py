import uuid
from datetime import datetime, timezone, timedelta


def test_booking_submission_and_lifecycle(client):
    # 1. Register Owner
    owner_email = f"owner_{uuid.uuid4().hex[:6]}@bhumisetu.org"
    client.post(
        "/api/v1/auth/register",
        json={
            "email": owner_email,
            "full_name": "Kiran Equipment Owner",
            "password": "OwnerPassword123",
            "role": "resource_owner",
        },
    )
    owner_login = client.post(
        "/api/v1/auth/login",
        json={"email": owner_email, "password": "OwnerPassword123"},
    )
    owner_headers = {"Authorization": f"Bearer {owner_login.json()['access_token']}"}

    # 2. Owner creates a tractor listing
    resource_payload = {
        "name": "Sonalika DI 745 III Tractor",
        "category": "tractor",
        "description": "50 HP tractor for agricultural works",
        "supported_operations": ["ploughing", "tilling"],
        "price_per_unit": 600.0,
        "pricing_unit": "per_hour",
        "location_name": "Hassan",
        "latitude": 13.00,
        "longitude": 76.10,
        "service_radius_km": 30.0,
    }
    create_res = client.post(
        "/api/v1/resources/", json=resource_payload, headers=owner_headers
    )
    assert create_res.status_code == 201
    resource = create_res.json()

    # 3. Register Farmer
    farmer_email = f"farmer_{uuid.uuid4().hex[:6]}@bhumisetu.org"
    client.post(
        "/api/v1/auth/register",
        json={
            "email": farmer_email,
            "full_name": "Venkatesh Farmer",
            "password": "FarmerPassword123",
            "role": "farmer",
        },
    )
    farmer_login = client.post(
        "/api/v1/auth/login",
        json={"email": farmer_email, "password": "FarmerPassword123"},
    )
    farmer_headers = {"Authorization": f"Bearer {farmer_login.json()['access_token']}"}

    # 4. Farmer submits a booking request
    idempotency_key = f"key_{uuid.uuid4().hex}"
    start_time = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    booking_payload = {
        "resource_id": resource["id"],
        "operation": "ploughing",
        "start_time": start_time,
        "duration_hours": 4.0,
        "idempotency_key": idempotency_key,
        "notes": "Field needs deep ploughing",
    }
    booking_res = client.post(
        "/api/v1/bookings/", json=booking_payload, headers=farmer_headers
    )
    assert booking_res.status_code == 201
    booking = booking_res.json()
    assert booking["status"] == "submitted"
    assert booking["duration_hours"] == 4.0
    assert booking["estimated_cost"] == 4.0 * 600.0  # Rs. 2400.0

    # 5. Verify Idempotency: Re-submitting the exact same idempotency_key returns the same booking
    duplicate_res = client.post(
        "/api/v1/bookings/", json=booking_payload, headers=farmer_headers
    )
    assert duplicate_res.status_code == 201
    assert duplicate_res.json()["id"] == booking["id"]

    # 6. Unauthorized approval attempt: Farmer attempting to approve returns 403 Forbidden
    unauth_approve = client.patch(
        f"/api/v1/bookings/{booking['id']}/status",
        json={"status": "confirmed"},
        headers=farmer_headers,
    )
    assert unauth_approve.status_code == 403

    # 7. Owner approves the booking: Transitions to confirmed
    owner_approve = client.patch(
        f"/api/v1/bookings/{booking['id']}/status",
        json={"status": "confirmed"},
        headers=owner_headers,
    )
    assert owner_approve.status_code == 200
    assert owner_approve.json()["status"] == "confirmed"

    # 8. Farmer cancels the confirmed booking: Transitions to cancelled
    farmer_cancel = client.patch(
        f"/api/v1/bookings/{booking['id']}/status",
        json={"status": "cancelled"},
        headers=farmer_headers,
    )
    assert farmer_cancel.status_code == 200
    assert farmer_cancel.json()["status"] == "cancelled"

    # 9. Invalid transition: Cannot confirm a cancelled booking
    invalid_trans = client.patch(
        f"/api/v1/bookings/{booking['id']}/status",
        json={"status": "confirmed"},
        headers=owner_headers,
    )
    assert invalid_trans.status_code == 400
