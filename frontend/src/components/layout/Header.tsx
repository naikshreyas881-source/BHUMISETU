import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, LogOut, Shield, Globe, ShoppingBag, Calendar, Sparkles, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { FarmVoiceModal } from '../voice/FarmVoiceModal';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'administrator':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'resource_owner':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'service_provider':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-leaf-100 text-forest-800 border-leaf-300';
    }
  };

  const formatRoleName = (role?: string) => {
    switch (role) {
      case 'administrator':
        return 'Administrator';
      case 'resource_owner':
        return 'Equipment Owner';
      case 'service_provider':
        return 'Service Provider';
      default:
        return 'Farmer';
    }
  };

  return (
    <>
      <header className="bg-forest-900 text-white shadow-md border-b border-forest-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Brand Logo & Tagline */}
            <Link to="/" className="flex items-center space-x-3 group focus:outline-none focus:ring-2 focus:ring-leaf-400 rounded-lg p-1">
              <div className="w-11 h-11 rounded-xl bg-leaf-500 flex items-center justify-center text-white shadow-inner group-hover:bg-leaf-400 transition-colors">
                <Sprout className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-black tracking-wider text-cream-100 font-sans">
                    {t.brandName}
                  </span>
                  <span className="text-xs bg-leaf-600/80 text-cream-50 px-2 py-0.5 rounded-full font-medium tracking-wide">
                    Live
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-leaf-300 font-medium tracking-normal">
                  {t.tagline}
                </p>
              </div>
            </Link>

            {/* Navigation Controls */}
            <nav className="flex items-center space-x-2 sm:space-x-3">
              {/* FarmVoice AI Launcher Button */}
              <button
                onClick={() => setIsVoiceOpen(true)}
                className="flex items-center space-x-1.5 bg-gradient-to-r from-emerald-500 to-leaf-500 hover:from-emerald-400 hover:to-leaf-400 text-forest-950 px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all transform hover:scale-105"
                title="Launch Multilingual FarmVoice AI Assistant"
              >
                <Sparkles className="w-4 h-4 text-forest-950" />
                <span className="hidden sm:inline">FarmVoice AI</span>
              </button>

              {/* Marketplace link */}
              <Link
                to="/marketplace"
                className="text-xs sm:text-sm font-semibold text-cream-100 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-forest-800 transition-colors flex items-center space-x-1"
              >
                <ShoppingBag className="w-4 h-4 text-leaf-400" />
                <span>{t.nav.marketplace}</span>
              </Link>

              {/* Functional Language Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  className="flex items-center space-x-1 text-xs text-leaf-200 bg-forest-800 hover:bg-forest-750 px-2.5 py-1.5 rounded-lg border border-forest-700 transition"
                >
                  <Globe className="w-3.5 h-3.5 text-leaf-300" />
                  <span className="font-bold uppercase">{language}</span>
                </button>

                {langMenuOpen && (
                  <div className="absolute right-0 mt-2 w-36 bg-white text-gray-800 rounded-xl shadow-xl border border-gray-200 py-1 text-xs z-50">
                    <button
                      onClick={() => {
                        setLanguage('en');
                        setLangMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-forest-50 font-semibold flex items-center justify-between"
                    >
                      <span>English</span>
                      {language === 'en' && <span className="text-emerald-600 font-bold">✓</span>}
                    </button>
                    <button
                      onClick={() => {
                        setLanguage('kn');
                        setLangMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-forest-50 font-semibold flex items-center justify-between"
                    >
                      <span>ಕನ್ನಡ (Kannada)</span>
                      {language === 'kn' && <span className="text-emerald-600 font-bold">✓</span>}
                    </button>
                    <button
                      onClick={() => {
                        setLanguage('hi');
                        setLangMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-forest-50 text-gray-500 flex items-center justify-between"
                    >
                      <span>हिन्दी (Hindi)</span>
                    </button>
                    <button
                      onClick={() => {
                        setLanguage('te');
                        setLangMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-forest-50 text-gray-500 flex items-center justify-between"
                    >
                      <span>తెలుగు (Telugu)</span>
                    </button>
                  </div>
                )}
              </div>

              {isAuthenticated && user ? (
                <div className="flex items-center space-x-2 sm:space-x-2.5">
                  {/* Role-Specific Dashboard Link */}
                  <Link
                    to={
                      user.role === 'resource_owner' || user.role === 'service_provider'
                        ? '/owner'
                        : user.role === 'administrator'
                        ? '/admin'
                        : '/dashboard'
                    }
                    className="text-xs sm:text-sm font-medium text-cream-100 hover:text-white px-2 py-1.5 rounded-md hover:bg-forest-800 transition-colors flex items-center space-x-1"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-leaf-400" />
                    <span>{t.nav.dashboard}</span>
                  </Link>

                  <Link
                    to="/farms"
                    className="text-xs sm:text-sm font-medium text-cream-100 hover:text-white px-2 py-1.5 rounded-md hover:bg-forest-800 transition-colors hidden md:block"
                  >
                    {t.nav.farms}
                  </Link>

                  <Link
                    to="/bookings"
                    className="text-xs sm:text-sm font-medium text-cream-100 hover:text-white px-2 py-1.5 rounded-md hover:bg-forest-800 transition-colors flex items-center space-x-1"
                  >
                    <Calendar className="w-3.5 h-3.5 text-leaf-400" />
                    <span>{t.nav.bookings}</span>
                  </Link>

                  {user.role === 'administrator' && (
                    <Link
                      to="/admin"
                      className="flex items-center space-x-1 text-xs sm:text-sm font-medium text-purple-200 hover:text-purple-100 px-2 py-1.5 rounded-md hover:bg-forest-800 transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Audit</span>
                    </Link>
                  )}

                  <div className="hidden lg:flex items-center space-x-2 pl-2 border-l border-forest-700">
                    <div className="text-right">
                      <p className="text-xs font-semibold text-cream-100 leading-tight">
                        {user.full_name}
                      </p>
                      <span
                        className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {formatRoleName(user.role)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-xs font-medium text-red-300 hover:text-red-200 bg-red-950/40 hover:bg-red-900/60 px-2.5 py-1.5 rounded-lg border border-red-800/50 transition-colors"
                    title="Sign out of BHUMISETU"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t.nav.logout}</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="text-xs sm:text-sm font-medium text-cream-100 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-forest-800 transition-colors"
                  >
                    {t.nav.login}
                  </Link>
                  <Link
                    to="/register"
                    className="text-xs sm:text-sm font-semibold text-forest-900 bg-leaf-400 hover:bg-leaf-300 px-3.5 py-1.5 rounded-lg shadow-sm transition-all transform active:scale-95"
                  >
                    {t.nav.register}
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Global FarmVoice AI Assistant Modal */}
      <FarmVoiceModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />
    </>
  );
};
