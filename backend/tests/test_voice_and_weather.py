import pytest
from datetime import datetime, timezone, timedelta
from app.models.marketplace import Resource, ResourceCategory, PricingUnit

def test_weather_endpoint_live_or_fallback(client):
    res = client.get("/api/v1/weather/forecast?latitude=12.5218&longitude=76.8951")
    assert res.status_code == 200
    data = res.json()
    assert "is_live" in data
    assert "source" in data
    assert "latitude" in data
    assert "longitude" in data

def test_farmvoice_interaction_and_booking_confirmation(client, db_session):
    # 1. Register a test tractor
    tractor = Resource(
        name="Voice Test Mahindra 575 DI",
        category=ResourceCategory.TRACTOR,
        description="Reliable farming tractor",
        supported_operations=["ploughing", "tilling"],
        price_per_unit=600.0,
        pricing_unit=PricingUnit.PER_HOUR,
        location_name="Mandya",
        latitude=12.52,
        longitude=76.89,
        service_radius_km=30.0,
        owner_id=1,
    )
    db_session.add(tractor)
    db_session.commit()

    # 2. Register & login a test farmer
    register_data = {
        "email": "voice_farmer@bhumisetu.org",
        "full_name": "Farmer Basavaraj",
        "phone_number": "+919888877777",
        "role": "farmer",
        "preferred_language": "kn",
        "password": "Password123"
    }
    client.post("/api/v1/auth/register", json=register_data)
    login_res = client.post("/api/v1/auth/login", json={"email": "voice_farmer@bhumisetu.org", "password": "Password123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Test Search Intent in English
    interact_search = {
        "message": "I need a tractor for ploughing in Mandya",
        "language": "en"
    }
    res_search = client.post("/api/v1/voice/interact", json=interact_search, headers=headers)
    assert res_search.status_code == 200
    search_data = res_search.json()
    assert search_data["action_taken"] == "RESOURCES_FOUND"
    assert len(search_data["data"]["resources"]) > 0

    # 4. Test Search & Draft Intent in Kannada
    interact_draft_kn = {
        "message": "ನನಗೆ ಉಳುಮೆ ಮಾಡಲು ಟ್ರ್ಯಾಕ್ಟರ್ ಬುಕ್ ಮಾಡಿ",
        "language": "kn"
    }
    res_draft = client.post("/api/v1/voice/interact", json=interact_draft_kn, headers=headers)
    assert res_draft.status_code == 200
    draft_data = res_draft.json()
    assert draft_data["requires_confirmation"] is True
    assert draft_data["draft_summary"] is not None
    draft_id = draft_data["draft_summary"]["draft_id"]

    # 5. Test Explicit Spoken / Button Confirmation
    confirm_payload = {
        "draft_id": draft_id,
        "confirmation_phrase": "ಹೌದು ಖಚಿತಪಡಿಸಿ"
    }
    res_conf = client.post("/api/v1/voice/confirm", json=confirm_payload, headers=headers)
    assert res_conf.status_code == 200
    conf_data = res_conf.json()
    assert "booking_id" in conf_data
    assert conf_data["status"] == "submitted"


def test_farmvoice_advanced_offline_and_priority_intents(client):
    # Register & login test user
    email = "voice_advanced@bhumisetu.org"
    client.post("/api/v1/auth/register", json={
        "email": email,
        "full_name": "Voice Advanced Farmer",
        "phone_number": "+919876543210",
        "role": "farmer",
        "preferred_language": "en",
        "password": "Password123"
    })
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": "Password123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Voice offline sync status inquiry
    res_sync = client.post("/api/v1/voice/interact", json={
        "message": "Sync my pending offline requests",
        "language": "en"
    }, headers=headers)
    assert res_sync.status_code == 200
    assert res_sync.json()["action_taken"] == "OFFLINE_SYNC_STATUS"
    assert "IndexedDB" in res_sync.json()["reply_text"]

    # 2. Voice priority score inquiry
    res_prio = client.post("/api/v1/voice/interact", json={
        "message": "What is the priority score of my booking?",
        "language": "en"
    }, headers=headers)
    assert res_prio.status_code == 200
    assert res_prio.json()["action_taken"] == "PRIORITY_SCORE_INFO"
    assert "AI priority score" in res_prio.json()["reply_text"]

    # 3. Voice weather inquiry
    res_weather = client.post("/api/v1/voice/interact", json={
        "message": "Is the weather suitable for spraying?",
        "language": "en"
    }, headers=headers)
    assert res_weather.status_code == 200
    assert res_weather.json()["action_taken"] == "WEATHER_SUITABILITY_INFO"

    # 4. Voice confirmation reason inquiry
    res_conf = client.post("/api/v1/voice/interact", json={
        "message": "Why was my request not confirmed?",
        "language": "en"
    }, headers=headers)
    assert res_conf.status_code == 200
    assert res_conf.json()["action_taken"] == "CONFIRMATION_EXPLANATION"
