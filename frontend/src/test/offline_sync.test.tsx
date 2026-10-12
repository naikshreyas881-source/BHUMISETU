import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OfflineBanner } from '../components/common/OfflineBanner';
import { OfflineRequestsDrawer } from '../components/common/OfflineRequestsDrawer';
import { OfflineContext } from '../context/OfflineContext';
import { BrowserRouter } from 'react-router-dom';

describe('Offline Mode & Synchronization UI', () => {
  const mockContextValue = {
    isOnline: false,
    isBackendReachable: false,
    lastSyncTime: '2026-10-12T18:00:00Z',
    connectionStatusMessage: 'Network disconnected. Running in offline mode.',
    offlineBookings: [
      {
        id: 'off_req_123',
        idempotency_key: 'idemp_1234567890',
        resource_id: 1,
        resource_name: 'Mahindra 575 DI Tractor',
        farm_id: 1,
        farm_name: 'Mandya Farm',
        operation: 'ploughing',
        start_time: '2026-10-14T08:00:00Z',
        end_time: '2026-10-14T12:00:00Z',
        duration_hours: 4.0,
        estimated_cost: 2400,
        created_at: '2026-10-12T18:00:00Z',
        sync_status: 'saved_locally' as const,
        retry_count: 0,
        last_sync_attempt: null,
        error_message: null,
        server_booking_id: null,
        notes: 'Need early morning',
      },
      {
        id: 'off_req_456',
        idempotency_key: 'idemp_9876543210',
        resource_id: 2,
        resource_name: 'DJI Agras T40 Drone',
        farm_id: 1,
        farm_name: 'Mandya Farm',
        operation: 'spraying',
        start_time: '2026-10-15T09:00:00Z',
        end_time: '2026-10-15T11:00:00Z',
        duration_hours: 2.0,
        estimated_cost: 3200,
        created_at: '2026-10-12T18:05:00Z',
        sync_status: 'sync_failed' as const,
        retry_count: 1,
        last_sync_attempt: '2026-10-12T18:10:00Z',
        error_message: 'Scheduling conflict detected: This machinery was reserved while you were offline.',
        server_booking_id: null,
        notes: undefined,
        alternative_slots: [
          {
            start_time: '2026-10-16T09:00:00Z',
            end_time: '2026-10-16T11:00:00Z',
            display: 'Thu, 16 Oct, 09:00',
          },
        ],
      },
    ],
    pendingCount: 2,
    isSyncing: false,
    syncProgress: null,
    saveBookingOffline: vi.fn(),
    triggerSync: vi.fn(),
    checkReachability: vi.fn(),
    removeOfflineBooking: vi.fn(),
    updateOfflineBookingNotes: vi.fn(),
    retryBooking: vi.fn(),
  };

  it('renders offline warning banner when disconnected with pending count', () => {
    render(
      <OfflineContext.Provider value={mockContextValue}>
        <OfflineBanner />
      </OfflineContext.Provider>
    );

    expect(screen.getByText('OFFLINE MODE')).toBeInTheDocument();
    expect(screen.getByText(/2 Pending/i)).toBeInTheDocument();
  });

  it('renders offline requests drawer with status badges and conflict alternative slots', () => {
    render(
      <BrowserRouter>
        <OfflineContext.Provider value={mockContextValue}>
          <OfflineRequestsDrawer isOpen={true} onClose={vi.fn()} />
        </OfflineContext.Provider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Offline Requests Queue/i)).toBeInTheDocument();
    expect(screen.getByText('Mahindra 575 DI Tractor')).toBeInTheDocument();
    expect(screen.getByText('DJI Agras T40 Drone')).toBeInTheDocument();
    expect(screen.getByText(/Saved Locally/i)).toBeInTheDocument();
    expect(screen.getByText(/Sync Failed/i)).toBeInTheDocument();
    expect(screen.getByText(/Scheduling conflict detected/i)).toBeInTheDocument();
    expect(screen.getByText(/Thu, 16 Oct, 09:00/i)).toBeInTheDocument();
  });
});
