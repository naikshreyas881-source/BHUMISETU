import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MarketplacePage } from '../pages/MarketplacePage';
import { BookingModal } from '../components/marketplace/BookingModal';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../i18n/LanguageContext';
import { LocationProvider } from '../context/LocationContext';
import type { Resource } from '../types/marketplace';

const mockResource: Resource = {
  id: 1,
  owner_id: 2,
  name: 'Mahindra 575 DI Tractor (47 HP)',
  category: 'tractor',
  description: 'Reliable 47 HP agricultural tractor equipped with heavy-duty rotavator.',
  supported_operations: ['ploughing', 'tilling'],
  price_per_unit: 650.0,
  pricing_unit: 'per_hour',
  location_name: 'Mandya Town, Karnataka',
  latitude: 12.5218,
  longitude: 76.8951,
  service_radius_km: 30.0,
  is_verified: true,
  is_active: true,
  is_demo: true,
  rating: 4.9,
  total_reviews: 38,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('Marketplace Components Verification', () => {
  it('renders marketplace search filters and category chips', () => {
    render(
      <LanguageProvider>
        <LocationProvider>
          <AuthProvider>
            <BrowserRouter>
              <MarketplacePage />
            </BrowserRouter>
          </AuthProvider>
        </LocationProvider>
      </LanguageProvider>
    );

    expect(screen.getByPlaceholderText(/Search by machinery name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
    expect(screen.getByText('Tractors')).toBeInTheDocument();
    expect(screen.getByText('Combine Harvesters')).toBeInTheDocument();
  });

  it('renders booking modal with estimated price calculation and confirmation workflow', () => {
    render(
      <LanguageProvider>
        <BookingModal
          resource={mockResource}
          isOpen={true}
          onClose={() => {}}
          onSuccess={() => {}}
        />
      </LanguageProvider>
    );

    expect(screen.getByText('Mahindra 575 DI Tractor (47 HP)')).toBeInTheDocument();
    expect(screen.getByText(/Review & Confirm Request/i)).toBeInTheDocument();
    expect(screen.getByText(/Estimated Rental Cost/i)).toBeInTheDocument();
  });
});
