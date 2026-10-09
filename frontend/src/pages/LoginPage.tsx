import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, LogIn, AlertCircle, KeyRound, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to connect to backend server. Verify the API is running.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleQuickLogin = async (demoEmail: string, demoPass: string, targetPath: string = '/dashboard') => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setIsSubmitting(true);
    try {
      await login(demoEmail, demoPass);
      navigate(targetPath);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-10 px-4">
      {/* Brand Header */}
      <div className="text-center mb-8 space-y-2">
        <div className="w-14 h-14 bg-forest-900 rounded-2xl flex items-center justify-center text-leaf-400 mx-auto shadow-md border border-forest-800">
          <Sprout className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-forest-900 tracking-wide">
          BHUMISETU
        </h1>
        <p className="text-sm font-semibold text-leaf-600">
          Bridging Farms to a Better Future
        </p>
        <p className="text-xs text-gray-500">
          Sign in to access your agricultural coordination dashboard
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farmer@bhumisetu.org"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-leaf-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-leaf-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center space-x-2 bg-forest-800 hover:bg-forest-900 text-white font-bold py-3 rounded-xl transition-colors shadow-md disabled:opacity-60"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In to BHUMISETU</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Pre-fills for Testing & Demonstration */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center mb-3">
            Quick Demonstration Credentials
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin('farmer1@bhumisetu.org', 'SecurePassword123', '/dashboard')}
              className="p-2.5 bg-leaf-50 hover:bg-leaf-100 text-forest-800 rounded-lg border border-leaf-200 text-left font-medium transition-colors"
            >
              🌱 Farmer Ramesh
              <span className="block text-[10px] text-gray-500">1-Click Farmer Portal</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('owner_manjunath@bhumisetu.org', 'OwnerSecure123', '/owner')}
              className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg border border-amber-200 text-left font-medium transition-colors"
            >
              🚜 Owner Manjunath
              <span className="block text-[10px] text-gray-500">1-Click Fleet Console</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin_rbac@bhumisetu.org', 'AdminPassword123', '/admin')}
              className="p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-lg border border-purple-200 text-left font-medium transition-colors"
            >
              🛡️ System Admin
              <span className="block text-[10px] text-gray-500">1-Click Audit Admin</span>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-600">
          Need a new account?{' '}
          <Link to="/register" className="font-bold text-leaf-600 hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};
