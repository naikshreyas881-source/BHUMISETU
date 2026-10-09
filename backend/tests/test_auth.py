def test_register_and_login_farmer(client):
    reg_payload = {
        "email": "farmer1@bhumisetu.org",
        "full_name": "Ramesh Gowda",
        "phone_number": "+919876543210",
        "password": "SecurePassword123",
        "role": "farmer",
        "preferred_language": "kn",
    }
    # 1. Register
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    user_data = reg_res.json()
    assert user_data["email"] == reg_payload["email"]
    assert user_data["full_name"] == reg_payload["full_name"]
    assert user_data["role"] == "farmer"
    assert user_data["preferred_language"] == "kn"
    assert "hashed_password" not in user_data

    # 2. Duplicate registration fails
    dup_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"]

    # 3. Login with correct password
    login_payload = {
        "email": "farmer1@bhumisetu.org",
        "password": "SecurePassword123",
    }
    login_res = client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    assert token_data["user"]["email"] == reg_payload["email"]

    # 4. Login with incorrect password fails
    bad_login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "farmer1@bhumisetu.org", "password": "WrongPassword"},
    )
    assert bad_login_res.status_code == 401

    # 5. Access /me endpoint with token
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == reg_payload["email"]

    # 6. Access /me without token fails
    unauth_res = client.get("/api/v1/auth/me")
    assert unauth_res.status_code == 401
