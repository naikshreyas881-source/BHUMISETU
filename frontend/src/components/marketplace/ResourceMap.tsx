import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation } from 'lucide-react';
import type { Resource } from '../../types/marketplace';
import { useUserLocation } from '../../context/LocationContext';

// Fix Leaflet's default marker icon paths in Vite / React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface ResourceMapProps {
  resources: Resource[];
  onSelectResource: (resource: Resource) => void;
  selectedResourceId?: number | null;
}

export const ResourceMap: React.FC<ResourceMapProps> = ({
  resources,
  onSelectResource,
  selectedResourceId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const { latitude: userLat, longitude: userLon, locationName, detectLocation, isDetecting } =
    useUserLocation();

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center at detected user location or Karnataka center
      const map = L.map(mapContainerRef.current).setView([userLat, userLon], 9);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    const bounds = L.latLngBounds([]);

    // 1. Add User's Real Detected Location Pin with Pulsing Effect
    bounds.extend([userLat, userLon]);
    const userMarkerIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="position:relative; width:28px; height:28px;">
          <div style="position:absolute; width:28px; height:28px; background:rgba(37,99,235,0.35); border-radius:50%; transform:scale(1.2);"></div>
          <div style="position:absolute; top:5px; left:5px; width:18px; height:18px; background:#2563eb; border:2px solid #ffffff; border-radius:50%; box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const userMarker = L.marker([userLat, userLon], { icon: userMarkerIcon }).addTo(layerGroup);
    userMarker.bindPopup(`
      <div class="p-1 font-sans text-xs">
        <div class="font-bold text-blue-700 text-sm mb-0.5">📍 Your Live Location</div>
        <div class="text-gray-800 font-semibold mb-1">${locationName}</div>
        <div class="text-[11px] text-gray-500 font-mono">[${userLat.toFixed(4)}°N, ${userLon.toFixed(4)}°E]</div>
      </div>
    `);

    // 2. Render Machinery and Coverage Radius
    resources.forEach((r) => {
      const lat = r.latitude;
      const lon = r.longitude;
      const isSelected = selectedResourceId === r.id;

      bounds.extend([lat, lon]);

      // Service radius circle
      const radiusMeters = (r.service_radius_km || 25) * 1000;
      const circle = L.circle([lat, lon], {
        radius: radiusMeters,
        color: isSelected ? '#15803d' : '#10b981',
        fillColor: isSelected ? '#16a34a' : '#34d399',
        fillOpacity: isSelected ? 0.2 : 0.08,
        weight: isSelected ? 2 : 1,
      });
      circle.addTo(layerGroup);

      // Machinery Marker
      const marker = L.marker([lat, lon]);

      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 text-xs font-sans';
      popupContent.innerHTML = `
        <div class="font-bold text-gray-900 text-sm mb-1">${r.name}</div>
        <div class="text-emerald-700 font-semibold mb-1">₹${r.price_per_unit} / ${r.pricing_unit === 'per_hour' ? 'hr' : 'acre'}</div>
        <div class="text-gray-500 mb-1">📍 ${r.location_name} (Radius: ${r.service_radius_km} km)</div>
        <div class="text-xs text-gray-600 mb-2">⭐ ${r.rating} (${r.total_reviews} reviews)</div>
        <button id="book-btn-${r.id}" class="w-full bg-forest-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-forest-800 transition">
          Book Machinery
        </button>
      `;

      const bookBtn = popupContent.querySelector(`#book-btn-${r.id}`);
      if (bookBtn) {
        bookBtn.addEventListener('click', () => {
          onSelectResource(r);
        });
      }

      marker.bindPopup(popupContent);
      marker.addTo(layerGroup);

      if (isSelected) {
        marker.openPopup();
      }
    });

    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [resources, selectedResourceId, userLat, userLon, locationName]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userLat, userLon], 11, { duration: 1.2 });
    }
  };

  return (
    <div className="relative w-full h-[550px] rounded-2xl overflow-hidden border border-gray-200 shadow-md">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Map Location Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        <button
          onClick={handleRecenter}
          className="flex items-center space-x-1.5 bg-white/95 hover:bg-white text-gray-800 px-3 py-1.5 rounded-xl shadow-md border border-gray-200 text-xs font-bold transition-all active:scale-95"
          title="Center map on your detected GPS location"
        >
          <Navigation className="w-3.5 h-3.5 text-blue-600" />
          <span>My Location</span>
        </button>

        <button
          onClick={() => detectLocation()}
          disabled={isDetecting}
          className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl shadow-md text-xs font-bold transition-all disabled:opacity-60 active:scale-95"
          title="Refresh GPS from device"
        >
          <Navigation className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
          <span>{isDetecting ? 'Locating...' : 'Refresh GPS'}</span>
        </button>
      </div>

      {/* Location Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-sm p-2.5 rounded-xl shadow-md border border-gray-200 text-[11px] space-y-1">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full border border-white shadow-sm"></div>
          <span className="font-semibold text-gray-800">Your Location: {locationName}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-full border border-white shadow-sm"></div>
          <span className="text-gray-600">Verified Machinery & Service Coverage</span>
        </div>
      </div>
    </div>
  );
};
