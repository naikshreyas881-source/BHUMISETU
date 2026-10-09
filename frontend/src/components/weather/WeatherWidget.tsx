import React, { useEffect, useState } from 'react';
import { CloudRain, Wind, Droplets, Thermometer, AlertTriangle, ShieldCheck } from 'lucide-react';
import apiClient from '../../api/client';
import { useLanguage } from '../../i18n/LanguageContext';

export interface WeatherData {
  is_live: boolean;
  source: string;
  temperature_c: number | null;
  relative_humidity_pct: number | null;
  current_precipitation_mm: number | null;
  wind_speed_kmh: number | null;
  weather_condition: string;
  max_rain_probability_pct: number | null;
  total_expected_rainfall_mm: number | null;
  is_severe_alert: boolean;
  updated_at: string;
}

interface WeatherWidgetProps {
  latitude?: number;
  longitude?: number;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  latitude = 12.5218,
  longitude = 76.8951,
}) => {
  const { t } = useLanguage();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchWeather = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<WeatherData>('/weather/forecast', {
          params: { latitude, longitude },
        });
        if (isMounted) {
          setWeather(res.data);
        }
      } catch (err) {
        console.error('Weather fetch failed:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchWeather();
    return () => {
      isMounted = false;
    };
  }, [latitude, longitude]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-gray-200 animate-pulse text-xs text-gray-400 text-center">
        Loading live agricultural weather data...
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="bg-gradient-to-br from-emerald-900 to-forest-950 text-white rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CloudRain className="w-5 h-5 text-emerald-300" />
          <div>
            <h3 className="font-bold text-sm tracking-wide text-white">{t.weather.title}</h3>
            <p className="text-[11px] text-emerald-200/80">Mandya / Mysuru Basin • {weather.source}</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[11px] text-emerald-200 border border-white/10">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{weather.is_live ? 'Live Sensor Feed' : 'Baseline Fallback'}</span>
        </div>
      </div>

      {/* Severe Alert Warning */}
      {weather.is_severe_alert && (
        <div className="bg-amber-500/20 border border-amber-400/50 p-3 rounded-xl flex items-center space-x-2 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-300 flex-shrink-0" />
          <span>{t.weather.severeAlert}</span>
        </div>
      )}

      {/* Weather Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
          <div className="flex items-center space-x-1 text-emerald-300/80 text-[11px]">
            <Thermometer className="w-3.5 h-3.5" />
            <span>{t.weather.temp}</span>
          </div>
          <div className="text-lg font-bold text-white">
            {weather.temperature_c != null ? `${weather.temperature_c}°C` : '--'}
          </div>
          <div className="text-[10px] text-emerald-200/70">{weather.weather_condition}</div>
        </div>

        <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
          <div className="flex items-center space-x-1 text-sky-300/80 text-[11px]">
            <CloudRain className="w-3.5 h-3.5" />
            <span>{t.weather.rainProb}</span>
          </div>
          <div className="text-lg font-bold text-white">
            {weather.max_rain_probability_pct != null ? `${weather.max_rain_probability_pct}%` : '12.5%'}
          </div>
          <div className="text-[10px] text-emerald-200/70">
            {weather.total_expected_rainfall_mm != null ? `${weather.total_expected_rainfall_mm} mm expected` : 'Neutral Baseline'}
          </div>
        </div>

        <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
          <div className="flex items-center space-x-1 text-blue-300/80 text-[11px]">
            <Droplets className="w-3.5 h-3.5" />
            <span>{t.weather.humidity}</span>
          </div>
          <div className="text-lg font-bold text-white">
            {weather.relative_humidity_pct != null ? `${weather.relative_humidity_pct}%` : '--'}
          </div>
          <div className="text-[10px] text-emerald-200/70">Relative Humidity</div>
        </div>

        <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
          <div className="flex items-center space-x-1 text-teal-300/80 text-[11px]">
            <Wind className="w-3.5 h-3.5" />
            <span>Wind Speed</span>
          </div>
          <div className="text-lg font-bold text-white">
            {weather.wind_speed_kmh != null ? `${weather.wind_speed_kmh} km/h` : '--'}
          </div>
          <div className="text-[10px] text-emerald-200/70">Surface Wind</div>
        </div>
      </div>
    </div>
  );
};
