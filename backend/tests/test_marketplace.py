def test_farm_and_crop_management(client):
    # 1. Register and login a farmer
    farmer_data = {
        "email": "farm_tester@bhumisetu.org",
        "full_name": "Somesh Patel",
        "password": "Password123",
        "role": "farmer",
    }
    client.post("/api/v1/auth/register", json=farmer_data)
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "farm_tester@bhumisetu.org", "password": "Password123"},
    )
    headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

    # 2. Create a farm
    farm_payload = {
        "name": "Somesh Agro Farm",
        "location_name": "Maddur, Mandya",
        "latitude": 12.5842,
        "longitude": 77.0425,
        "size_acres": 6.5,
        "soil_type": "Black Loam",
        "irrigation_type": "Drip",
    }
    create_farm_res = client.post("/api/v1/farms/", json=farm_payload, headers=headers)
    assert create_farm_res.status_code == 201
    farm = create_farm_res.json()
    assert farm["name"] == farm_payload["name"]
    assert farm["size_acres"] == 6.5

    # 3. Add a crop to the farm
    crop_payload = {
        "crop_name": "Tomato (Hybrid F1)",
        "stage": "Flowering",
        "planted_date": "2026-08-01",
        "expected_harvest_date": "2026-10-30",
    }
    add_crop_res = client.post(
        f"/api/v1/farms/{farm['id']}/crops", json=crop_payload, headers=headers
    )
    assert add_crop_res.status_code == 201
    crop = add_crop_res.json()
    assert crop["crop_name"] == "Tomato (Hybrid F1)"
    assert crop["farm_id"] == farm["id"]

    # 4. Retrieve user's farms and verify attached crops
    list_res = client.get("/api/v1/farms/", headers=headers)
    assert list_res.status_code == 200
    user_farms = list_res.json()
    assert len(user_farms) >= 1
    assert any(f["id"] == farm["id"] for f in user_farms)


def test_resource_search_and_filters(client):
    # 1. Search all active resources
    res = client.get("/api/v1/resources/")
    assert res.status_code == 200
    resources = res.json()
    assert isinstance(resources, list)

    # 2. Filter by category
    tractor_res = client.get("/api/v1/resources/?category=tractor")
    assert tractor_res.status_code == 200
    for item in tractor_res.json():
        assert item["category"] == "tractor"

    # 3. Filter by supported operation
    op_res = client.get("/api/v1/resources/?operation=ploughing")
    assert op_res.status_code == 200
    for item in op_res.json():
        assert "ploughing" in [op.lower() for op in item["supported_operations"]]

    # 4. Filter by coordinates and distance calculation
    # Coordinates of Mandya city center: 12.5218 N, 76.8951 E
    geo_res = client.get("/api/v1/resources/?lat=12.5218&lon=76.8951&max_distance_km=40")
    assert geo_res.status_code == 200
    geo_items = geo_res.json()
    for item in geo_items:
        assert item["distance_km"] is not None
        assert item["distance_km"] <= 40.0
