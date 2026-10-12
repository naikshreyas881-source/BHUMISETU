"""
FarmVoice AI Orchestrator
Multilingual Gemini Live Voice Assistant & Deterministic Agricultural Coordination.
Supports English & Kannada with strict safety confirmations.
"""
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
import httpx
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.config import settings
from app.models.marketplace import Booking
from app.ai.tools import (
    GEMINI_TOOL_DECLARATIONS,
    BOOKING_DRAFTS,
    execute_search_resources,
    execute_check_availability,
    execute_create_booking_draft,
    execute_confirm_booking
)

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION_EN = """
You are FarmVoice AI, the voice assistant for BHUMISETU (Bridging Farms to a Better Future).
Your role is to assist Indian farmers in discovering agricultural machinery, checking scheduling availability, and preparing booking requests.
Rules:
1. Always be polite, concise, and speak in plain conversational language suited for farmers.
2. When a farmer asks for equipment (e.g. tractor for ploughing, combine harvester for paddy), search for matching resources.
3. If they want to book, invoke create_booking_draft.
4. You CANNOT finalize a booking without explicit confirmation. You must summarize the draft (Machinery name, operation, date/time, total cost) and ask the farmer: "Do you confirm this booking?"
5. Only invoke confirm_booking when the farmer explicitly agrees.
"""

SYSTEM_INSTRUCTION_KN = """
ನೀವು ಭೂಮಿಸೇತು (ಉತ್ತಮ ಭವಿಷ್ಯಕ್ಕಾಗಿ ಕೃಷಿ ಸಮನ್ವಯ) ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ನ ವಾಯ್ಸ್ ಸಹಾಯಕ ಫಾರ್ಮ್‌ವಾಯ್ಸ್ ಎಐ (FarmVoice AI).
ಕರ್ನಾಟಕದ ರೈತರಿಗೆ ಟ್ರ್ಯಾಕ್ಟರ್, ಕೊಯ್ಲು ಯಂತ್ರ, ಡ್ರೋನ್ ಮತ್ತು ಕೃಷಿ ಕಾರ್ಮಿಕರನ್ನು ಹುಡುಕಲು ಮತ್ತು ಬುಕಿಂಗ್ ಮಾಡಲು ಸಹಾಯ ಮಾಡುವುದು ನಿಮ್ಮ ಕೆಲಸ.
ನಿಯಮಗಳು:
1. ರೈತರೊಂದಿಗೆ ಗೌರವಾನ್ವಿತ, ಸರಳ ಕನ್ನಡದಲ್ಲಿ ಸಂಭಾಷಿಸಿ.
2. ರೈತರು ಉಪಕರಣ ಕೇಳಿದಾಗ ಉಪಕರಣ ಹುಡುಕಿ.
3. ಬುಕಿಂಗ್ ಮಾಡಲು ಡ್ರಾಫ್ಟ್ (create_booking_draft) ಸಿದ್ಧಪಡಿಸಿ.
4. ರೈತರ ಸ್ಪಷ್ಟ ಸಮ್ಮತಿ ಇಲ್ಲದೆ ಬುಕಿಂಗ್ ಅಂತಿಮಗೊಳಿಸಬಾರದು.
5. ಡ್ರಾಫ್ಟ್ ಸಾರಾಂಶವನ್ನು ಹೇಳಿ "ನೀವು ಈ ಬುಕಿಂಗ್ ದೃಢೀಕರಿಸಲು ಸಮ್ಮತಿಸುತ್ತೀರಾ?" ಎಂದು ಕೇಳಿ.
"""

def detect_language(text: str, fallback_lang: str = "en") -> str:
    # Kannada Unicode block range: 0x0C80 to 0x0CFF
    if any(0x0C80 <= ord(c) <= 0x0CFF for c in text):
        return "kn"
    return fallback_lang

