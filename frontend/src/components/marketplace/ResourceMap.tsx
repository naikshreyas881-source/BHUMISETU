import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Resource } from '../../types/marketplace';

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

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Karnataka center: Mandya / Mysuru coordinates
      const map = L.map(mapContainerRef.current).setView([12.5218, 76.8951], 9);
      
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

    if (resources.length > 0 && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [resources, onSelectResource, selectedResourceId]);

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Legend Badge */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-gray-200 shadow-md text-xs space-y-1.5">
        <div className="font-bold text-gray-800">Karnataka Agricultural Fleet</div>
        <div className="flex items-center space-x-2 text-gray-600">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
          <span>Verified Machinery Marker</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <span className="w-3 h-3 rounded-full border border-emerald-400 bg-emerald-100 inline-block"></span>
          <span>Guaranteed Service Radius</span>
        </div>
      </div>
    </div>
  );
};
