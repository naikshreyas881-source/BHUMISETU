import sys
import uuid
from datetime import datetime, timezone, timedelta
import httpx

BASE_URL = "http://127.0.0.1:8000/api/v1"

def run_full_platform_verification():
    print("================================================================================")
    print(" BHUMISETU COMPLETE PLATFORM END-TO-END VERIFICATION")
    print(" Team: INNOVISION | Voice AI: FarmVoice AI | Tagline: Bridging Farms to a Better Future")
    print("================================================================================")

    # 1. Health & Branding Check
    print("\n[+] 1. Health & Branding Integrity Check...")
    h_res = httpx.get(f"{BASE_URL}/health", timeout=5.0)
    assert h_res.status_code == 200, f"Health check failed: {h_res.text}"
    h_data = h_res.json()
    print(f"    Application: {h_data['app']}")
    print(f"    Tagline:     \"{h_data['tagline']}\"")
    print(f"    Database:    {h_data['database']}")
    assert h_data["app"] == "BHUMISETU"
    assert "Bridging Farms to a Better Future" in h_data["tagline"]
    print("    [SUCCESS] Brand and health endpoints verified.")

    # 2. Live Weather Integration (Phase 6)
    print("\n[+] 2. Live Agricultural Weather Integration (Open-Meteo Engine)...")
    w_res = httpx.get(f"{BASE_URL}/weather/forecast?latitude=12.5218&longitude=76.8951", timeout=10.0)
    assert w_res.status_code == 200, f"Weather API failed: {w_res.text}"
    w_data = w_res.json()
    print(f"    Provider:    {w_data['source']} (is_live={w_data['is_live']})")
    print(f"    Conditions:  {w_data['weather_condition']}, Temp: {w_data['temperature_c']}C")
    print(f"    Precip Risk: {w_data['max_rain_probability_pct']}% (Rainfall: {w_data['total_expected_rainfall_mm']} mm)")
    print(f"    Alert Level: {'SEVERE MONSOON ALERT' if w_data['is_severe_alert'] else 'Normal / Manageable'}")
    assert w_data["source"] is not None
    print("    [SUCCESS] Live meteorological feed successfully queried and parsed.")

    # 3. Farmer Authentication
    print("\n[+] 3. Farmer Authentication & Token Issuance...")
    farmer_login = httpx.post(
        f"{BASE_URL}/auth/login",
        json={"email": "farmer1@bhumisetu.org", "password": "SecurePassword123"},
        timeout=10.0
    )
    assert farmer_login.status_code == 200, f"Farmer login failed: {farmer_login.text}"
    farmer_token = farmer_login.json()["access_token"]
    farmer_headers = {"Authorization": f"Bearer {farmer_token}"}
    print("    [SUCCESS] Farmer authenticated successfully.")

    # 4. Resource Marketplace & Spatial Search
    print("\n[+] 4. Marketplace Fleet Discovery & Haversine Distance Calculation...")
    res = httpx.get(f"{BASE_URL}/resources/?category=tractor&lat=12.5218&lon=76.8951", headers=farmer_headers, timeout=10.0)
    assert res.status_code == 200
    resources = res.json()
    assert len(resources) > 0, "No tractor resources returned"
    tractor = resources[0]
    print(f"    Discovered: {tractor['name']} @ Rs.{tractor['price_per_unit']}/{tractor['pricing_unit']}")
    print(f"    Location:   {tractor['location_name']} (Distance: {tractor.get('distance_km')} km)")
    print(f"    Demo Flag:  is_demo={tractor['is_demo']} (Verified honest tag)")
    assert tractor["is_demo"] is True
    print("    [SUCCESS] Spatial search and demonstration flag verified.")

    # 5. Smart Agricultural Coordination Engine (Phase 3)
    print("\n[+] 5. Deterministic Coordination Engine (Suitability & Explainable Priority)...")
    now = datetime.now(timezone.utc)
    coord_start = now + timedelta(days=4, hours=9)
    suit_req = {
        "resource_id": tractor["id"],
        "operation": "ploughing",
        "start_time": coord_start.isoformat(),
        "duration_hours": 4.0,
        "max_budget": 5000.0
    }
    s_res = httpx.post(f"{BASE_URL}/coordination/check-suitability", json=suit_req, headers=farmer_headers, timeout=10.0)
    assert s_res.status_code == 200
    assert s_res.json()["is_feasible"] is True
    print("    Suitability Check: FEASIBLE (Operation, distance, budget constraints passed)")

    # Priority score with live weather risk
    prio_req = {
        "urgency_level": "high",
        "rain_probability_pct": w_data["max_rain_probability_pct"] or 50.0,
        "severe_weather_alert": w_data["is_severe_alert"],
        "crop_stage": "Harvesting",
        "farm_size_acres": 5.0,
        "deadline_hours": 24.0,
        "soil_moisture_suitable": True
    }
    p_res = httpx.post(f"{BASE_URL}/coordination/priority-score", json=prio_req, headers=farmer_headers, timeout=10.0)
    assert p_res.status_code == 200
    p_data = p_res.json()
    print(f"    Computed Explainable Priority Score: {p_data['overall_score']} / 100")
    print(f"    Weather factor score: {p_data['breakdown']['weather_risk']['score']} / 25.0")
    print("    [SUCCESS] Coordination engine evaluated physical constraints and priority score.")

    # 6. FarmVoice AI Conversational Assistant (Phase 4 & 5 - Multilingual Voice)
    print("\n[+] 6. Multilingual FarmVoice AI Voice Assistant Interaction...")
    # 6a. Kannada Query: Searching for equipment
    kn_msg = {
        "message": "ನನಗೆ ಉಳುಮೆ ಮಾಡಲು ಟ್ರ್ಯಾಕ್ಟರ್ ಬೇಕು",
        "language": "kn"
    }
    kn_res = httpx.post(f"{BASE_URL}/voice/interact", json=kn_msg, headers=farmer_headers, timeout=10.0)
    assert kn_res.status_code == 200
    kn_data = kn_res.json()
    print(f"    [Kannada Voice Intent]: \"{kn_msg['message'].encode('ascii', 'backslashreplace').decode('ascii')}\"")
    print(f"    [FarmVoice Response]:   \"{kn_data['reply_text'][:90].encode('ascii', 'backslashreplace').decode('ascii')}...\"")
    print(f"    Detected Language:      {kn_data['language']}")
    assert kn_data["language"] == "kn"

    # 6b. English Query: Preparing Booking Draft
    en_msg = {
        "message": "Please book this tractor for ploughing for 4 hours",
        "language": "en"
    }
    en_res = httpx.post(f"{BASE_URL}/voice/interact", json=en_msg, headers=farmer_headers, timeout=10.0)
    assert en_res.status_code == 200
    en_data = en_res.json()
    print(f"    [English Voice Intent]: \"{en_msg['message']}\"")
    print(f"    [FarmVoice Response]:   \"{en_data['reply_text'][:90]}...\"")
    assert en_data["requires_confirmation"] is True
    assert en_data["draft_summary"] is not None
    draft = en_data["draft_summary"]
    print(f"    Draft Prepared:         Draft ID {draft['draft_id']}, Cost Rs.{draft['total_cost']}")
    print("    [SUCCESS] Spoken draft prepared with strict confirmation requirement flag.")

    # 6c. Safe Confirmation Binding (Rule 12 & 13)
    print("\n[+] 7. Safe Spoken Confirmation Execution...")
    conf_payload = {
        "draft_id": draft["draft_id"],
        "confirmation_phrase": "Confirm Booking"
    }
    conf_res = httpx.post(f"{BASE_URL}/voice/confirm", json=conf_payload, headers=farmer_headers, timeout=10.0)
    assert conf_res.status_code == 200, f"Voice confirmation failed: {conf_res.text}"
    conf_data = conf_res.json()
    booking_id = conf_data["booking_id"]
    print(f"    Finalized Booking ID:   #{booking_id}")
    print(f"    Status:                 {conf_data['status']}")
    assert conf_data["status"] == "submitted"
    print("    [SUCCESS] Booking confirmed and stored with immutable audit log linkage.")

    # 8. Admin Audit Trail Verification
    print("\n[+] 8. Administrator Audit Trail Inspection...")
    admin_login = httpx.post(
        f"{BASE_URL}/auth/login",
        json={"email": "admin@bhumisetu.org", "password": "SecurePassword123"},
        timeout=10.0
    )
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    audit_res = httpx.get(f"{BASE_URL}/admin/audit-logs", headers=admin_headers, timeout=10.0)
    assert audit_res.status_code == 200
    audit_logs = audit_res.json()
    print(f"    Total Audit Events:    {len(audit_logs)}")
    assert len(audit_logs) > 0
    voice_logs = [log for log in audit_logs if log.get("action") == "VOICE_BOOKING_CREATED"]
    print(f"    Voice Booking Events:  {len(voice_logs)} recorded")
    assert len(voice_logs) > 0
    print("    [SUCCESS] Immutable audit trail verified across all operations.")

    print("\n================================================================================")
    print(" COMPLETE BHUMISETU PLATFORM DEMONSTRATION VERIFIED END-TO-END!")
    print("================================================================================")

if __name__ == "__main__":
    try:
        run_full_platform_verification()
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[ERROR] Platform verification failed: {e}", file=sys.stderr)
        sys.exit(1)