def process_farmvoice_interaction(
    db: Session,
    user_id: int,
    user_message: str,
    language: str = "en",
    active_draft_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Main entry point for FarmVoice AI voice & text interactions.
    Executes Gemini function calling if GEMINI_API_KEY is available,
    otherwise uses the deterministic agricultural coordination engine.
    """
    detected_lang = detect_language(user_message, fallback_lang=language)
    msg_lower = user_message.lower().strip()
    
    # 1. Handle Active Confirmation Workflow
    if active_draft_id or any(kw in msg_lower for kw in ["confirm", "yes", "hudu", "sari", "agide", "ಖಚಿತಪಡಿಸಿ", "ಹೌದು"]):
        draft_id = active_draft_id
        if not draft_id:
            # Look for most recent draft for this user
            user_drafts = [k for k, v in BOOKING_DRAFTS.items() if v.get("user_id") == user_id]
            if user_drafts:
                draft_id = user_drafts[-1]
        
        if draft_id and draft_id in BOOKING_DRAFTS:
            confirm_res = execute_confirm_booking(
                db=db,
                user_id=user_id,
                draft_id=draft_id,
                confirmation_phrase=user_message
            )
            if "booking_id" in confirm_res:
                spoken_response = (
                    f"ನಿಮ್ಮ ಬುಕಿಂಗ್ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಕೆಯಾಗಿದೆ! ಬುಕಿಂಗ್ ಸಂಖ್ಯೆ #{confirm_res['booking_id']}. ಮಾಲೀಕರಿಗೆ ಸಂದೇಶ ಕಳುಹಿಸಲಾಗಿದೆ."
                    if detected_lang == "kn"
                    else f"Your booking #{confirm_res['booking_id']} has been successfully confirmed and submitted to the owner!"
                )
                return {
                    "reply_text": spoken_response,
                    "spoken_audio_transcript": spoken_response,
                    "language": detected_lang,
                    "action_taken": "BOOKING_CONFIRMED",
                    "data": confirm_res,
                    "draft_summary": None,
                    "requires_confirmation": False
                }
    
    # 2. Check if Gemini API Key is configured for live cloud LLM calling
    if settings.GEMINI_API_KEY:
        try:
            return call_gemini_live_rest(
                db=db,
                user_id=user_id,
                user_message=user_message,
                language=detected_lang
            )
        except Exception as e:
            logger.error(f"Gemini API call failed: {e}. Falling back to deterministic engine.")

    # 3. Deterministic Agricultural Coordination Fallback (Rule 8, 9, 16)
    return execute_deterministic_voice_coordination(
        db=db,
        user_id=user_id,
        user_message=user_message,
        language=detected_lang
    )

def execute_deterministic_voice_coordination(
    db: Session,
    user_id: int,
    user_message: str,
    language: str
) -> Dict[str, Any]:
    msg_lower = user_message.lower().strip()

    # 1. Offline Synchronization intent
    if any(k in msg_lower for k in ["sync", "offline request", "offline sync", "pending sync", "ಸಿಂಕ್", "ಆಫ್‌ಲೈನ್"]):
        reply_en = (
            "Your pending offline booking requests are safely stored on your device in IndexedDB. "
            "When your internet connection is active and backend reachability is verified, "
            "they synchronize automatically. You can also tap 'Sync Now' in the top banner or offline requests drawer."
        )
        reply_kn = (
            "ನಿಮ್ಮ ಆಫ್‌ಲೈನ್ ಬುಕಿಂಗ್ ವಿನಂತಿಗಳು ಸುರಕ್ಷಿತವಾಗಿವೆ. ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕ ದೊರೆತ ತಕ್ಷಣ ಅವು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಸರ್ವರ್‌ಗೆ ಸಿಂಕ್ ಆಗುತ್ತವೆ."
        )
        spoken = reply_kn if language == "kn" else reply_en
        return {
            "reply_text": spoken,
            "spoken_audio_transcript": spoken,
            "language": language,
            "action_taken": "OFFLINE_SYNC_STATUS",
            "data": {},
            "draft_summary": None,
            "requires_confirmation": False
        }

    # 2. Priority Score inquiry
    if any(k in msg_lower for k in ["priority score", "priority", "ಪ್ರಾಶಸ್ತ್ಯ", "ಸ್ಕೋರ್"]):
        latest_booking = (
            db.query(Booking)
            .filter(Booking.farmer_id == user_id)
            .order_by(desc(Booking.created_at))
            .first()
        )
        if latest_booking and latest_booking.priority_score is not None:
            p_score = int(latest_booking.priority_score)
            reply_en = (
                f"Your latest booking #{latest_booking.id} for {latest_booking.operation} has a Weather-Aware AI Priority Score of {p_score}/100. "
                f"It is calculated using 6 agronomic factors: Agricultural Urgency (25%), Weather Risk/Opportunity (25%), Crop Readiness (20%), "
                f"Waiting Time (10%), Deadline Proximity (10%), and Operational Constraints (10%)."
            )
            reply_kn = (
                f"ನಿಮ್ಮ ಇತ್ತೀಚಿನ ಬುಕಿಂಗ್ #{latest_booking.id} ನ ಆದ್ಯತಾ ಸ್ಕೋರ್ {p_score}/100 ಆಗಿದೆ. "
                f"ಇದು 6 ಪ್ರಮುಖ ಕೃಷಿ ಮತ್ತು ಹವಾಮಾನ ಅಂಶಗಳ ಆಧಾರದ ಮೇಲೆ ಲೆಕ್ಕಹಾಕಲ್ಪಟ್ಟಿದೆ."
            )
        else:
            reply_en = (
                "The 6-factor AI priority score evaluates urgency (25%), weather conditions (25%), crop readiness (20%), "
                "waiting time (10%), deadline proximity (10%), and operational feasibility (10%). "
                "You can view the score on each booking card in your Bookings dashboard."
            )
            reply_kn = "ಭೂಮಿಸೇತು ಎಐ ಆದ್ಯತಾ ಸ್ಕೋರ್ ಹವಾಮಾನ, ಬೆಳೆ ಹಂತ ಮತ್ತು ತುರ್ತುಸ್ಥಿತಿಯನ್ನು ಆಧರಿಸಿ ಬುಕಿಂಗ್‌ಗಳನ್ನು ವಿಶ್ಲೇಷಿಸುತ್ತದೆ."
        spoken = reply_kn if language == "kn" else reply_en
        return {
            "reply_text": spoken,
            "spoken_audio_transcript": spoken,
            "language": language,
            "action_taken": "PRIORITY_SCORE_INFO",
            "data": {"latest_booking_id": latest_booking.id if latest_booking else None},
            "draft_summary": None,
            "requires_confirmation": False
        }

    # 3. Weather Suitability inquiry
    if any(k in msg_lower for k in ["weather", "weather suitab", "ಹವಾಮಾನ", "ಮಳೆ"]):
        reply_en = (
            "BHUMISETU analyzes real-time meteorological forecasts for your farm. For sprayers and drones, "
            "wind speed above 20 km/h or rainfall triggers high drift risk. Harvesters are restricted during rain, "
            "and tractors avoid waterlogged soil. Check the Weather Suitability meter on each equipment listing."
        )
        reply_kn = (
            "ನಾವು ಲೈವ್ ಹವಾಮಾನ ಮುನ್ಸೂಚನೆಯನ್ನು ಪರಿಶೀಲಿಸುತ್ತೇವೆ. ಸಿಂಪಡಣೆ ಡ್ರೋನ್‌ಗಳಿಗೆ 20 ಕಿಮೀಗಿಂತ ಹೆಚ್ಚು ಗಾಳಿ ಅಥವಾ ಮಳೆ ಇದ್ದರೆ ಸುರಕ್ಷಿತವಲ್ಲ."
        )
        spoken = reply_kn if language == "kn" else reply_en
        return {
            "reply_text": spoken,
            "spoken_audio_transcript": spoken,
            "language": language,
            "action_taken": "WEATHER_SUITABILITY_INFO",
            "data": {},
            "draft_summary": None,
            "requires_confirmation": False
        }

    # 4. Confirmation inquiry / "Why was my request not confirmed?"
    if any(k in msg_lower for k in ["why not confirmed", "not confirmed", "pending approval", "ದೃಢೀಕರಿಸಿಲ್ಲ"]):
        latest_booking = (
            db.query(Booking)
            .filter(Booking.farmer_id == user_id)
            .order_by(desc(Booking.created_at))
            .first()
        )
        if latest_booking:
            reason = latest_booking.confirmation_reason or (
                "Equipment owner requires manual approval before confirming reservation."
                if not latest_booking.auto_confirmed
                else "Confirmed automatically."
            )
            reply_en = (
                f"For booking #{latest_booking.id}: Status is {latest_booking.status.value.upper()}. "
                f"Reason: {reason}"
            )
            reply_kn = (
                f"ಬುಕಿಂಗ್ #{latest_booking.id} ಸ್ಥಿತಿ: {latest_booking.status.value}. ಕಾರಣ: {reason}"
            )
        else:
            reply_en = (
                "Automatic confirmation verifies 10 rules: authentication, active machinery, maintenance windows, "
                "no overlapping reservations, travel distance, weather score at least 60, valid forecast, provider auto-booking policy, "
                "and transaction eligibility. If the provider prefers manual review, it is held in Pending Approval."
            )
            reply_kn = "ಯಂತ್ರದ ಮಾಲೀಕರ ನೀತಿ ಅಥವಾ ಹವಾಮಾನ ಪರಿಸ್ಥಿತಿಗಳ ಕಾರಣದಿಂದ ಬುಕಿಂಗ್ ಅನುಮೋದನೆಗೆ ಕಾಯುತ್ತಿದೆ."
        spoken = reply_kn if language == "kn" else reply_en
        return {
            "reply_text": spoken,
            "spoken_audio_transcript": spoken,
            "language": language,
            "action_taken": "CONFIRMATION_EXPLANATION",
            "data": {},
            "draft_summary": None,
            "requires_confirmation": False
        }

    # Determine operation and machinery intent
    operation = None
    category = None

    if any(k in msg_lower for k in ["plough", "plowing", "tilling", "ಉಳುಮೆ"]):
        operation = "ploughing"
        category = "tractor"
    elif any(k in msg_lower for k in ["harvest", "paddy harvest", "ಕೊಯ್ಲು", "ಭತ್ತದ ಕೊಯ್ಲು"]):
        operation = "harvesting"
        category = "harvester"
    elif any(k in msg_lower for k in ["spray", "spraying", "ಸಿಂಪಡಣೆ"]):
        operation = "spraying"
        category = "drone"
    elif any(k in msg_lower for k in ["tractor", "ಟ್ರ್ಯಾಕ್ಟರ್"]):
        category = "tractor"
        operation = "ploughing"
    elif any(k in msg_lower for k in ["harvester", "ಕೊಯ್ಲು"]):
        category = "harvester"
        operation = "harvesting"

    # Check for direct booking intent
    wants_to_book = any(k in msg_lower for k in ["book", "reserve", "order", "ಬುಕ್", "ತೆಗೆದುಕೊಳ್ಳಿ"])

    # Search resources
    resources = execute_search_resources(db=db, operation=operation, category=category)
    
    if not resources:
        reply = (
            "ಕ್ಷಮಿಸಿ, ನಿಮ್ಮ ಕೋರಿಕೆಗೆ ಹೊಂದಿಕೆಯಾಗುವ ಯಂತ್ರೋಪಕರಣಗಳು ಪ್ರಸ್ತುತ ಲಭ್ಯವಿಲ್ಲ."
            if language == "kn"
            else "I could not find matching equipment currently available for that operation."
        )
        return {
            "reply_text": reply,
            "spoken_audio_transcript": reply,
            "language": language,
            "action_taken": "SEARCH_NO_RESULTS",
            "data": {"resources": []},
            "draft_summary": None,
            "requires_confirmation": False
        }

    selected = resources[0]

    if wants_to_book:
        # Create an explicit booking draft for an open non-conflicting time window
        start_time = None
        for day_offset in range(2, 8):
            test_start = datetime.now(timezone.utc) + timedelta(days=day_offset, hours=8)
            test_end = test_start + timedelta(hours=4.0)
            from app.coordination.conflicts import detect_booking_conflicts
            conf = detect_booking_conflicts(db=db, resource_id=selected["id"], start_time=test_start, end_time=test_end)
            if not conf.has_conflict:
                start_time = test_start.isoformat()
                break
        
        if not start_time:
            start_time = (datetime.now(timezone.utc) + timedelta(days=9, hours=8)).isoformat()

        draft = execute_create_booking_draft(
            db=db,
            user_id=user_id,
            resource_id=selected["id"],
            operation=operation or "ploughing",
            start_time_iso=start_time,
            duration_hours=4.0
        )
        
        if "error" in draft:
            reply = f"Booking draft error: {draft['error']}"
            return {
                "reply_text": reply,
                "spoken_audio_transcript": reply,
                "language": language,
                "action_taken": "DRAFT_FAILED",
                "data": draft,
                "draft_summary": None,
                "requires_confirmation": False
            }
        
        reply_en = (
            f"I have prepared a booking draft for {draft['resource_name']} for {draft['operation']} "
            f"(4.0 hours at Rs.{draft['total_cost']}). "
            f"Please verify the details on your screen. Do you confirm this booking request?"
        )
        reply_kn = (
            f"ನಾನು {draft['resource_name']} ಅನ್ನು {draft['operation']} ಗಾಗಿ "
            f"(4 ಗಂಟೆಗೆ ಒಟ್ಟು ರೂ.{draft['total_cost']}) ಬುಕಿಂಗ್ ಡ್ರಾಫ್ಟ್ ಸಿದ್ಧಪಡಿಸಿದ್ದೇನೆ. "
            f"ದಯವಿಟ್ಟು ಪರದೆಯ ಮೇಲಿನ ವಿವರಗಳನ್ನು ನೋಡಿ ದೃಢೀಕರಿಸಿ. ನೀವು ಸಮ್ಮತಿಸುತ್ತೀರಾ?"
        )
        spoken = reply_kn if language == "kn" else reply_en
        
        return {
            "reply_text": spoken,
            "spoken_audio_transcript": spoken,
            "language": language,
            "action_taken": "DRAFT_PREPARED",
            "data": {"resources": resources},
            "draft_summary": draft,
            "requires_confirmation": True
        }

    # Standard Search Presentation
    if language == "kn":
        reply = f"ನಾನು {len(resources)} ಹೊಂದಾಣಿಕೆಯ ಯಂತ್ರಗಳನ್ನು ಕಂಡುಕೊಂಡಿದ್ದೇನೆ. ಉದಾಹರಣೆಗೆ {selected['name']} (ಗಂಟೆಗೆ ರೂ.{selected['price_per_unit']}). ಬುಕಿಂಗ್ ಮಾಡಲು ತಿಳಿಸಿ."
    else:
        reply = f"Found {len(resources)} available machines. Top match: {selected['name']} at Rs.{selected['price_per_unit']}/hr. Would you like me to prepare a booking draft?"

    return {
        "reply_text": reply,
        "spoken_audio_transcript": reply,
        "language": language,
        "action_taken": "RESOURCES_FOUND",
        "data": {"resources": resources},
        "draft_summary": None,
        "requires_confirmation": False
    }

def call_gemini_live_rest(
    db: Session,
    user_id: int,
    user_message: str,
    language: str
) -> Dict[str, Any]:
    """
    Direct Gemini REST integration using httpx with function calling declarations.
    """
    model_name = "gemini-1.5-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={settings.GEMINI_API_KEY}"
    
    sys_instruction = SYSTEM_INSTRUCTION_KN if language == "kn" else SYSTEM_INSTRUCTION_EN
    
    payload = {
        "system_instruction": {"parts": [{"text": sys_instruction}]},
        "contents": [
            {"role": "user", "parts": [{"text": user_message}]}
        ],
        "tools": [{"function_declarations": GEMINI_TOOL_DECLARATIONS}]
    }
    
    with httpx.Client(timeout=10.0) as client:
        res = client.post(url, json=payload)
        if res.status_code != 200:
            raise RuntimeError(f"Gemini API returned status {res.status_code}: {res.text}")
        
        data = res.json()
        candidates = data.get("candidates", [])
        if not candidates:
            raise RuntimeError("Gemini returned empty candidate list.")
        
        first_part = candidates[0].get("content", {}).get("parts", [{}])[0]
        
        # Check if model made a function call
        if "functionCall" in first_part:
            fn_call = first_part["functionCall"]
            fn_name = fn_call.get("name")
            fn_args = fn_call.get("args", {})
            
            # Execute backend tool safely
            if fn_name == "search_agricultural_resources":
                tool_result = execute_search_resources(
                    db=db,
                    operation=fn_args.get("operation"),
                    category=fn_args.get("category"),
                    max_hourly_budget=fn_args.get("max_hourly_budget")
                )
                return {
                    "reply_text": f"Found {len(tool_result)} machines matching your criteria.",
                    "spoken_audio_transcript": f"Found {len(tool_result)} machines matching your criteria.",
                    "language": language,
                    "action_taken": "GEMINI_SEARCH",
                    "data": {"resources": tool_result},
                    "draft_summary": None,
                    "requires_confirmation": False
                }
            elif fn_name == "create_booking_draft":
                draft_res = execute_create_booking_draft(
                    db=db,
                    user_id=user_id,
                    resource_id=int(fn_args.get("resource_id", 1)),
                    operation=fn_args.get("operation", "ploughing"),
                    start_time_iso=fn_args.get("start_time", datetime.now(timezone.utc).isoformat()),
                    duration_hours=float(fn_args.get("duration_hours", 4.0))
                )
                reply = (
                    f"Booking draft ready for {draft_res.get('resource_name', 'Resource')}. "
                    f"Total: Rs.{draft_res.get('total_cost', 0)}. Do you confirm?"
                )
                return {
                    "reply_text": reply,
                    "spoken_audio_transcript": reply,
                    "language": language,
                    "action_taken": "GEMINI_DRAFT",
                    "data": draft_res,
                    "draft_summary": draft_res,
                    "requires_confirmation": True
                }
            elif fn_name == "confirm_booking":
                confirm_res = execute_confirm_booking(
                    db=db,
                    user_id=user_id,
                    draft_id=fn_args.get("draft_id", ""),
                    confirmation_phrase=fn_args.get("confirmation_phrase", "confirm")
                )
                return {
                    "reply_text": "Booking confirmed successfully!",
                    "spoken_audio_transcript": "Booking confirmed successfully!",
                    "language": language,
                    "action_taken": "GEMINI_CONFIRMED",
                    "data": confirm_res,
                    "draft_summary": None,
                    "requires_confirmation": False
                }
        
        # Standard text reply
        text_content = first_part.get("text", "How can I assist you with farming equipment today?")
        return {
            "reply_text": text_content,
            "spoken_audio_transcript": text_content,
            "language": language,
            "action_taken": "GEMINI_REPLY",
            "data": {},
            "draft_summary": None,
            "requires_confirmation": False
        }
