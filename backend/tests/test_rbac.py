def test_role_based_access_control(client):
    # Register Farmer
    farmer_payload = {
        "email": "farmer_rbac@bhumisetu.org",
        "full_name": "Suresh Patel",
        "password": "Password123",
        "role": "farmer",
        "preferred_language": "en",
    }
    client.post("/api/v1/auth/register", json=farmer_payload)
    farmer_login = client.post(
        "/api/v1/auth/login",
        json={"email": "farmer_rbac@bhumisetu.org", "password": "Password123"},
    )
    farmer_token = farmer_login.json()["access_token"]
    farmer_headers = {"Authorization": f"Bearer {farmer_token}"}

    # Register Admin
    admin_payload = {
        "email": "admin_rbac@bhumisetu.org",
        "full_name": "System Administrator",
        "password": "AdminPassword123",
        "role": "administrator",
        "preferred_language": "en",
    }
    client.post("/api/v1/auth/register", json=admin_payload)
    admin_login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin_rbac@bhumisetu.org", "password": "AdminPassword123"},
    )
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Farmer attempting to access admin audit logs is DENIED with 403
    forbidden_res = client.get("/api/v1/admin/audit-logs", headers=farmer_headers)
    assert forbidden_res.status_code == 403
    assert "Insufficient permissions" in forbidden_res.json()["detail"]

    # 2. Administrator accessing admin audit logs is ALLOWED with 200
    allowed_res = client.get("/api/v1/admin/audit-logs", headers=admin_headers)
    assert allowed_res.status_code == 200
    assert isinstance(allowed_res.json(), list)

    # 3. Unauthenticated request to admin endpoint returns 401
    unauth_res = client.get("/api/v1/admin/audit-logs")
    assert unauth_res.status_code == 401
