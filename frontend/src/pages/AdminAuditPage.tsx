import React, { useEffect, useState } from 'react';
import { Shield, RefreshCw, AlertCircle, FileText } from 'lucide-react';
import apiClient from '../api/client';
import type { AuditLog } from '../types/auth';

export const AdminAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<AuditLog[]>('/admin/audit-logs');
      setLogs(res.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Access denied: Administrator permissions required.');
      } else {
        setError('Failed to fetch audit records from server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadgeColor = (action: string) => {
    if (action.includes('REGISTER')) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (action.includes('LOGIN') && !action.includes('FAILED')) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (action.includes('FAILED') || action.includes('DENIED')) return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-purple-700 mb-1">
            <Shield className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Security Governance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-forest-900">
            System Audit Trail Logs
          </h1>
          <p className="text-sm text-gray-600">
            Real-time, backend-enforced immutable record of authentication and security events.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="inline-flex items-center space-x-2 bg-white hover:bg-gray-50 border border-gray-300 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 shadow-sm transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit Logs</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500 space-y-3">
            <div className="w-8 h-8 border-4 border-leaf-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-medium">Loading audit events from database...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="w-10 h-10 mx-auto text-gray-400 mb-2" />
            <p className="font-semibold text-base text-gray-700">No audit records found</p>
            <p className="text-xs text-gray-500 mt-1">Actions performed on the platform will be logged here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Log ID</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Event Details</th>
                  <th className="py-3 px-4">Client IP</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-gray-500">
                      #{log.id}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800">
                      {log.user_id ? `User #${log.user_id}` : <span className="text-gray-400 italic">None</span>}
                    </td>
                    <td className="py-3 px-4">
                      {log.resource_type ? (
                        <span className="font-mono text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                          {log.resource_type}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-gray-700 font-sans" title={log.details || ''}>
                      {log.details || '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-500">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
