import React, { useEffect, useState } from 'react';
import { ShieldCheck, Database, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import apiClient from '../api/client';

interface AuditRecord {
  id: number;
  user_id: number | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: string | null;
  created_at: string;
}

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<AuditRecord[]>('/admin/audit-logs');
        setAuditLogs(res.data);
      } catch (err) {
        console.error('Audit fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAudit();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-forest-950 to-gray-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Administrator Security & Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            System Integrity & Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 max-w-xl">
            {t.tagline} • Immutable logging of all state mutations, role checks, and FarmVoice AI interactions.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/10 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Role: {user?.role.toUpperCase()} (Authorized)</span>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Audit Log Records</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{auditLogs.length}</h3>
            <p className="text-[11px] text-emerald-600 mt-1">Immutable Trail</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-forest-50 flex items-center justify-center text-forest-700">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Database Engine</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">SQLite / WAL</h3>
            <p className="text-[11px] text-emerald-600 mt-1">ACID Safe • Zero Double-Bookings</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700">
            <Database className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">AI Voice Gateway</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">FarmVoice AI</h3>
            <p className="text-[11px] text-emerald-600 mt-1">Gemini Live Function Calling</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-700">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">Security & Coordination Event Log</h2>
          <p className="text-xs text-gray-500">Every sensitive action recorded with timestamp and user ID</p>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-gray-400">Loading audit trail records...</div>
        ) : auditLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500">No audit events recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Resource Target</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-gray-500">#{log.id}</td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      <span className="px-2 py-0.5 rounded-full bg-forest-50 text-forest-800 border border-forest-200 text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">User #{log.user_id || 'System'}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {log.resource_type ? `${log.resource_type} (${log.resource_id})` : '--'}
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-[10px] max-w-xs truncate">
                      {log.details || '--'}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-[11px]">
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
