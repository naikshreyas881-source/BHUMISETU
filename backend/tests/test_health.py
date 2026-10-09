def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "BHUMISETU"
    assert data["tagline"] == "Bridging Farms to a Better Future"


def test_health_check_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "BHUMISETU"
    assert data["tagline"] == "Bridging Farms to a Better Future"
    assert data["database"] == "connected"
    assert "timestamp" in data
