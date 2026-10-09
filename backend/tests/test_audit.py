def test_audit_logging_pipeline(client):
    # Register Admin to inspect logs later
    admin_payload = {
        "email": "audit_admin@bhumisetu.org",
        "full_name": "Audit Auditor",
        "password": "AdminPassword123",
        "role": "administrator",
    }
    client.post("/api/v1/auth/register", json=admin_payload)
    admin_login = client.post(
        "/api/v1/auth/login",
        json={"email": "audit_admin@bhumisetu.org", "password": "AdminPassword123"},
    )
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    # Register Farmer
    farmer_payload = {
        "email": "farmer_audit@bhumisetu.org",
        "full_name": "Girish Gowda",
        "password": "FarmerPassword123",
        "role": "farmer",
    }
    reg_res = client.post("/api/v1/auth/register", json=farmer_payload)
    assert reg_res.status_code == 201

    # Farmer log in
    client.post(
        "/api/v1/auth/login",
        json={"email": "farmer_audit@bhumisetu.org", "password": "FarmerPassword123"},
    )

    # Failed login attempt
    client.post(
        "/api/v1/auth/login",
        json={"email": "farmer_audit@bhumisetu.org", "password": "WrongPassword"},
    )

    # Query audit logs as Admin
    logs_res = client.get("/api/v1/admin/audit-logs", headers=admin_headers)
    assert logs_res.status_code == 200
    logs = logs_res.json()

    actions = [log["action"] for log in logs]
    assert "USER_REGISTER" in actions
    assert "USER_LOGIN" in actions
    assert "LOGIN_FAILED" in actions
