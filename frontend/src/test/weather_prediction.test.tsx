import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  WeatherPredictionCard,
  type WeatherPredictionData,
} from '../components/coordination/WeatherPredictionCard';


describe('WeatherPredictionCard Component', () => {
  it('renders highly suitable weather condition score (80–100)', () => {
    const data: WeatherPredictionData = {
      score: 95,
      risk_category: 'Highly Suitable',
      factors: [],
      expected_weather: {
        temperature_c: 24.5,
        relative_humidity_pct: 60,
        max_rain_probability_pct: 10,
        total_expected_rainfall_mm: 0,
        wind_speed_kmh: 8.5,
        weather_condition: 'Mainly clear',
        is_severe_alert: false,
      },
      plain_language_explanation: 'Optimal weather conditions for tractor operations.',
      suggested_alternatives: [],
      is_limited_prediction: false,
      limitations: ['Soil moisture inferred from precipitation'],
      equipment_category: 'tractor',
      operation: 'ploughing',
    };

    render(<WeatherPredictionCard prediction={data} />);

    expect(screen.getByText('Highly Suitable')).toBeInTheDocument();
    expect(screen.getByText('95')).toBeInTheDocument();
    expect(screen.getByText('24.5°C')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(screen.getByText(/Optimal weather conditions for tractor/i)).toBeInTheDocument();
  });

  it('renders high risk weather condition score (0–39) with factors and alternative shifts', () => {
    const onApply = vi.fn();
    const data: WeatherPredictionData = {
      score: 35,
      risk_category: 'High Risk',
      factors: [
        {
          factor: 'High Wind Speed (Spray Drift)',
          penalty: 45,
          detail: 'Forecasted wind of 25 km/h causes severe spray drift.',
          severity: 'high',
        },
        {
          factor: 'Rain Wash-off Hazard',
          penalty: 40,
          detail: 'Expected rain will wash chemical off foliar canopy.',
          severity: 'high',
        },
      ],
      expected_weather: {
        temperature_c: 29.0,
        relative_humidity_pct: 85,
        max_rain_probability_pct: 80,
        total_expected_rainfall_mm: 6.5,
        wind_speed_kmh: 25.0,
        weather_condition: 'Thunderstorm',
        is_severe_alert: true,
      },
      plain_language_explanation: 'High weather risk for spraying due to 25 km/h wind and 80% rain probability.',
      suggested_alternatives: [
        {
          start_time: '2026-10-12T07:00:00Z',
          end_time: '2026-10-12T11:00:00Z',
          label: 'Sun 12 Oct, 07:00 UTC',
          rain_prob_pct: 5,
          wind_speed_kmh: 7.2,
          expected_rain_mm: 0.0,
        },
      ],
      is_limited_prediction: false,
      limitations: [],
      equipment_category: 'drone',
      operation: 'spraying',
    };

    render(<WeatherPredictionCard prediction={data} onApplyAlternative={onApply} />);

    expect(screen.getByText('High Risk')).toBeInTheDocument();
    expect(screen.getByText('35')).toBeInTheDocument();
    expect(screen.getByText('High Wind Speed (Spray Drift)')).toBeInTheDocument();
    expect(screen.getByText('-45 pts')).toBeInTheDocument();
    expect(screen.getByText('Rain Wash-off Hazard')).toBeInTheDocument();

    // Check alternative button click
    const altBtn = screen.getByText(/Sun 12 Oct, 07:00 UTC/i);
    expect(altBtn).toBeInTheDocument();
    fireEvent.click(altBtn);
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith(data.suggested_alternatives![0]);
  });

  it('renders transparent limited prediction when booking is beyond 7 days', () => {
    const data: WeatherPredictionData = {
      score: null,
      risk_category: 'Limited Prediction / Unverified Horizon',
      factors: [],
      expected_weather: {
        temperature_c: null,
        relative_humidity_pct: null,
        max_rain_probability_pct: null,
        total_expected_rainfall_mm: null,
        wind_speed_kmh: null,
        weather_condition: 'Forecast unavailable',
        is_severe_alert: false,
      },
      plain_language_explanation: 'Booking date exceeds 7-day high resolution forecast horizon. No fabricated data presented.',
      suggested_alternatives: [],
      is_limited_prediction: true,
      limitations: ['Date exceeds meteorological horizon'],
      equipment_category: 'harvester',
      operation: 'harvesting',
    };

    render(<WeatherPredictionCard prediction={data} />);

    expect(screen.getByText('Unverified Horizon')).toBeInTheDocument();
    expect(screen.getByText(/No fabricated data presented/i)).toBeInTheDocument();
  });

  it('renders compact mode properly', () => {
    const data: WeatherPredictionData = {
      score: 72,
      risk_category: 'Generally Suitable',
      factors: [],
      expected_weather: {
        temperature_c: 26.0,
        relative_humidity_pct: 65,
        max_rain_probability_pct: 20,
        total_expected_rainfall_mm: 0.2,
        wind_speed_kmh: 12.0,
        weather_condition: 'Partly cloudy',
        is_severe_alert: false,
      },
      plain_language_explanation: 'Generally suitable with minor breeze.',
      suggested_alternatives: [],
      is_limited_prediction: false,
      equipment_category: 'tractor',
      operation: 'tilling',
    };

    render(<WeatherPredictionCard prediction={data} compact={true} />);

    expect(screen.getByText(/72\/100 • Generally Suitable/i)).toBeInTheDocument();
    expect(screen.getByText(/26°C • 20% Rain/i)).toBeInTheDocument();
  });
});
