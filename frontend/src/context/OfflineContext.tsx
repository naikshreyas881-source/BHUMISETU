import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import apiClient from '../api/client';
import {
  offlineStorage,
  type OfflineBookingRequest,
} from '../services/offlineStorage';

interface OfflineContextType {
  isOnline: boolean;
  isBackendReachable: boolean;
  lastSyncTime: string | null;
  pendingCount: number;
  isSyncing: boolean;
  syncProgress: { current: number; total: number } | null;
  offlineBookings: OfflineBookingRequest[];
  connectionStatusMessage: string | null;
  saveBookingOffline: (
    bookingData: Omit<OfflineBookingRequest, 'id' | 'created_at' | 'sync_status'>
  ) => Promise<OfflineBookingRequest>;
  triggerSync: () => Promise<{ success: number; failed: number }>;
  removeOfflineBooking: (id: string) => Promise<void>;
  updateOfflineBookingNotes: (id: string, notes: string) => Promise<void>;
  retryBooking: (id: string) => Promise<void>;
  checkReachability: () => Promise<boolean>;
}

export const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isBackendReachable, setIsBackendReachable] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [offlineBookings, setOfflineBookings] = useState<OfflineBookingRequest[]>(
    []
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [connectionStatusMessage, setConnectionStatusMessage] = useState<
    string | null
  >(null);

  const isSyncingRef = useRef(false);

  // Load existing offline requests and last sync timestamp from IndexedDB
  const refreshOfflineBookings = useCallback(async () => {
    try {
      const list = await offlineStorage.getAllBookings();
      setOfflineBookings(list);
      const syncTs = await offlineStorage.getMetadata<string>('last_sync_timestamp');
      if (syncTs) {
        setLastSyncTime(syncTs);
      }
    } catch (err) {
      console.warn('[BHUMISETU] Failed to refresh offline bookings:', err);
    }
  }, []);

  // Ping backend to verify genuine reachability
  const checkReachability = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) {
      setIsBackendReachable(false);
      return false;
    }
    try {
      // Use lightweight health check
      const res = await apiClient.get('/health', { timeout: 3500 });
      const reachable = res.status === 200;
      setIsBackendReachable(reachable);
      return reachable;
    } catch {
      setIsBackendReachable(false);
      return false;
    }
  }, []);

  // Count requests that are waiting for sync or failed
  const pendingCount = offlineBookings.filter(
    (b) =>
      b.sync_status === 'saved_locally' ||
      b.sync_status === 'waiting_sync' ||
      b.sync_status === 'sync_failed'
  ).length;

  // Execute synchronization of a single request
  const syncSingleBooking = async (
    b: OfflineBookingRequest
  ): Promise<'success' | 'failed'> => {
    // 1. Mark as awaiting server validation
    await offlineStorage.updateBooking(b.id, {
      sync_status: 'validating_server',
      last_sync_attempt: new Date().toISOString(),
      error_message: null,
    });
    await refreshOfflineBookings();

    try {
      // 2. Submit to backend with original idempotency key
      const payload = {
        resource_id: b.resource_id,
        farm_id: b.farm_id,
        operation: b.operation,
        start_time: b.start_time,
        duration_hours: b.duration_hours,
        idempotency_key: b.idempotency_key,
        notes: b.notes ? `[Offline Sync] ${b.notes}` : '[Offline Sync]',
      };

      const res = await apiClient.post('/bookings/', payload, { timeout: 8000 });
      const serverBooking = res.data;

      // 3. Check status returned by authoritative backend
      if (
        serverBooking &&
        (serverBooking.status === 'confirmed' ||
          serverBooking.status === 'submitted' ||
          serverBooking.status === 'pending_approval')
      ) {
        const isConfirmed = serverBooking.status === 'confirmed';
        await offlineStorage.updateBooking(b.id, {
          sync_status: isConfirmed ? 'confirmed_server' : 'pending_approval',
          server_booking_id: serverBooking.id,
          server_status: serverBooking.status,
          error_message: null,
        });
        return 'success';
      }

      // If rejected or status not confirmed
      await offlineStorage.updateBooking(b.id, {
        sync_status: 'rejected_server',
        error_message:
          serverBooking.rejection_reason ||
          'Booking was not confirmed by the coordination engine.',
      });
      return 'failed';
    } catch (err: any) {
      let errMsg = 'Server connection failed during synchronization.';
      let altSlots: any[] = [];

      if (err.response?.status === 409 || err.response?.data?.detail?.includes('conflict')) {
        errMsg =
          err.response?.data?.detail ||
          'Scheduling conflict detected: This machinery was reserved while you were offline.';
        altSlots = err.response?.data?.alternative_slots || [];
      } else if (err.response?.data?.detail) {
        errMsg = err.response.data.detail;
      }

      await offlineStorage.updateBooking(b.id, {
        sync_status: 'sync_failed',
        error_message: errMsg,
        alternative_slots: altSlots,
      });
      return 'failed';
    }
  };

  // Synchronize all eligible pending requests
  const triggerSync = useCallback(async (): Promise<{
    success: number;
    failed: number;
  }> => {
    if (isSyncingRef.current) return { success: 0, failed: 0 };
    isSyncingRef.current = true;
    setIsSyncing(true);

    try {
      // 1. Verify reachability
      const reachable = await checkReachability();
      if (!reachable) {
        setConnectionStatusMessage(
          'Synchronization paused: Backend is not reachable.'
        );
        return { success: 0, failed: 0 };
      }

      // 2. Fetch fresh queue from IndexedDB
      const allBookings = await offlineStorage.getAllBookings();
      const eligible = allBookings.filter(
        (b) =>
          b.sync_status === 'saved_locally' ||
          b.sync_status === 'waiting_sync' ||
          b.sync_status === 'sync_failed'
      );

      if (eligible.length === 0) {
        const nowIso = new Date().toISOString();
        await offlineStorage.setMetadata('last_sync_timestamp', nowIso);
        setLastSyncTime(nowIso);
        return { success: 0, failed: 0 };
      }

      setSyncProgress({ current: 0, total: eligible.length });

      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < eligible.length; i++) {
        setSyncProgress({ current: i + 1, total: eligible.length });
        const result = await syncSingleBooking(eligible[i]);
        if (result === 'success') {
          successCount++;
        } else {
          failedCount++;
        }
      }

      const syncTimestamp = new Date().toISOString();
      await offlineStorage.setMetadata('last_sync_timestamp', syncTimestamp);
      setLastSyncTime(syncTimestamp);

      if (successCount > 0 && failedCount === 0) {
        setConnectionStatusMessage(
          `Successfully synchronized ${successCount} offline request(s)!`
        );
      } else if (failedCount > 0) {
        setConnectionStatusMessage(
          `Sync completed: ${successCount} confirmed/submitted, ${failedCount} require review.`
        );
      }

      await refreshOfflineBookings();
      return { success: successCount, failed: failedCount };
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
      isSyncingRef.current = false;
    }
  }, [checkReachability, refreshOfflineBookings]);

  // Save a new booking locally while offline
  const saveBookingOffline = async (
    bookingData: Omit<OfflineBookingRequest, 'id' | 'created_at' | 'sync_status'>
  ): Promise<OfflineBookingRequest> => {
    const uniqueId = `off_req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const newRequest: OfflineBookingRequest = {
      ...bookingData,
      id: uniqueId,
      created_at: new Date().toISOString(),
      sync_status: 'saved_locally',
    };

    const saved = await offlineStorage.saveBooking(newRequest);
    await refreshOfflineBookings();

    // If online & backend reachable, trigger automatic sync in background
    if (navigator.onLine && isBackendReachable) {
      setTimeout(() => triggerSync(), 500);
    }

    return saved;
  };

  // Remove an unsynced or archived booking
  const removeOfflineBooking = async (id: string): Promise<void> => {
    await offlineStorage.deleteBooking(id);
    await refreshOfflineBookings();
  };

  // Update notes of an offline booking
  const updateOfflineBookingNotes = async (
    id: string,
    notes: string
  ): Promise<void> => {
    await offlineStorage.updateBooking(id, { notes });
    await refreshOfflineBookings();
  };

  // Retry an individual failed booking
  const retryBooking = async (id: string): Promise<void> => {
    const booking = await offlineStorage.getBookingById(id);
    if (!booking) return;

    await offlineStorage.updateBooking(id, {
      sync_status: 'waiting_sync',
      error_message: null,
    });
    await refreshOfflineBookings();
    await triggerSync();
  };

  // Online / Offline window listeners
  useEffect(() => {
    refreshOfflineBookings();

    const handleOnline = async () => {
      setIsOnline(true);
      setConnectionStatusMessage('Internet connection restored. Verifying server...');
      const reachable = await checkReachability();
      if (reachable) {
        setConnectionStatusMessage('Connection active. Starting automatic synchronization...');
        await triggerSync();
      } else {
        setConnectionStatusMessage('Connected to network, but backend server is not responding.');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsBackendReachable(false);
      setConnectionStatusMessage(
        'Offline Mode active. All new booking requests will be saved locally.'
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkReachability();

    // Periodic heartbeat every 60s
    const heartbeat = setInterval(() => {
      if (navigator.onLine) {
        checkReachability();
      }
    }, 60000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(heartbeat);
    };
  }, [checkReachability, refreshOfflineBookings, triggerSync]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isBackendReachable,
        lastSyncTime,
        pendingCount,
        isSyncing,
        syncProgress,
        offlineBookings,
        connectionStatusMessage,
        saveBookingOffline,
        triggerSync,
        removeOfflineBooking,
        updateOfflineBookingNotes,
        retryBooking,
        checkReachability,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (!context) {
    return {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isBackendReachable: true,
      lastSyncTime: null,
      pendingCount: 0,
      isSyncing: false,
      syncProgress: null,
      offlineBookings: [],
      connectionStatusMessage: null,
      saveBookingOffline: async (b) => ({ ...b, id: 'temp', created_at: new Date().toISOString(), sync_status: 'saved_locally', retry_count: 0 }),
      triggerSync: async () => ({ success: 0, failed: 0 }),
      removeOfflineBooking: async () => {},
      updateOfflineBookingNotes: async () => {},
      retryBooking: async () => {},
      checkReachability: async () => true,
    };
  }
  return context;
};
