import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Server,
  CloudOff,
  ShieldAlert,
} from 'lucide-react';
import { useOffline } from '../../context/OfflineContext';
import type { OfflineBookingRequest } from '../../services/offlineStorage';

interface OfflineRequestsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineRequestsDrawer: React.FC<OfflineRequestsDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    offlineBookings,
    isOnline,
    isBackendReachable,
    isSyncing,
    triggerSync,
    removeOfflineBooking,
    updateOfflineBookingNotes,
    retryBooking,
  } = useOffline();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<string>('');

  if (!isOpen) return null;

  const handleStartEdit = (b: OfflineBookingRequest) => {
    setEditingId(b.id);
    setEditNotes(b.notes || '');
  };

  const handleSaveEdit = async (id: string) => {
    await updateOfflineBookingNotes(id, editNotes);
    setEditingId(null);
  };

  const getStatusBadge = (status: OfflineBookingRequest['sync_status']) => {
    switch (status) {
      case 'saved_locally':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <CloudOff className="w-3 h-3 text-amber-600" />
            <span>Saved Locally (Waiting for Internet)</span>
          </span>
        );
      case 'waiting_sync':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
            <Clock className="w-3 h-3 text-sky-600" />
            <span>Waiting for Synchronization</span>
          </span>
        );
      case 'validating_server':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300 animate-pulse">
            <Server className="w-3 h-3 text-indigo-600 animate-spin" />
            <span>Awaiting Server Validation</span>
          </span>
        );
      case 'confirmed_server':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Confirmed by Server</span>
          </span>
        );
      case 'pending_approval':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3 h-3 text-blue-600" />
            <span>Submitted (Awaiting Owner Approval)</span>
          </span>
        );
      case 'rejected_server':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            <span>Rejected by Server</span>
          </span>
        );
      case 'sync_failed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>Sync Failed (Retry Available)</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-forest-900 text-white px-6 py-5 flex items-center justify-between border-b border-forest-800 flex-shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-leaf-300">
                BHUMISETU Offline Synchronization Engine
              </span>
            </div>
            <h3 className="text-xl font-black text-cream-100">
              Offline Requests Queue ({offlineBookings.length})
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            {isOnline && isBackendReachable && (
              <button
                type="button"
                onClick={() => triggerSync()}
                disabled={isSyncing}
                className="flex items-center space-x-1.5 bg-leaf-500 hover:bg-leaf-600 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync All'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-forest-800 hover:bg-forest-700 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Advisory Warning Alert */}
        <div className="bg-amber-50 px-6 py-3 border-b border-amber-200 flex items-start space-x-2.5 text-xs text-amber-800">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong>Important Policy:</strong> Locally saved requests are stored safely in your browser and are <strong>not confirmed bookings</strong>. When connection is restored, the server validates equipment availability, weather rules, and conflicts before issuing final confirmation.
          </p>
        </div>

        {/* Requests List */}
        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          {offlineBookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500 space-y-2">
              <CloudOff className="w-12 h-12 mx-auto text-gray-400 opacity-60" />
              <p className="font-semibold text-sm">No offline requests queued.</p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Any equipment booking prepared while disconnected from the internet will be saved here automatically.
              </p>
            </div>
          ) : (
            offlineBookings.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-2xl border border-gray-200 bg-gray-50/70 hover:bg-gray-50 transition-colors space-y-3 text-xs"
              >
                {/* Header Row: Machinery & Status */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-sm">
                      {b.resource_name}
                    </h4>
                    <span className="text-[11px] text-gray-500 font-medium capitalize">
                      {b.operation} • {b.duration_hours}h duration
                    </span>
                  </div>
                  <div>{getStatusBadge(b.sync_status)}</div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-gray-200 text-gray-600 text-[11px]">
                  <div>
                    <span className="text-gray-400 block">Date & Time</span>
                    <span className="font-bold text-gray-800">
                      {new Date(b.start_time).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      {new Date(b.start_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Target Farm</span>
                    <span className="font-semibold text-gray-800">
                      {b.farm_name || 'Provider Location'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Estimated Cost</span>
                    <span className="font-bold text-forest-800">
                      ₹{b.estimated_cost.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Queue ID</span>
                    <span className="font-mono text-[10px] text-gray-500 truncate block">
                      {b.id}
                    </span>
                  </div>
                </div>

                {/* Editable Notes */}
                {editingId === b.id ? (
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-bold text-gray-700">
                      Edit Field Notes:
                    </label>
                    <textarea
                      rows={2}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-leaf-500"
                    />
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(b.id)}
                        className="px-3 py-1 bg-leaf-500 text-white rounded-lg font-bold text-[11px]"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-[11px]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  b.notes && (
                    <div className="bg-white p-2 rounded-xl border border-gray-200 text-gray-600 text-[11px]">
                      <span className="font-bold text-gray-500 mr-1">Notes:</span>
                      <span>{b.notes}</span>
                    </div>
                  )
                )}

                {/* Error message / Server response explanation */}
                {b.error_message && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-[11px] space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold text-red-800">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Sync Validation Notice</span>
                    </div>
                    <p>{b.error_message}</p>

                    {/* Conflict Alternative Slots */}
                    {b.alternative_slots && b.alternative_slots.length > 0 && (
                      <div className="pt-1.5 border-t border-red-200">
                        <span className="font-bold text-red-900 block mb-1">
                          Available Alternative Slots:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {b.alternative_slots.map((slot, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-white border border-red-300 text-red-800 rounded font-semibold text-[10px]"
                            >
                              {(slot as any).display || (slot as any).label || slot.start_time}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Server Booking Reference */}
                {b.server_booking_id && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Authoritative Server Booking #{b.server_booking_id}</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full capitalize">
                      {b.server_status || 'Submitted'}
                    </span>
                  </div>
                )}

                {/* Action Buttons Row */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 text-[11px]">
                  <span className="text-gray-400">
                    Created:{' '}
                    {new Date(b.created_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  <div className="flex items-center space-x-2">
                    {/* Retry button for failed sync */}
                    {b.sync_status === 'sync_failed' && (
                      <button
                        type="button"
                        onClick={() => retryBooking(b.id)}
                        className="flex items-center space-x-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retry Validation</span>
                      </button>
                    )}

                    {/* Edit button */}
                    {(b.sync_status === 'saved_locally' ||
                      b.sync_status === 'waiting_sync' ||
                      b.sync_status === 'sync_failed') &&
                      editingId !== b.id && (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(b)}
                          className="flex items-center space-x-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit Notes</span>
                        </button>
                      )}

                    {/* Delete / Remove button */}
                    <button
                      type="button"
                      onClick={() => removeOfflineBooking(b.id)}
                      className="flex items-center space-x-1 px-2 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove from local queue"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
