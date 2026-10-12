import React, { useState } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  AlertCircle,
  ListFilter,
} from 'lucide-react';
import { useOffline } from '../../context/OfflineContext';
import { OfflineRequestsDrawer } from './OfflineRequestsDrawer';

export const OfflineBanner: React.FC = () => {
  const {
    isOnline,
    isBackendReachable,
    lastSyncTime,
    pendingCount,
    isSyncing,
    syncProgress,
    connectionStatusMessage,
    triggerSync,
  } = useOffline();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const formatLastSync = (ts: string | null) => {
    if (!ts) return 'Never synced';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isActuallyOnline = isOnline && isBackendReachable;

  return (
    <>
      {/* Top Banner / Status Strip */}
      <div
        className={`w-full text-xs transition-colors duration-300 border-b ${
          !isActuallyOnline
            ? 'bg-amber-500 text-white border-amber-600'
            : pendingCount > 0
            ? 'bg-emerald-700 text-cream-100 border-emerald-800'
            : 'bg-forest-900 text-cream-200 border-forest-800'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex flex-wrap items-center justify-between gap-2">
          {/* Left: Connection status indicator */}
          <div className="flex items-center space-x-2 font-medium">
            {!isActuallyOnline ? (
              <span className="flex items-center space-x-1.5 bg-amber-600 px-2 py-0.5 rounded-full font-bold shadow-sm">
                <WifiOff className="w-3.5 h-3.5 animate-pulse" />
                <span>OFFLINE MODE</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5 text-emerald-300 font-semibold">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>ONLINE</span>
              </span>
            )}

            <span className="hidden sm:inline text-white/90">
              {!isActuallyOnline
                ? 'Requests are securely saved on this device and validated upon reconnect.'
                : connectionStatusMessage || 'Connected to BHUMISETU platform.'}
            </span>
          </div>

          {/* Right: Sync details & actions */}
          <div className="flex items-center space-x-3">
            {/* Last Synced timestamp */}
            <div className="flex items-center space-x-1 text-white/80">
              <Clock className="w-3 h-3" />
              <span>Last Synced: {formatLastSync(lastSyncTime)}</span>
            </div>

            {/* Pending offline requests badge */}
            {pendingCount > 0 && (
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="flex items-center space-x-1 bg-white/20 hover:bg-white/30 text-white font-bold px-2.5 py-0.5 rounded-full transition-colors cursor-pointer"
              >
                <AlertCircle className="w-3 h-3 text-amber-200" />
                <span>{pendingCount} Pending</span>
              </button>
            )}

            {/* View Queue button */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center space-x-1 underline hover:text-white transition-colors cursor-pointer"
            >
              <ListFilter className="w-3 h-3" />
              <span>Offline Queue</span>
            </button>

            {/* Manual Sync Trigger button */}
            {isActuallyOnline && (
              <button
                type="button"
                onClick={() => triggerSync()}
                disabled={isSyncing}
                className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 active:scale-95 text-white px-2 py-0.5 rounded-lg border border-white/20 transition-all font-semibold cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`}
                />
                <span>
                  {isSyncing
                    ? syncProgress
                      ? `Syncing (${syncProgress.current}/${syncProgress.total})...`
                      : 'Syncing...'
                    : 'Sync Now'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Offline Requests Modal Drawer */}
      <OfflineRequestsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
};
