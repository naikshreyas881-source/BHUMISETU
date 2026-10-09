import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Tractor,
  Calendar,
  Sparkles,
  MapPin,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import apiClient from '../api/client';
import type { Booking, Farm } from '../types/marketplace';
import { WeatherWidget } from '../components/weather/WeatherWidget';
import { FarmVoiceModal } from '../components/voice/FarmVoiceModal';

export const FarmerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [farmRes, bookRes] = await Promise.all([
          apiClient.get<Farm[]>('/farms/'),
          apiClient.get<Booking[]>('/bookings/'),
        ]);
        setFarms(farmRes.data);
        setBookings(bookRes.data);
      } catch (err) {
        console.error('Failed to load farmer dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalAcres = farms.reduce((sum, f) => sum + (f.size_acres || 0), 0);
  const activeBookings = bookings.filter((b) => ['submitted', 'confirmed'].includes(b.status));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-forest-800 to-forest-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-emerald-300">
            <span>Farmer Operations Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Welcome back, {user?.full_name || 'Farmer'}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl">
            {t.tagline} • Intelligent resource matching, weather forecasting, and conflict-free booking for your crops.
          </p>
        </div>

        {/* Quick Launch Voice AI Button */}
        <button
          onClick={() => setIsVoiceOpen(true)}
          className="flex items-center justify-center space-x-2.5 bg-emerald-500 hover:bg-emerald-600 text-forest-950 font-black px-6 py-3.5 rounded-2xl shadow-lg transition duration-200 transform hover:-translate-y-0.5 text-xs sm:text-sm"
        >
          <Sparkles className="w-5 h-5 text-forest-950" />
          <span>Launch FarmVoice AI</span>
        </button>
      </div>

      {/* Weather Forecast Widget */}
      <WeatherWidget latitude={farms[0]?.latitude || 12.5218} longitude={farms[0]?.longitude || 76.8951} />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Registered Farms</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{farms.length}</h3>
            <p className="text-[11px] text-emerald-600 mt-1">Total {totalAcres} Acres Managed</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-forest-50 flex items-center justify-center text-forest-700">
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Active Bookings</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{activeBookings.length}</h3>
            <p className="text-[11px] text-amber-600 mt-1">In Scheduling Pipeline</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Marketplace Machinery</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">Available</h3>
            <Link to="/marketplace" className="text-[11px] text-forest-700 font-bold hover:underline mt-1 inline-block">
              Browse Equipment &rarr;
            </Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700">
            <Tractor className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Active Bookings Section */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Recent Equipment Requests</h2>
            <p className="text-xs text-gray-500">Track real-time coordination and owner confirmation status</p>
          </div>
          <Link
            to="/bookings"
            className="text-xs font-bold text-forest-700 hover:text-forest-800 flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-gray-400">Loading your farm records...</div>
        ) : bookings.length === 0 ? (
          <div className="py-10 text-center space-y-3 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-xs text-gray-500">You have no active machinery booking requests.</p>
            <Link
              to="/marketplace"
              className="inline-block bg-forest-700 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-forest-800 transition"
            >
              Search Machinery Marketplace
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {bookings.slice(0, 4).map((b) => (
              <div key={b.id} className="py-3.5 flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-gray-900">
                    Booking #{b.id} • {b.resource?.name || `Machinery #${b.resource_id}`}
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] text-gray-500">
                    <span className="capitalize">Operation: {b.operation}</span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{b.duration_hours} hrs</span>
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-emerald-700">₹{b.estimated_cost}</span>
                  </div>
                </div>

                <div>
                  <span
                    className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                      b.status === 'confirmed'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : b.status === 'submitted'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Voice Assistant Modal */}
      <FarmVoiceModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onBookingSuccess={() => {
          setIsVoiceOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
};
