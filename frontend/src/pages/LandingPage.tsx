import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Mic, CalendarCheck, ShieldCheck, ArrowRight, Tractor, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-forest-900 to-forest-800 text-white rounded-3xl p-8 sm:p-14 shadow-xl border border-forest-700">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 bg-leaf-500/20 border border-leaf-400/30 text-leaf-300 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide">
            <Sprout className="w-4 h-4 text-leaf-400" />
            <span>AI-Powered Agricultural Resource Coordination</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-cream-100">
            BHUMISETU
          </h1>

          <p className="text-xl sm:text-2xl font-semibold text-leaf-300">
            Bridging Farms to a Better Future
          </p>

          <p className="text-base sm:text-lg text-cream-200/90 leading-relaxed max-w-2xl">
            A reliable agricultural marketplace connecting farmers with verified equipment owners, labour providers, and services through transparent, conflict-aware coordination and real Gemini-powered voice assistance.
          </p>

          <div className="pt-4 flex flex-wrap gap-4 items-center">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center space-x-2 bg-leaf-400 hover:bg-leaf-300 text-forest-900 font-bold px-6 py-3.5 rounded-xl shadow-lg transition-transform transform active:scale-95"
              >
                <span>Go to Your Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="inline-flex items-center space-x-2 bg-leaf-400 hover:bg-leaf-300 text-forest-900 font-bold px-6 py-3.5 rounded-xl shadow-lg transition-transform transform active:scale-95"
                >
                  <span>Register as a Farmer / Owner</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-2 bg-forest-800/80 hover:bg-forest-700 text-cream-100 font-semibold px-6 py-3.5 rounded-xl border border-forest-600 transition-colors"
                >
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Decorative background element */}
        <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-leaf-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-forest-900">
            Built for Agricultural Community Reliability
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Engineered with real backend transactional persistence, zero mock responses, and intelligent coordination.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-leaf-100 text-leaf-600 flex items-center justify-center mb-4">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-forest-900 mb-2">
              Conflict-Aware Coordination
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Automated interval overlap detection prevents double bookings. Evaluates equipment capabilities, travel feasibility, and maintenance windows.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-leaf-100 text-leaf-600 flex items-center justify-center mb-4">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-forest-900 mb-2">
              FarmVoice Multilingual AI
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Natural spoken voice interaction powered by Google Gemini Live API. Verified end-to-end support for English and Kannada with explicit confirmation safeguards.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-leaf-100 text-leaf-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-forest-900 mb-2">
              Explainable Priority Engine
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Transparent 0–100 priority assessments based on weather risk, crop readiness, urgency, and farm impact with zero black-box decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Stakeholder Roles */}
      <section className="bg-cream-100/60 rounded-3xl p-8 border border-cream-200">
        <h2 className="text-xl sm:text-2xl font-bold text-forest-900 mb-6 text-center">
          Connecting Every Stakeholder in the Farming Ecosystem
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-cream-300 space-y-2">
            <div className="flex items-center space-x-2 text-forest-800 font-bold">
              <Sprout className="w-5 h-5 text-leaf-500" />
              <span>Farmers</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Find verified tractors, harvesters, labour, and agricultural sprayers. Book with explainable priority scores and voice interaction.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-cream-300 space-y-2">
            <div className="flex items-center space-x-2 text-earth-800 font-bold">
              <Tractor className="w-5 h-5 text-earth-600" />
              <span>Equipment Owners</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              List machinery, set service radii and pricing, manage maintenance schedules, and approve verified booking requests.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-cream-300 space-y-2">
            <div className="flex items-center space-x-2 text-blue-900 font-bold">
              <Wrench className="w-5 h-5 text-blue-600" />
              <span>Service Providers</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Offer skilled harvesting, precision spraying, and field labour services. Manage availability calendars and work status.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
