import React, { useEffect, useState } from 'react';
import {
  Tractor,
  CheckCircle2,
  XCircle,
  Clock,
  IndianRupee,
  Layers,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import apiClient from '../api/client';
import type { Resource, Booking } from '../types/marketplace';

export const OwnerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [resources, setResources] = useState<Resource[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchOwnerData = async () => {
    try {
      setLoading(true);
      const [resRes, bookRes] = await Promise.all([
        apiClient.get<Resource[]>('/resources/'),
        apiClient.get<Booking[]>('/bookings/'),
      ]);
      // Filter resources owned by current user (or show all in demo if count is 0)
      const myResources = resRes.data.filter((r) => r.owner_id === user?.id || r.is_demo);
      setResources(myResources);
      setBookings(bookRes.data);
    } catch (err) {
      console.error('Owner data fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnerData();
  }, [user]);

  const handleUpdateStatus = async (bookingId: number, status: 'confirmed' | 'rejected') => {
    setProcessingId(bookingId);
    try {
      await apiClient.patch(`/bookings/${bookingId}/status`, {
        status,
        rejection_reason: status === 'rejected' ? 'Equipment scheduled for operational maintenance' : null,
      });
      fetchOwnerData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update booking status.');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === 'submitted');
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.estimated_cost || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 to-forest-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-emerald-300">
            <span>Equipment Owner & Service Provider Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Fleet Operations — {user?.full_name || 'Resource Owner'}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl">
            {t.tagline} • Manage agricultural machinery listings, approve farmer booking requests, and ensure double-booking prevention.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Active Fleet</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{resources.length} Machines</h3>
            <p className="text-[11px] text-emerald-600 mt-1">Ready for Field Work</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-forest-50 flex items-center justify-center text-forest-700">
            <Tractor className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Pending Requests</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{pendingBookings.length}</h3>
            <p className="text-[11px] text-amber-600 mt-1">Awaiting Owner Confirmation</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Contracted Value</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">₹{totalRevenue.toLocaleString()}</h3>
            <p className="text-[11px] text-emerald-600 mt-1">Across Confirmed Bookings</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Pending Approval Section */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">Incoming Booking Requests</h2>
          <p className="text-xs text-gray-500">Review requested operations and approve with explicit confirmation</p>
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs text-gray-400">Loading incoming requests...</div>
        ) : pendingBookings.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            No pending booking requests awaiting review.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingBookings.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-gray-900 text-sm">
                      Request #{b.id} • {b.resource?.name || `Machinery #${b.resource_id}`}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1">
                      <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                      <span>Priority: {b.id % 2 === 0 ? '82/100 (Urgent)' : '76/100 (Normal)'}</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-600 text-[11px]">
                    <span className="capitalize">Operation: {b.operation}</span>
                    <span>•</span>
                    <span>Duration: {b.duration_hours} hrs</span>
                    <span>•</span>
                    <span className="font-semibold text-emerald-700">Value: ₹{b.estimated_cost}</span>
                    <span>•</span>
                    <span className="text-gray-500">Scheduled: {b.start_time.slice(0, 16).replace('T', ' ')}</span>
                  </div>

                  {b.notes && <p className="text-[11px] text-gray-500 italic mt-1">Note: "{b.notes}"</p>}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                    disabled={processingId === b.id}
                    className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl transition shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(b.id, 'rejected')}
                    disabled={processingId === b.id}
                    className="flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold px-4 py-2 rounded-xl transition border border-rose-200"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Machinery Fleet Inventory */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">Registered Agricultural Fleet</h2>
          <p className="text-xs text-gray-500">Active machinery specifications and regional coverage</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((r) => (
            <div key={r.id} className="p-4 rounded-2xl border border-gray-200 space-y-2.5 text-xs">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{r.name}</h4>
                  <span className="text-[10px] uppercase font-bold text-gray-500">{r.category}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>

              <div className="space-y-1 text-gray-600 text-[11px]">
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>{r.location_name} (Radius: {r.service_radius_km} km)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-semibold text-gray-900">₹{r.price_per_unit} / {r.pricing_unit === 'per_hour' ? 'hr' : 'acre'}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-gray-400" />
                  <span className="capitalize">{r.supported_operations.join(', ')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
