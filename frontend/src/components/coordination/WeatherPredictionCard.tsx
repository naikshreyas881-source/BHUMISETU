import React from 'react';
import {
  CloudRain,
  Wind,
  Thermometer,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export interface WeatherPredictionFactor {
  factor: string;
  penalty: number;
  detail: string;
  severity: string;
}

export interface ExpectedWeather {
  temperature_c: number | null;
  relative_humidity_pct: number | null;
  max_rain_probability_pct: number | null;
  total_expected_rainfall_mm: number | null;
  wind_speed_kmh: number | null;
  weather_condition: string;
  is_severe_alert: boolean;
}

export interface WeatherAlternativeSlot {
  start_time: string;
  end_time: string;
  label: string;
  rain_prob_pct: number;
  wind_speed_kmh: number;
  expected_rain_mm: number;
}

export interface WeatherPredictionData {
  score: number | null;
  risk_category: string;
  factors: WeatherPredictionFactor[];
  expected_weather: ExpectedWeather;
  plain_language_explanation: string;
  suggested_alternatives?: WeatherAlternativeSlot[];
  is_limited_prediction: boolean;
  limitations?: string[];
  equipment_category: string;
  operation: string;
}

interface WeatherPredictionCardProps {
  prediction: WeatherPredictionData | null;
  isLoading?: boolean;
  onApplyAlternative?: (slot: WeatherAlternativeSlot) => void;
  compact?: boolean;
}

export const WeatherPredictionCard: React.FC<WeatherPredictionCardProps> = ({
  prediction,
  isLoading,
  onApplyAlternative,
  compact = false,
}) => {
  if (isLoading) {
    return (
      <div className="p-3.5 rounded-2xl bg-forest-50/70 border border-leaf-200 animate-pulse text-xs text-forest-800 flex items-center space-x-2">
        <div className="w-3.5 h-3.5 border-2 border-leaf-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
        <span>Evaluating hourly weather forecast & agronomic booking suitability...</span>
      </div>
    );
  }

  if (!prediction) return null;

  const {
    score,
    risk_category,
    factors,
    expected_weather,
    plain_language_explanation,
    suggested_alternatives,
    is_limited_prediction,
    limitations,
  } = prediction;

  // Determine color scheme based on 4 explicit bands
  const getBandStyles = () => {
    if (is_limited_prediction || score === null) {
      return {
        badgeBg: 'bg-gray-100 text-gray-700 border-gray-300',
        scoreColor: 'text-gray-600',
        borderColor: 'border-gray-200',
        bg: 'bg-gray-50/80',
        pillBg: 'bg-gray-100 border-gray-200 text-gray-700',
        icon: <Info className="w-4 h-4 text-gray-500" />,
      };
    }
    if (score >= 80) {
      return {
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        scoreColor: 'text-emerald-700',
        borderColor: 'border-emerald-200',
        bg: 'bg-emerald-50/50',
        pillBg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      };
    }
    if (score >= 60) {
      return {
        badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
        scoreColor: 'text-blue-700',
        borderColor: 'border-blue-200',
        bg: 'bg-blue-50/50',
        pillBg: 'bg-blue-50 border-blue-200 text-blue-900',
        icon: <CheckCircle2 className="w-4 h-4 text-blue-600" />,
      };
    }
    if (score >= 40) {
      return {
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
        scoreColor: 'text-amber-700',
        borderColor: 'border-amber-200',
        bg: 'bg-amber-50/60',
        pillBg: 'bg-amber-50 border-amber-200 text-amber-900',
        icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
      };
    }
    return {
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
      scoreColor: 'text-rose-700',
      borderColor: 'border-rose-200',
      bg: 'bg-rose-50/60',
      pillBg: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: <AlertCircle className="w-4 h-4 text-rose-600" />,
    };
  };

  const styles = getBandStyles();

  if (compact) {
    return (
      <div className={`px-2.5 py-1.5 rounded-xl border ${styles.borderColor} ${styles.bg} text-xs flex items-center justify-between`}>
        <div className="flex items-center space-x-1.5">
          {styles.icon}
          <span className="font-bold text-gray-800">
            Weather Suitability:
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${styles.badgeBg}`}>
            {is_limited_prediction || score === null ? 'Seasonal Horizon' : `${Math.round(score)}/100 • ${risk_category}`}
          </span>
        </div>
        {expected_weather.temperature_c !== null && (
          <span className="text-[11px] text-gray-600 font-semibold">
            {expected_weather.temperature_c}°C • {expected_weather.max_rain_probability_pct ?? 0}% Rain
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border ${styles.borderColor} ${styles.bg} p-4 text-xs space-y-3.5 shadow-xs transition-all`}>
      {/* Header with Score and Risk Category */}
      <div className="flex items-start justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-forest-700" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-forest-800">
              Weather-Based Booking Prediction
            </span>
          </div>
          <h4 className="font-extrabold text-sm text-gray-900 flex items-center space-x-2">
            <span>{risk_category}</span>
          </h4>
        </div>

        <div className="text-right">
          {is_limited_prediction || score === null ? (
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-black border ${styles.badgeBg}`}>
              Unverified Horizon
            </span>
          ) : (
            <div className="flex items-baseline space-x-1">
              <span className={`text-2xl font-black ${styles.scoreColor}`}>
                {Math.round(score)}
              </span>
              <span className="text-gray-400 font-bold text-xs">/100</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Gauge */}
      {!is_limited_prediction && score !== null && (
        <div className="space-y-1">
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-blue-500' : score >= 40 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.max(5, Math.min(100, score))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 font-medium">
            <span>High Risk (0–39)</span>
            <span>Moderate (40–59)</span>
            <span>Suitable (60–79)</span>
            <span>Optimal (80–100)</span>
          </div>
        </div>
      )}

      {/* Expected Weather Metrics Breakdown */}
      {expected_weather.temperature_c !== null ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
          <div className={`p-2 rounded-xl border ${styles.pillBg} flex items-center space-x-2`}>
            <Thermometer className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <div>
              <span className="text-[10px] text-gray-500 block leading-tight">Temp</span>
              <span className="font-extrabold text-gray-800 text-[11px]">
                {expected_weather.temperature_c}°C
              </span>
            </div>
          </div>

          <div className={`p-2 rounded-xl border ${styles.pillBg} flex items-center space-x-2`}>
            <CloudRain className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
            <div>
              <span className="text-[10px] text-gray-500 block leading-tight">Rain Prob</span>
              <span className="font-extrabold text-gray-800 text-[11px]">
                {expected_weather.max_rain_probability_pct ?? 0}%
              </span>
            </div>
          </div>

          <div className={`p-2 rounded-xl border ${styles.pillBg} flex items-center space-x-2`}>
            <Droplets className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
            <div>
              <span className="text-[10px] text-gray-500 block leading-tight">Rainfall</span>
              <span className="font-extrabold text-gray-800 text-[11px]">
                {expected_weather.total_expected_rainfall_mm ?? 0} mm
              </span>
            </div>
          </div>

          <div className={`p-2 rounded-xl border ${styles.pillBg} flex items-center space-x-2`}>
            <Wind className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
            <div>
              <span className="text-[10px] text-gray-500 block leading-tight">Wind</span>
              <span className="font-extrabold text-gray-800 text-[11px]">
                {expected_weather.wind_speed_kmh ?? 0} km/h
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-2.5 rounded-xl bg-gray-100 border border-gray-200 text-[11px] text-gray-600 flex items-center space-x-2">
          <Info className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span>Live meteorological forecast is beyond the 7-day high-resolution horizon or unavailable.</span>
        </div>
      )}

      {/* Agronomic Constraints / Factors */}
      {factors.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-extrabold text-gray-700 uppercase tracking-wider block">
            Agronomic Weather Factors
          </span>
          <div className="space-y-1">
            {factors.map((f, i) => (
              <div
                key={i}
                className="p-2 rounded-xl bg-white/80 border border-gray-200 flex items-start justify-between space-x-2"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-gray-900 block text-[11px]">
                    {f.factor}
                  </span>
                  <p className="text-[10px] text-gray-600 leading-tight">
                    {f.detail}
                  </p>
                </div>
                <span className="text-[11px] font-black text-rose-600 whitespace-nowrap">
                  -{f.penalty} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plain Language Agronomic Explanation */}
      <div className="bg-white/90 p-2.5 rounded-xl border border-gray-200/80 text-[11px] text-gray-700 leading-relaxed">
        <span className="font-bold text-gray-900 mr-1">Agronomic Advice:</span>
        {plain_language_explanation}
      </div>

      {/* Limitations / Sensor Transparency */}
      {limitations && limitations.length > 0 && (
        <div className="text-[10px] text-gray-500 italic flex items-center space-x-1.5">
          <Info className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <span>Transparency Note: {limitations[0]}</span>
        </div>
      )}

      {/* Alternative Window Recommendations */}
      {suggested_alternatives && suggested_alternatives.length > 0 && (
        <div className="pt-2 border-t border-gray-200/70 space-y-1.5">
          <div className="flex items-center space-x-1 text-gray-700">
            <Calendar className="w-3.5 h-3.5 text-forest-700" />
            <span className="font-bold text-[11px]">
              Suggested Cleaner Booking Shifts (Low Weather Risk):
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggested_alternatives.slice(0, 2).map((alt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onApplyAlternative?.(alt)}
                className="px-2.5 py-1 bg-white hover:bg-forest-50 border border-forest-300 text-forest-900 rounded-lg text-[10px] font-bold transition-all shadow-2xs text-left flex items-center space-x-1 cursor-pointer"
              >
                <span>✓ {alt.label}</span>
                <span className="text-[9px] text-forest-600 font-normal">
                  ({alt.rain_prob_pct}% rain, {alt.wind_speed_kmh} km/h)
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Advisory Non-Blocking Disclaimer */}
      <p className="text-[9px] text-gray-400 text-center">
        Advisory decision-support only. This prediction does not automatically confirm, reject, cancel, or alter bookings.
      </p>
    </div>
  );
};
