import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Plus,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import apiClient from '../api/client';
import type { Farm } from '../types/marketplace';

export const FarmsPage: React.FC = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // New Farm form state
  const [showAddFarm, setShowAddFarm] = useState<boolean>(false);
  const [farmName, setFarmName] = useState<string>('');
  const [locationName, setLocationName] = useState<string>('');
  const [sizeAcres, setSizeAcres] = useState<number>(4.0);
  const [soilType, setSoilType] = useState<string>('Red Loam');
  const [irrigationType, setIrrigationType] = useState<string>('Borewell & Canal');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // New Crop form state
  const [selectedFarmForCrop, setSelectedFarmForCrop] = useState<number | null>(null);
  const [cropName, setCropName] = useState<string>('');
  const [cropStage, setCropStage] = useState<string>('Vegetative');

  const fetchFarms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<Farm[]>('/farms/');
      setFarms(res.data);
    } catch {
      setError('Failed to load farms from backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.post('/farms/', {
        name: farmName,
        location_name: locationName,
        latitude: 12.52, // Default Mandya approx
        longitude: 76.89,
        size_acres: sizeAcres,
        soil_type: soilType,
        irrigation_type: irrigationType,
      });

      setShowAddFarm(false);
      setFarmName('');
      setLocationName('');
      fetchFarms();
    } catch (err: any) {
      setError('Failed to create farm profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCrop = async (farmId: number) => {
    if (!cropName.trim()) return;
    try {
      await apiClient.post(`/farms/${farmId}/crops`, {
        crop_name: cropName,
        stage: cropStage,
      });
      setSelectedFarmForCrop(null);
      setCropName('');
      fetchFarms();
    } catch {
      setError('Failed to add crop to farm.');
    }
  };

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-leaf-600">
            Agricultural Property Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-forest-900">
            My Farms & Crops
          </h1>
          <p className="text-sm text-gray-600">
            Maintain your farm locations, acreage, and crop growth stages to streamline machinery matching.
          </p>
        </div>

        <button
          onClick={() => setShowAddFarm(!showAddFarm)}
          className="inline-flex items-center space-x-2 bg-forest-800 hover:bg-forest-900 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddFarm ? 'Cancel' : 'Add New Farm'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Add Farm Form Modal / Collapsible */}
      {showAddFarm && (
        <form onSubmit={handleCreateFarm} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4 animate-in fade-in">
          <h3 className="text-lg font-bold text-gray-900">Register Farm Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Farm Name
              </label>
              <input
                type="text"
                required
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="e.g. Gowda Organic Paddy Field"
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-leaf-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Location (Village, Taluk, District)
              </label>
              <input
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Koppa, Maddur, Mandya"
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-leaf-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Total Area (Acres)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={sizeAcres}
                onChange={(e) => setSizeAcres(Number(e.target.value))}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-leaf-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Soil Type
              </label>
              <input
                type="text"
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                placeholder="e.g. Red Loam, Black Cotton, Clay"
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-leaf-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Irrigation Source
              </label>
              <input
                type="text"
                value={irrigationType}
                onChange={(e) => setIrrigationType(e.target.value)}
                placeholder="e.g. Borewell, Canal, Drip, Rainfed"
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-leaf-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-leaf-500 hover:bg-leaf-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Saving Farm Profile...' : 'Save Farm Profile'}
          </button>
        </form>
      )}

      {/* Farms List */}
      {isLoading ? (
        <div className="p-12 text-center text-gray-500">
          <div className="w-8 h-8 border-4 border-leaf-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm">Loading farms...</p>
        </div>
      ) : farms.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3">
          <Sprout className="w-12 h-12 text-leaf-500 mx-auto" />
          <h3 className="text-lg font-bold text-gray-800">No farms registered yet</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Add your farm details to calculate precise acreage pricing and travel feasibility.
          </p>
          <button
            onClick={() => setShowAddFarm(true)}
            className="text-xs font-bold text-leaf-600 hover:underline pt-2 inline-block"
          >
            + Register your first farm
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {farms.map((farm) => (
            <div key={farm.id} className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-black text-gray-900">{farm.name}</h3>
                  <div className="flex items-center space-x-1 text-xs text-gray-500 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{farm.location_name}</span>
                  </div>
                </div>

                <span className="text-xs font-extrabold bg-leaf-50 text-forest-800 px-3 py-1 rounded-full border border-leaf-200">
                  {farm.size_acres} Acres
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Soil Type</span>
                  <span className="font-semibold text-gray-800">{farm.soil_type || 'Unspecified'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Irrigation</span>
                  <span className="font-semibold text-gray-800">{farm.irrigation_type || 'Rainfed'}</span>
                </div>
              </div>

              {/* Crops Section */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Active Crops ({farm.crops?.length || 0})
                  </h4>
                  <button
                    onClick={() => setSelectedFarmForCrop(selectedFarmForCrop === farm.id ? null : farm.id)}
                    className="text-xs font-semibold text-leaf-600 hover:underline"
                  >
                    + Add Crop
                  </button>
                </div>

                {selectedFarmForCrop === farm.id && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
                    <input
                      type="text"
                      placeholder="Crop name (e.g. Paddy, Sugarcane, Ragi)"
                      value={cropName}
                      onChange={(e) => setCropName(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs"
                    />
                    <div className="flex space-x-2">
                      <select
                        value={cropStage}
                        onChange={(e) => setCropStage(e.target.value)}
                        className="p-2 bg-white border border-gray-300 rounded-lg text-xs flex-1"
                      >
                        <option value="Sowing">Sowing</option>
                        <option value="Vegetative">Vegetative</option>
                        <option value="Flowering">Flowering</option>
                        <option value="Harvesting">Harvesting</option>
                      </select>
                      <button
                        onClick={() => handleAddCrop(farm.id)}
                        className="bg-forest-800 text-white px-3 py-1.5 rounded-lg font-bold text-xs"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  {(farm.crops || []).map((crop) => (
                    <div key={crop.id} className="flex items-center justify-between p-2 bg-cream-50/80 rounded-lg border border-cream-200 text-xs">
                      <span className="font-bold text-forest-900">{crop.crop_name}</span>
                      <span className="text-[10px] font-semibold bg-white text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                        {crop.stage}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
