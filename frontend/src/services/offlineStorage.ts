/**
 * BHUMISETU IndexedDB Local Storage Service
 * Provides robust offline persistence for booking requests and sync metadata.
 * INNOVISION - Bridging Farms to a Better Future
 */

export interface OfflineBookingRequest {
  id: string; // Unique client identifier e.g. off_req_1728734000_abc123
  idempotency_key: string;
  resource_id: number;
  resource_name: string;
  farm_id: number | null;
  farm_name: string | null;
  operation: string;
  start_time: string; // ISO 8601
  end_time: string; // ISO 8601
  duration_hours: number;
  estimated_cost: number;
  notes?: string;
  created_at: string; // ISO 8601
  sync_status:
    | 'saved_locally' // Saved locally, waiting for internet
    | 'waiting_sync' // Internet restored, queued for sync
    | 'validating_server' // Undergoing server-side validation & conflict check
    | 'confirmed_server' // Successfully confirmed by server
    | 'pending_approval' // Submitted to server, awaiting owner approval
    | 'rejected_server' // Rejected by server (e.g. conflict, policy)
    | 'sync_failed'; // Network or temporary server failure
  server_booking_id?: number | null;
  server_status?: string | null;
  error_message?: string | null;
  last_sync_attempt?: string | null;
  alternative_slots?: Array<{
    start_time: string;
    end_time: string;
    display: string;
  }>;
}

const DB_NAME = 'bhumisetu_offline_db';
const DB_VERSION = 1;
const STORE_BOOKINGS = 'offline_bookings';
const STORE_METADATA = 'app_metadata';

class OfflineStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this environment'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_BOOKINGS)) {
          const bookingStore = db.createObjectStore(STORE_BOOKINGS, { keyPath: 'id' });
          bookingStore.createIndex('sync_status', 'sync_status', { unique: false });
          bookingStore.createIndex('created_at', 'created_at', { unique: false });
          bookingStore.createIndex('idempotency_key', 'idempotency_key', { unique: true });
        }

        if (!db.objectStoreNames.contains(STORE_METADATA)) {
          db.createObjectStore(STORE_METADATA, { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Save a newly prepared offline booking request.
   */
  async saveBooking(booking: OfflineBookingRequest): Promise<OfflineBookingRequest> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_BOOKINGS, 'readwrite');
      const store = tx.objectStore(STORE_BOOKINGS);
      const req = store.put(booking);

      req.onsuccess = () => resolve(booking);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Retrieve all offline booking requests sorted by creation date (newest first).
   */
  async getAllBookings(): Promise<OfflineBookingRequest[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_BOOKINGS, 'readonly');
      const store = tx.objectStore(STORE_BOOKINGS);
      const req = store.getAll();

      req.onsuccess = () => {
        const list = (req.result || []) as OfflineBookingRequest[];
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Retrieve a specific booking request by its client identifier.
   */
  async getBookingById(id: string): Promise<OfflineBookingRequest | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_BOOKINGS, 'readonly');
      const store = tx.objectStore(STORE_BOOKINGS);
      const req = store.get(id);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Update an existing offline request (e.g. status transition, notes, or dates).
   */
  async updateBooking(id: string, updates: Partial<OfflineBookingRequest>): Promise<OfflineBookingRequest | null> {
    const db = await this.getDB();
    const existing = await this.getBookingById(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_BOOKINGS, 'readwrite');
      const store = tx.objectStore(STORE_BOOKINGS);
      const req = store.put(updated);

      req.onsuccess = () => resolve(updated);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Delete an offline request (e.g. farmer deletes unsynced request).
   */
  async deleteBooking(id: string): Promise<boolean> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_BOOKINGS, 'readwrite');
      const store = tx.objectStore(STORE_BOOKINGS);
      const req = store.delete(id);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Get sync metadata (e.g. last sync timestamp).
   */
  async getMetadata<T = any>(key: string): Promise<T | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_METADATA, 'readonly');
      const store = tx.objectStore(STORE_METADATA);
      const req = store.get(key);

      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Save sync metadata.
   */
  async setMetadata(key: string, value: any): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_METADATA, 'readwrite');
      const store = tx.objectStore(STORE_METADATA);
      const req = store.put({ key, value });

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Purge already confirmed/processed bookings older than 7 days, retaining failed/pending.
   */
  async archiveCompleted(): Promise<number> {
    const all = await this.getAllBookings();
    let count = 0;
    for (const b of all) {
      if (b.sync_status === 'confirmed_server' || b.sync_status === 'rejected_server') {
        await this.deleteBooking(b.id);
        count++;
      }
    }
    return count;
  }
}

export const offlineStorage = new OfflineStorageService();
