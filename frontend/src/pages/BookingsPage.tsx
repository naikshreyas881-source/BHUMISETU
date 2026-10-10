import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Ban,
  CloudRain,
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Booking, BookingStatus } from '../types/marketplace';

export const BookingsPage: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<Booking[]>('/bookings/');
      setBookings(res.data);
    } catch {
      setError('Failed to retrieve bookings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (
    bookingId: number,
    newStatus: BookingStatus,
    rejectionReason?: string
  ) => {
    try {
      await apiClient.patch(`/bookings/${bookingId}/status`, {
        status: newStatus,
        rejection_reason: rejectionReason,
      });
      setActionNotice(`Booking #${bookingId} transitioned to ${newStatus}.`);
      fetchBookings();
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to update booking status.');
      }
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirmed</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-extrabold px-3 py-1 rounded-full bg-red-100 text-red-800 border border-red-300">
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-extrabold px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-300">
            <Ban className="w-3.5 h-3.5" />
            <span>Cancelled</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-extrabold px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-extrabold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Approval</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-leaf-600">
            Lifecycle Coordination Manager
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-forest-900">
            Booking Requests & Schedule
          </h1>
          <p className="text-sm text-gray-600">
            Track, confirm, and manage agricultural resource allocations with real backend state transitions.
          </p>
        </div>

        <button
          onClick={fetchBookings}
          disabled={isLoading}
          className="inline-flex items-center space-x-2 bg-white hover:bg-gray-50 border border-gray-300 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 shadow-sm transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {actionNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Bookings List */}
      {isLoading ? (
        <div className="p-12 text-center text-gray-500">
          <div className="w-8 h-8 border-4 border-leaf-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm">Retrieving bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="text-lg font-bold text-gray-800">No booking records found</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            When you request equipment or receive requests for your machinery, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const isRequester = booking.farmer_id === user?.id;
            const isOwnerOrAdmin = user?.role === 'resource_owner' || user?.role === 'service_provider' || user?.role === 'administrator';

            return (
              <div
                key={booking.id}
                className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs font-bold text-gray-400">
                      #{booking.id}
                    </span>
                    <h3 className="text-base font-extrabold text-gray-900">
                      {booking.resource_name || 'Agricultural Resource'}
                    </h3>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded capitalize">
                      {booking.operation}
                    </span>
                  </div>

                  <div>{getStatusBadge(booking.status)}</div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Requester</span>
                    <span className="font-semibold text-gray-800">{booking.farmer_name || 'Farmer'}</span>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Scheduled Window</span>
                    <span className="font-semibold text-gray-800">
                      {new Date(booking.start_time).toLocaleDateString()} ({booking.duration_hours} hrs)
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Estimated Amount</span>
                    <span className="font-extrabold text-forest-800 text-sm">
                      ₹{booking.estimated_cost.toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Idempotency ID</span>
                    <span className="font-mono text-[10px] text-gray-500 truncate block">
                      {booking.idempotency_key}
                    </span>
                  </div>
                </div>

                {booking.notes && (
                  <div className="text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-gray-700">
                    <span className="font-bold text-gray-500">Requester Note: </span>
                    {booking.notes}
                  </div>
                )}

                {/* Weather-Based Booking Prediction Indicator */}
                <div className="flex items-center space-x-2 text-[11px] text-gray-600 bg-forest-50/60 px-3 py-1.5 rounded-xl border border-leaf-200/60">
                  <CloudRain className="w-3.5 h-3.5 text-forest-700 flex-shrink-0" />
                  <span className="font-semibold text-forest-900">Weather Intelligence:</span>
                  <span>Advisory micro-climate forecast active for this equipment allocation window</span>
                </div>

                {/* State Transition Actions */}

                <div className="pt-2 flex flex-wrap gap-2 justify-end border-t border-gray-100">
                  {/* Owner/Admin approval actions */}
                  {isOwnerOrAdmin && (booking.status === 'submitted' || booking.status === 'pending_approval') && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-xl text-xs transition-colors shadow-sm"
                      >
                        Approve Booking
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Please enter rejection reason:');
                          if (reason) handleUpdateStatus(booking.id, 'rejected', reason);
                        }}
                        className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold px-4 py-1.5 rounded-xl text-xs transition-colors"
                      >
                        Reject Request
                      </button>
                    </>
                  )}

                  {/* Requester cancellation action */}
                  {isRequester && (booking.status === 'submitted' || booking.status === 'confirmed') && (
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to cancel this booking request?')) {
                          handleUpdateStatus(booking.id, 'cancelled');
                        }
                      }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-1.5 rounded-xl text-xs transition-colors"
                    >
                      Cancel Booking
                    </button>
                  )}

                  {/* Complete action */}
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => handleUpdateStatus(booking.id, 'completed')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-xl text-xs transition-colors"
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
