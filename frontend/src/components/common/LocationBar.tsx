import React, { useState } from 'react';
import { MapPin, Navigation, Compass, AlertCircle, Check, ChevronDown } from 'lucide-react';
import { useUserLocation } from '../../context/LocationContext';

const PRESETS = [
  { name: 'Mandya (Sugar & Paddy Belt)', lat: 12.5218, lon: 76.8951 },
  { name: 'Mysuru (Cauvery Basin)', lat: 12.2958, lon: 76.6394 },
  { name: 'Hassan (Harvester & Plantation Hub)', lat: 13.0033, lon: 76.1004 },
  { name: 'Bengaluru Rural (Agritech)', lat: 12.9716, lon: 77.5946 },
  { name: 'Shivamogga (Arecanut & Paddy)', lat: 13.9299, lon: 75.5681 },
  { name: 'Hubballi-Dharwad (Northern Crops)', lat: 15.3647, lon: 75.1240 },
];

export const LocationBar: React.FC = () => {
  const {
    latitude,
    longitude,
    locationName,
    isDetecting,
    error,
    source,
    detectLocation,
    setCustomLocation,
  } = useUserLocation();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-forest-950/60 border-b border-forest-800 text-xs text-cream-100 py-1.5 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Left: Active Location Badge */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 bg-forest-800/80 border border-forest-700/60 px-2.5 py-1 rounded-lg">
            <MapPin className={`w-3.5 h-3.5 ${source === 'gps' ? 'text-emerald-400 animate-pulse' : 'text-leaf-400'}`} />
            <span className="font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
              {locationName}
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                source === 'gps'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-leaf-600/20 text-leaf-300'
              }`}
            >
              {source === 'gps' ? 'Live GPS' : source === 'manual' ? 'Selected' : 'District'}
            </span>
          </div>

          <span className="hidden md:inline text-[11px] text-leaf-300/80 font-mono">
            [{latitude.toFixed(3)}°, {longitude.toFixed(3)}°]
          </span>
        </div>

        {/* Right: GPS Trigger & Preset Selector */}
        <div className="flex items-center space-x-2 relative">
          {error && (
            <span className="hidden sm:inline-flex items-center space-x-1 text-red-300 text-[11px] bg-red-950/40 px-2 py-0.5 rounded border border-red-800/50">
              <AlertCircle className="w-3 h-3 text-red-400" />
              <span>{error}</span>
            </span>
          )}

          <button
            onClick={() => detectLocation()}
            disabled={isDetecting}
            className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded-lg shadow-sm transition-all disabled:opacity-60 active:scale-95"
            title="Detect your exact farm / device GPS location"
          >
            <Navigation className={`w-3 h-3 ${isDetecting ? 'animate-spin' : ''}`} />
            <span>{isDetecting ? 'Locating...' : 'Detect My Location'}</span>
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-1 bg-forest-800 hover:bg-forest-700 text-cream-200 px-2.5 py-1 rounded-lg border border-forest-700 transition"
          >
            <Compass className="w-3 h-3 text-leaf-300" />
            <span className="hidden sm:inline">Change District</span>
            <ChevronDown className="w-3 h-3 text-leaf-400" />
          </button>

          {/* District Preset Dropdown */}
          {isOpen && (
            <div className="absolute right-0 top-8 z-50 w-64 bg-white text-gray-800 rounded-xl shadow-xl border border-gray-200 p-2 space-y-1 text-xs">
              <div className="px-2 py-1 font-bold text-gray-500 uppercase text-[10px] tracking-wider border-b border-gray-100">
                Quick Regional Presets
              </div>
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => {
                    setCustomLocation(p.lat, p.lon, p.name);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-2 py-1.5 hover:bg-leaf-50 rounded-lg flex items-center justify-between text-gray-700 font-medium transition"
                >
                  <span>{p.name}</span>
                  {Math.abs(latitude - p.lat) < 0.05 && Math.abs(longitude - p.lon) < 0.05 && (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
