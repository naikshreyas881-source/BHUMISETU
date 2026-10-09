import React from 'react';
import { Sprout, ShieldCheck, HeartHandshake, Mic } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-forest-900 text-cream-100 border-t border-forest-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Tagline */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-leaf-500 flex items-center justify-center text-white">
                <Sprout className="w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-wide text-cream-100">
                {t.brandName}
              </span>
            </div>
            <p className="text-leaf-300 font-semibold text-base tracking-wide">
              {t.tagline}
            </p>
            <p className="text-xs text-leaf-200/80 max-w-md leading-relaxed">
              AI-Powered Agricultural Resource Coordination Platform connecting farmers with verified equipment owners, labour providers, and services through transparent, conflict-aware scheduling.
            </p>
            <div className="flex items-center space-x-3 pt-2 text-xs text-cream-200">
              <span className="bg-forest-800 px-2.5 py-1 rounded border border-forest-700">
                Team: <strong>INNOVISION</strong>
              </span>
              <span className="flex items-center space-x-1 bg-forest-800 px-2.5 py-1 rounded border border-forest-700">
                <Mic className="w-3.5 h-3.5 text-leaf-400" />
                <span>FarmVoice AI</span>
              </span>
            </div>
          </div>

          {/* Core Modules */}
          <div>
            <h4 className="text-sm font-bold text-cream-50 uppercase tracking-wider mb-3">
              Platform Features
            </h4>
            <ul className="space-y-2 text-xs text-leaf-200/80">
              <li className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-leaf-400" />
                <span>Smart Coordination Engine</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <Mic className="w-3.5 h-3.5 text-leaf-400" />
                <span>FarmVoice Multilingual AI</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-leaf-400" />
                <span>Conflict-Aware Booking</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <Sprout className="w-3.5 h-3.5 text-leaf-400" />
                <span>Weather-Aware Scheduling</span>
              </li>
            </ul>
          </div>

          {/* Integrity & Demonstration Notice */}
          <div>
            <h4 className="text-sm font-bold text-cream-50 uppercase tracking-wider mb-3">
              Project Notice
            </h4>
            <p className="text-xs text-leaf-200/70 leading-relaxed">
              Major CSE Engineering Project developed for technical demonstration and real-world deployment. Backend-enforced transactional data integrity.
            </p>
            <div className="mt-3 p-2 rounded bg-forest-800/60 border border-forest-700 text-[11px] text-cream-200">
              Status: <span className="text-leaf-300 font-semibold">Production Ready • All Modules Active</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-forest-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-leaf-300/80">
          <p>© 2026 {t.brandName} • {t.tagline} • Team INNOVISION</p>
          <p className="mt-2 sm:mt-0 font-medium">All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
