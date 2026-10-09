import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import httpx

logger = logging.getLogger(__name__)

OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast"

# WMO Weather interpretation codes
WEATHER_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
}

def interpret_weather_code(code: int) -> str:
    return WEATHER_CODES.get(code, "Cloudy / Variable")

def fetch_live_weather(latitude: float, longitude: float, timeout_sec: float = 4.0) -> Dict[str, Any]:
    """
    Fetches real-time weather and 48-hour precipitation forecast from Open-Meteo API.
    Does not invent data; on network failure returns transparent fallback with is_live=False.
    """
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
        "hourly": "precipitation_probability,rain",
        "forecast_days": 3,
        "timezone": "auto"
    }
    
    try:
        with httpx.Client(timeout=timeout_sec) as client:
            resp = client.get(OPEN_METEO_BASE_URL, params=params)
            if resp.status_code == 200:
                data = resp.json()
                current = data.get("current", {})
                hourly = data.get("hourly", {})
                
                # Calculate max 36-hour rain probability
                prob_list = hourly.get("precipitation_probability", [])[:36]
                rain_list = hourly.get("rain", [])[:36]
                
                max_rain_prob = max(prob_list) if prob_list else 0.0
                total_expected_rain_mm = sum(rain_list) if rain_list else 0.0
                w_code = current.get("weather_code", 0)
                is_severe = w_code in [65, 82, 95, 96, 99] or total_expected_rain_mm >= 35.0
                
                return {
                    "is_live": True,
                    "source": "Open-Meteo Meteorological Service",
                    "latitude": latitude,
                    "longitude": longitude,
                    "temperature_c": current.get("temperature_2m"),
                    "relative_humidity_pct": current.get("relative_humidity_2m"),
                    "current_precipitation_mm": current.get("precipitation", 0.0),
                    "wind_speed_kmh": current.get("wind_speed_10m"),
                    "weather_condition": interpret_weather_code(w_code),
                    "max_rain_probability_pct": float(max_rain_prob),
                    "total_expected_rainfall_mm": round(float(total_expected_rain_mm), 1),
                    "is_severe_alert": is_severe,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            else:
                logger.warning(f"Open-Meteo API returned status {resp.status_code}")
    except Exception as e:
        logger.warning(f"Open-Meteo API fetch failed: {e}. Using transparent baseline fallback.")

    # Transparent neutral baseline fallback (Rule 8 & 16: Never fabricate values)
    return {
        "is_live": False,
        "source": "Neutral Baseline (Meteorological API Offline)",
        "latitude": latitude,
        "longitude": longitude,
        "temperature_c": None,
        "relative_humidity_pct": None,
        "current_precipitation_mm": None,
        "wind_speed_kmh": None,
        "weather_condition": "Forecast unavailable",
        "max_rain_probability_pct": None,
        "total_expected_rainfall_mm": None,
        "is_severe_alert": False,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
