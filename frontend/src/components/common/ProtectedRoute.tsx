import React from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-leaf-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-forest-800">Verifying security session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl shadow-sm border border-red-200 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-sm text-gray-600 mb-6">
          Your current account role (<span className="font-semibold text-gray-800">{user.role}</span>) does not have authorization to view this operational module.
        </p>
        <p className="text-xs text-gray-500 mb-6">
          Backend authorization has blocked this request in accordance with role policies.
        </p>
        <a
          href="/dashboard"
          className="inline-block px-5 py-2.5 bg-forest-800 hover:bg-forest-900 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Return to Dashboard
        </a>
      </div>
    );
  }

  return <>{children}</>;
};
