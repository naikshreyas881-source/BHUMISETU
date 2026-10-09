import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, UserPlus, AlertCircle, User, Mail, Phone, Lock, Globe, Tractor, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/auth';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('farmer');
  const [language, setLanguage] = useState('en');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await register({
        full_name: fullName,
        email,
        phone_number: phoneNumber || undefined,
        password,
        role,
        preferred_language: language,
      });
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to create account. Please ensure the backend server is running.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto my-8 px-4">
      {/* Brand Header */}
      <div className="text-center mb-6 space-y-2">
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
          Register to join the verified agricultural coordination network
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Select Your Platform Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('farmer')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  role === 'farmer'
                    ? 'border-leaf-500 bg-leaf-50 text-forest-900 font-bold ring-2 ring-leaf-400/30'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Sprout className="w-5 h-5 mx-auto mb-1 text-leaf-600" />
                <span className="text-xs block">Farmer</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('resource_owner')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  role === 'resource_owner'
                    ? 'border-earth-600 bg-earth-100 text-earth-800 font-bold ring-2 ring-earth-500/30'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Tractor className="w-5 h-5 mx-auto mb-1 text-earth-600" />
                <span className="text-xs block">Equipment Owner</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('service_provider')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  role === 'service_provider'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold ring-2 ring-blue-500/30'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Wrench className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                <span className="text-xs block">Provider</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1" htmlFor="full_name">
              Full Legal Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                id="full_name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Gowda"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-leaf-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1" htmlFor="reg_email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                id="reg_email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ramesh@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-leaf-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1" htmlFor="reg_phone">
              Phone Number (Optional)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                id="reg_phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-leaf-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1" htmlFor="reg_pwd">
              Password (min. 6 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                id="reg_pwd"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-leaf-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1" htmlFor="reg_lang">
              Preferred Language
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <select
                id="reg_lang"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-leaf-500 focus:bg-white"
              >
                <option value="en">English</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center space-x-2 bg-forest-800 hover:bg-forest-900 text-white font-bold py-3 rounded-xl transition-colors shadow-md disabled:opacity-60 mt-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create BHUMISETU Account</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-600">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-leaf-600 hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};
