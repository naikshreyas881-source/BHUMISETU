import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  Tractor,
  AlertCircle,
  Compass,
  LayoutGrid,
  Map,
} from 'lucide-react';
import apiClient from '../api/client';
import type { Resource, ResourceCategory } from '../types/marketplace';
import { BookingModal } from '../components/marketplace/BookingModal';
import { ResourceMap } from '../components/marketplace/ResourceMap';
import { WeatherWidget } from '../components/weather/WeatherWidget';
import { useLanguage } from '../i18n/LanguageContext';

const CATEGORIES: { label: string; value: ResourceCategory | 'all' }[] = [
  { label: 'All Equipment & Labour', value: 'all' },
  { label: 'Tractors', value: 'tractor' },
  { label: 'Combine Harvesters', value: 'harvester' },
  { label: 'Agricultural Drones', value: 'drone' },
  { label: 'Farm Labour Teams', value: 'labour' },
  { label: 'Irrigation Pumps', value: 'irrigation_pump' },
  { label: 'Spraying Equipment', value: 'sprayer' },
  { label: 'Cultivators & Tillers', value: 'cultivator' },
];

export const MarketplacePage: React.FC = () => {
  const { t } = useLanguage();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // View toggle
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [operationQuery, setOperationQuery] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number>(3000);

  // Modal
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const fetchResources = async () => {
    setIsLoading(true);
    setError(null);

    const params: Record<string, any> = {};
    if (selectedCategory !== 'all') params.category = selectedCategory;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (operationQuery.trim()) params.operation = operationQuery.trim();
    if (maxPrice < 3000) params.max_price = maxPrice;

    try {
      const res = await apiClient.get<Resource[]>('/resources/', { params });
      setResources(res.data);
    } catch (err: any) {
      setError('Failed to load resource marketplace listings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [selectedCategory, maxPrice]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResources();
  };

  const handleBookingSuccess = (bookingId: number) => {
    setSuccessNotice(`Booking request #${bookingId} submitted successfully! You can track approval in Bookings.`);
    setTimeout(() => setSuccessNotice(null), 6000);
  };

  return (
    <div className="space-y-8 py-6">
      {/* Agricultural Weather Banner */}
      <WeatherWidget />

      {/* Page Title & Search Bar */}
      <div className="bg-forest-900 text-white rounded-3xl p-6 sm:p-10 border border-forest-800 shadow-md">
        <div className="max-w-2xl space-y-2 mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-leaf-300">
            {t.marketplace.title}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-cream-100">
            Find Agricultural Equipment & Labour
          </h1>
          <p className="text-sm text-leaf-200/90">
            {t.marketplace.subtitle}
          </p>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.marketplace.searchPlaceholder}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-leaf-400"
            />
          </div>

          <div className="relative sm:w-64">
            <Compass className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={operationQuery}
              onChange={(e) => setOperationQuery(e.target.value)}
              placeholder="Operation (ploughing, tilling)..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-leaf-400"
            />
          </div>

          <button
            type="submit"
            className="bg-leaf-400 hover:bg-leaf-300 text-forest-900 font-bold px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 text-sm"
          >
            Search
          </button>
        </form>
      </div>

      {successNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between animate-in fade-in">
          <span>{successNotice}</span>
          <Link to="/bookings" className="font-bold underline text-xs">
            View My Bookings →
          </Link>
        </div>
      )}

      {/* Filter Chips Bar & View Toggle */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none flex-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedCategory === cat.value
                    ? 'bg-forest-800 text-white border-forest-900 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grid vs Map Toggle */}
          <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm self-start sm:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'grid'
                  ? 'bg-forest-800 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{t.marketplace.viewGrid}</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'map'
                  ? 'bg-forest-800 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>{t.marketplace.viewMap}</span>
            </button>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 font-bold text-gray-700">
            <span>{t.marketplace.budgetMax}:</span>
            <span className="text-forest-800 text-sm font-extrabold">₹{maxPrice}</span>
          </div>
          <div className="flex items-center space-x-3 flex-1 sm:max-w-xs">
            <span className="text-gray-400 text-[10px]">₹200</span>
            <input
              type="range"
              min={200}
              max={3000}
              step={100}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-leaf-600 cursor-pointer"
            />
            <span className="text-gray-400 text-[10px]">₹3000+</span>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {error && (
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {viewMode === 'map' ? (
        /* Map View */
        <div className="space-y-4">
          <ResourceMap
            resources={resources}
            onSelectResource={(r) => {
              setSelectedResource(r);
              setIsModalOpen(true);
            }}
          />
        </div>
      ) : (
        /* Grid View */
        isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-6 border border-gray-200 animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                <div className="h-16 bg-gray-100 rounded"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : resources.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3">
            <Tractor className="w-12 h-12 text-gray-400 mx-auto" />
            <h3 className="text-lg font-bold text-gray-800">No resources found</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Try adjusting your search criteria, category filters, or operation keywords.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setOperationQuery('');
              }}
              className="text-xs font-bold text-leaf-600 hover:underline pt-2 inline-block"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-forest-50 text-forest-800 border border-leaf-200">
                      {item.category.replace('_', ' ')}
                    </span>
                    {item.is_demo && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        {t.marketplace.demoTag}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-gray-900 group-hover:text-forest-700 transition">
                      {item.name}
                    </h3>
                    <div className="flex items-center space-x-1.5 text-xs text-gray-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-leaf-600 flex-shrink-0" />
                      <span>{item.location_name}</span>
                      {item.distance_km != null && (
                        <span className="font-semibold text-leaf-700">({item.distance_km} km away)</span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {item.supported_operations.map((op) => (
                      <span
                        key={op}
                        className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md"
                      >
                        {op}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-5 mt-5 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400 block">Rate</span>
                    <span className="text-lg font-black text-forest-800">
                      ₹{item.price_per_unit}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {' '}
                      {item.pricing_unit === 'per_hour' ? t.marketplace.perHour : t.marketplace.perAcre}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedResource(item);
                      setIsModalOpen(true);
                    }}
                    className="bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition active:scale-95"
                  >
                    {t.marketplace.bookNow}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Booking Modal with live coordination & priority scoring */}
      <BookingModal
        resource={selectedResource}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleBookingSuccess}
      />
    </div>
  );
};
