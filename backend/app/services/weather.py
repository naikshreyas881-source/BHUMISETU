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


def fetch_weather_forecast_for_window(
    latitude: float,
    longitude: float,
    start_time: datetime,
    duration_hours: float,
    timeout_sec: float = 4.0,
) -> Dict[str, Any]:
    """
    Fetches hourly forecast for the specific booking window [start_time, start_time + duration_hours].
    Also scans nearby time windows within the 7-day forecast horizon to provide alternative slots.
    Never fabricates values if beyond forecast horizon or if the meteorological API is unreachable.
    """
    now_utc = datetime.now(timezone.utc)
    # Ensure start_time is UTC aware
    if start_time.tzinfo is None:
        start_utc = start_time.replace(tzinfo=timezone.utc)
    else:
        start_utc = start_time.astimezone(timezone.utc)

    end_utc = start_utc + timedelta(hours=duration_hours)

    # Check forecast horizon: Open-Meteo standard high-res forecast covers up to 7 days
    days_ahead = (start_utc - now_utc).total_seconds() / 86400.0
    if days_ahead > 7.0:
        return {
            "is_forecast_available": False,
            "reason": f"Requested booking date is {round(days_ahead, 1)} days ahead, which exceeds the 7-day high-resolution meteorological forecast horizon.",
            "source": "Uncertainty Boundary (Beyond 7-Day Forecast)",
            "latitude": latitude,
            "longitude": longitude,
        }

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m",
        "forecast_days": 7,
        "timezone": "UTC",
    }

    try:
        with httpx.Client(timeout=timeout_sec) as client:
            resp = client.get(OPEN_METEO_BASE_URL, params=params)
            if resp.status_code == 200:
                data = resp.json()
                hourly = data.get("hourly", {})
                times_str = hourly.get("time", [])

                if not times_str:
                    return {
                        "is_forecast_available": False,
                        "reason": "Meteorological service returned empty hourly records.",
                    }

                # Parse times into datetime objects
                hourly_times = []
                for t_str in times_str:
                    try:
                        # Open-Meteo returns 'YYYY-MM-DDTHH:MM' in requested timezone (UTC)
                        dt = datetime.fromisoformat(t_str).replace(tzinfo=timezone.utc)
                        hourly_times.append(dt)
                    except Exception:
                        hourly_times.append(None)

                # Find indices matching booking interval [start_utc, end_utc]
                # Include any hour where interval intersects [dt, dt + 1 hour)
                window_indices = [
                    idx
                    for idx, dt in enumerate(hourly_times)
                    if dt and (start_utc <= dt < end_utc or (start_utc - timedelta(minutes=59) <= dt <= start_utc and duration_hours < 1.0))
                ]

                # Fallback to closest index if booking starts within forecast but duration is short
                if not window_indices and hourly_times:
                    closest_idx = min(
                        range(len(hourly_times)),
                        key=lambda i: abs((hourly_times[i] - start_utc).total_seconds()) if hourly_times[i] else float("inf")
                    )
                    time_diff_hours = abs((hourly_times[closest_idx] - start_utc).total_seconds()) / 3600.0
                    if time_diff_hours <= 2.0:
                        window_indices = [closest_idx]

                if not window_indices:
                    return {
                        "is_forecast_available": False,
                        "reason": "No forecast hourly steps overlapped with the selected booking date and time.",
                    }

                temps = [hourly["temperature_2m"][i] for i in window_indices if i < len(hourly.get("temperature_2m", []))]
                humidities = [hourly["relative_humidity_2m"][i] for i in window_indices if i < len(hourly.get("relative_humidity_2m", []))]
                rain_probs = [hourly["precipitation_probability"][i] for i in window_indices if i < len(hourly.get("precipitation_probability", []))]
                precips = [hourly["precipitation"][i] for i in window_indices if i < len(hourly.get("precipitation", []))]
                winds = [hourly["wind_speed_10m"][i] for i in window_indices if i < len(hourly.get("wind_speed_10m", []))]
                w_codes = [hourly["weather_code"][i] for i in window_indices if i < len(hourly.get("weather_code", []))]

                avg_temp = round(sum(temps) / len(temps), 1) if temps else 25.0
                max_temp = max(temps) if temps else avg_temp
                min_temp = min(temps) if temps else avg_temp
                avg_humidity = round(sum(humidities) / len(humidities), 1) if humidities else 60.0
                max_rain_prob = float(max(rain_probs)) if rain_probs else 0.0
                avg_rain_prob = round(float(sum(rain_probs) / len(rain_probs)), 1) if rain_probs else 0.0
                total_rain_mm = round(float(sum(precips)), 1) if precips else 0.0
                max_wind_kmh = float(max(winds)) if winds else 0.0
                avg_wind_kmh = round(float(sum(winds) / len(winds)), 1) if winds else 0.0
                primary_code = max(w_codes, key=lambda c: c if c is not None else 0) if w_codes else 0
                is_severe = primary_code in [65, 82, 95, 96, 99] or total_rain_mm >= 25.0

                # Discover alternative cleaner slots across the next 3 days
                alternative_slots = []
                dur_int = max(1, int(round(duration_hours)))
                for shift_days in [0, 1, 2]:
                    for shift_hour in [7, 13, 16]:
                        cand_start = (start_utc + timedelta(days=shift_days)).replace(hour=shift_hour, minute=0, second=0, microsecond=0)
                        if cand_start <= now_utc or cand_start == start_utc:
                            continue
                        cand_end = cand_start + timedelta(hours=duration_hours)
                        cand_indices = [
                            idx for idx, dt in enumerate(hourly_times)
                            if dt and cand_start <= dt < cand_end
                        ]
                        if cand_indices:
                            cand_rain_prob = max([hourly["precipitation_probability"][i] for i in cand_indices if i < len(hourly.get("precipitation_probability", []))] or [0])
                            cand_rain_mm = sum([hourly["precipitation"][i] for i in cand_indices if i < len(hourly.get("precipitation", []))] or [0])
                            cand_wind = max([hourly["wind_speed_10m"][i] for i in cand_indices if i < len(hourly.get("wind_speed_10m", []))] or [0])
                            if cand_rain_prob < 30 and cand_wind < 18.0 and cand_rain_mm < 2.0:
                                slot_label = cand_start.strftime("%a %d %b, %H:%M UTC")
                                alternative_slots.append({
                                    "start_time": cand_start.isoformat(),
                                    "end_time": cand_end.isoformat(),
                                    "label": slot_label,
                                    "rain_prob_pct": cand_rain_prob,
                                    "wind_speed_kmh": round(cand_wind, 1),
                                    "expected_rain_mm": round(cand_rain_mm, 1),
                                })
                                if len(alternative_slots) >= 3:
                                    break
                    if len(alternative_slots) >= 3:
                        break

                return {
                    "is_forecast_available": True,
                    "source": "Open-Meteo Meteorological Service",
                    "latitude": latitude,
                    "longitude": longitude,
                    "temperature_c": avg_temp,
                    "min_temperature_c": min_temp,
                    "max_temperature_c": max_temp,
                    "relative_humidity_pct": avg_humidity,
                    "max_rain_probability_pct": max_rain_prob,
                    "avg_rain_probability_pct": avg_rain_prob,
                    "total_expected_rainfall_mm": total_rain_mm,
                    "max_wind_speed_kmh": max_wind_kmh,
                    "avg_wind_speed_kmh": avg_wind_kmh,
                    "weather_condition": interpret_weather_code(primary_code),
                    "weather_code": primary_code,
                    "is_severe_alert": is_severe,
                    "alternative_slots": alternative_slots,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            else:
                logger.warning(f"Open-Meteo window query returned status {resp.status_code}")
    except Exception as e:
        logger.warning(f"Failed to query Open-Meteo window forecast: {e}")

    return {
        "is_forecast_available": False,
        "reason": "Meteorological forecast service temporarily unavailable. No fabricated data presented.",
        "source": "Neutral Baseline (Meteorological API Offline)",
        "latitude": latitude,
        "longitude": longitude,
    }

