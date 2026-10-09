import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriorityMeter, type PriorityData } from '../components/coordination/PriorityMeter';

const mockHighPriorityData: PriorityData = {
  overall_score: 84.5,
  breakdown: {
    urgency: {
      score: 25.0,
      max_weight: 25.0,
      explanation: 'Critical agronomic urgency: emergency booking window.',
      data_source: 'booking_request',
    },
    weather_risk: {
      score: 21.0,
      max_weight: 25.0,
      explanation: 'Rain predicted (78% probability, 32mm) in 36 hours. Harvesting window is immediate.',
      data_source: 'live_weather_imd',
    },
    crop_readiness: {
      score: 18.5,
      max_weight: 20.0,
      explanation: 'Crop at mature harvesting stage; delay risks lodging.',
      data_source: 'crop_profile',
    },
    farm_impact: {
      score: 8.0,
      max_weight: 10.0,
      explanation: 'Medium farm acreage (4.5 acres) requiring timely coverage.',
      data_source: 'farm_profile',
    },
    deadline_proximity: {
      score: 8.0,
      max_weight: 10.0,
      explanation: 'Requested start time within 24 hours.',
      data_source: 'schedule_analysis',
    },
    soil_trafficability: {
      score: 4.0,
      max_weight: 10.0,
      explanation: 'Dry soil condition with optimal machine trafficability.',
      data_source: 'soil_moisture_estimate',
    },
  },
  plain_language_explanation:
    'High priority recommendation: Imminent heavy monsoon rainfall (32mm) threatens lodging for mature paddy. Harvesting equipment allocation is strongly prioritized.',
  missing_information: [],
  limitations: ['Weather data valid for 48 hours.'],
};

const mockLowPriorityData: PriorityData = {
  overall_score: 35.0,
  breakdown: {
    urgency: {
      score: 5.0,
      max_weight: 25.0,
      explanation: 'Routine advance booking request.',
      data_source: 'booking_request',
    },
    weather_risk: {
      score: 12.5,
      max_weight: 25.0,
      explanation: 'No extreme precipitation forecast.',
      data_source: 'weather_baseline',
    },
  },
  plain_language_explanation:
    'Routine priority request: Weather conditions are stable and schedule window is flexible over the next 10 days.',
};

describe('Coordination Engine Frontend Verification', () => {
  it('renders PriorityMeter with score, status badge and plain language explanation', () => {
    render(<PriorityMeter priority={mockHighPriorityData} />);

    expect(screen.getByText(/Explainable Priority Score/i)).toBeInTheDocument();
    expect(screen.getByText('84.5 / 100')).toBeInTheDocument();
    expect(screen.getByText('Urgency')).toBeInTheDocument();
    expect(screen.getByText('25/25')).toBeInTheDocument();
    expect(screen.getByText('Weather')).toBeInTheDocument();
    expect(screen.getByText('21/25')).toBeInTheDocument();
    expect(screen.getByText(/High priority recommendation: Imminent heavy monsoon rainfall/i)).toBeInTheDocument();
  });

  it('renders low priority scores with appropriate score display', () => {
    render(<PriorityMeter priority={mockLowPriorityData} />);

    expect(screen.getByText('35 / 100')).toBeInTheDocument();
    expect(screen.getByText(/Routine priority request: Weather conditions are stable/i)).toBeInTheDocument();
  });

  it('renders loading state when agronomic computation is pending', () => {
    render(<PriorityMeter priority={null} isLoading={true} />);

    expect(screen.getByText(/Computing agronomic priority assessment.../i)).toBeInTheDocument();
  });

  it('returns null when no priority data is provided and not loading', () => {
    const { container } = render(<PriorityMeter priority={null} isLoading={false} />);
    expect(container.firstChild).toBeNull();
  });
});
