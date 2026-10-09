import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Tractor,
  Shield,
  Activity,
  Mic,
  Calendar,
  CloudSun,
  Layers,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [healthStatus, setHealthStatus] = useState<{
    status: string;
    database: string;
    timestamp?: string;
  } | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(true);

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const res = await apiClient.get('/health');
        setHealthStatus(res.data);
      } catch {
        setHealthStatus(null);
      } finally {
        setIsHealthLoading(false);
      }
    };

    checkBackendHealth();
  }, []);

  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case 'administrator':
        return 'System Administrator';
      case 'resource_owner':
        return 'Agricultural Equipment Owner';
      case 'service_provider':
        return 'Agricultural Service Provider';
      default:
        return 'Verified Farmer';
    }
  };

  return (
    <div className="space-y-8 py-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-leaf-600 bg-leaf-50 px-2.5 py-0.5 rounded-full border border-leaf-200">
                Active Session
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500 font-medium">
                Lang: {user?.preferred_language?.toUpperCase() || 'EN'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-forest-900">
              Welcome back, {user?.full_name}
            </h1>
            <p className="text-sm text-gray-600">
              {getRoleDisplayName(user?.role)} • {user?.email}
            </p>
          </div>

          {/* Backend Connectivity Status Widget */}
          <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 text-xs space-y-1 sm:text-right">
            <div className="flex items-center sm:justify-end space-x-1.5 font-bold text-gray-700">
              <Activity className="w-4 h-4 text-leaf-500" />
              <span>Platform Health</span>
            </div>
            {isHealthLoading ? (
              <p className="text-gray-400">Pinging server...</p>
            ) : healthStatus ? (
              <div className="flex items-center sm:justify-end space-x-1.5 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="font-semibold">
                  API Online • DB {healthStatus.database}
                </span>
              </div>
            ) : (
              <div className="flex items-center sm:justify-end space-x-1.5 text-amber-600">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Backend offline</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Role-Specific Actions & Workflow Portals */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-forest-900 tracking-tight">
          Operational Workspace Modules
        </h2>

        {user?.role === 'administrator' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <Link
              to="/admin/audit"
              className="bg-white p-6 rounded-2xl border border-purple-200 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-1">
                Security Audit Logs
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Inspect real-time system audit logs, authentication history, RBAC violations, and data changes.
              </p>
            </Link>

            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm opacity-90">
              <div className="w-12 h-12 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center mb-4">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-1">
                Resource & User Governance
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Platform-wide role assignments, reported listings review, and conflict mediation.
              </p>
              <span className="mt-3 inline-block text-[10px] font-bold uppercase bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                Admin Core
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-leaf-100 text-leaf-700 flex items-center justify-center">
                <Tractor className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Resource Marketplace</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Discover tractors, harvesters, and labour with distance filters.
                </p>
              </div>
              <span className="inline-block text-[10px] font-semibold bg-leaf-50 text-leaf-700 px-2 py-0.5 rounded border border-leaf-200">
                Phase 2 Core
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">FarmVoice AI</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Gemini Live Voice AI assistant for hands-free agricultural booking.
                </p>
              </div>
              <span className="inline-block text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                Phase 4 Voice AI
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Conflict-Free Bookings</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Coordination engine with explainable priority scores (0–100).
                </p>
              </div>
              <span className="inline-block text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                Phase 3 Engine
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <CloudSun className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Weather Risk</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Real precipitation probability and agrometeorology alerts.
                </p>
              </div>
              <span className="inline-block text-[10px] font-semibold bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-200">
                Phase 6 Weather
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Security & Foundation Summary Card */}
      <div className="bg-cream-100/70 rounded-2xl p-6 border border-cream-200 space-y-2">
        <div className="flex items-center space-x-2 text-forest-900 font-bold text-sm">
          <Shield className="w-4 h-4 text-leaf-600" />
          <span>Security & Database Integrity Notice</span>
        </div>
        <p className="text-xs text-forest-800/80 leading-relaxed">
          BHUMISETU enforces backend-authenticated role-based access control, cryptographic password hashing via bcrypt, stateless JWT token verification, and transactional audit trails. All actions are logged and permanently persisted in the relational database.
        </p>
      </div>
    </div>
  );
};
