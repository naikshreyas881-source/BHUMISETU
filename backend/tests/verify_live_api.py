import sys
import httpx

BASE_URL = "http://127.0.0.1:8000/api/v1"

def run_live_verification():
    print("--- 1. Testing Live Health Check Endpoint ---")
    try:
        health_res = httpx.get(f"{BASE_URL}/health", timeout=5.0)
    except Exception as e:
        print(f"Failed to connect to backend server at {BASE_URL}/health: {e}")
        sys.exit(1)

    print(f"Health Response [{health_res.status_code}]: {health_res.json()}")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "healthy"
    assert health_res.json()["database"] == "connected"

    print("\n--- 2. Testing Farmer Registration ---")
    farmer_data = {
        "email": "live_farmer@bhumisetu.org",
        "full_name": "Ramesh Gowda",
        "phone_number": "+919876543210",
        "password": "FarmerSecure123",
        "role": "farmer",
        "preferred_language": "kn"
    }
    reg_farmer_res = httpx.post(f"{BASE_URL}/auth/register", json=farmer_data, timeout=5.0)
    print(f"Farmer Registration [{reg_farmer_res.status_code}]: {reg_farmer_res.json()}")
    assert reg_farmer_res.status_code in [201, 400]

    print("\n--- 3. Testing Admin Registration ---")
    admin_data = {
        "email": "live_admin@bhumisetu.org",
        "full_name": "Chief Platform Admin",
        "password": "AdminSecure123",
        "role": "administrator",
        "preferred_language": "en"
    }
    reg_admin_res = httpx.post(f"{BASE_URL}/auth/register", json=admin_data, timeout=5.0)
    print(f"Admin Registration [{reg_admin_res.status_code}]: {reg_admin_res.json()}")
    assert reg_admin_res.status_code in [201, 400]

    print("\n--- 4. Testing Farmer Login & JWT Issuance ---")
    farmer_login = httpx.post(
        f"{BASE_URL}/auth/login",
        json={"email": "live_farmer@bhumisetu.org", "password": "FarmerSecure123"},
        timeout=5.0
    )
    print(f"Farmer Login [{farmer_login.status_code}]")
    assert farmer_login.status_code == 200
    farmer_token = farmer_login.json()["access_token"]
    assert len(farmer_token) > 20

    print("\n--- 5. Testing /auth/me for Farmer ---")
    farmer_me = httpx.get(
        f"{BASE_URL}/auth/me",
        headers={"Authorization": f"Bearer {farmer_token}"},
        timeout=5.0
    )
    print(f"Farmer Profile [{farmer_me.status_code}]: {farmer_me.json()['full_name']} ({farmer_me.json()['role']})")
    assert farmer_me.status_code == 200
    assert farmer_me.json()["role"] == "farmer"

    print("\n--- 6. Testing RBAC Restriction: Farmer Accessing Admin Audit Logs ---")
    forbidden_res = httpx.get(
        f"{BASE_URL}/admin/audit-logs",
        headers={"Authorization": f"Bearer {farmer_token}"},
        timeout=5.0
    )
    print(f"Farmer Access to Admin Logs [{forbidden_res.status_code}]: {forbidden_res.json()}")
    assert forbidden_res.status_code == 403
    assert "Insufficient permissions" in forbidden_res.json()["detail"]

    print("\n--- 7. Testing Admin Login & Accessing Audit Logs ---")
    admin_login = httpx.post(
        f"{BASE_URL}/auth/login",
        json={"email": "live_admin@bhumisetu.org", "password": "AdminSecure123"},
        timeout=5.0
    )
    print(f"Admin Login [{admin_login.status_code}]")
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]

    admin_logs_res = httpx.get(
        f"{BASE_URL}/admin/audit-logs",
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=5.0
    )
    print(f"Admin Audit Logs Retrieval [{admin_logs_res.status_code}]: Retrieved {len(admin_logs_res.json())} audit log records")
    assert admin_logs_res.status_code == 200
    logs = admin_logs_res.json()
    assert len(logs) > 0
    actions = [l["action"] for l in logs]
    print(f"Audit Actions recorded in database: {set(actions)}")
    assert "ROLE_ACCESS_DENIED" in actions or "USER_REGISTER" in actions or "USER_LOGIN" in actions

    print("\n=======================================================")
    print("ALL LIVE END-TO-END FOUNDATION VERIFICATIONS SUCCEEDED!")
    print("=======================================================")

if __name__ == "__main__":
    run_live_verification()
