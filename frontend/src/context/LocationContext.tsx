import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserLocation {
  latitude: number;
  longitude: number;
  locationName: string;
  accuracy?: number;
  isDetecting: boolean;
  error: string | null;
  source: 'gps' | 'manual' | 'default';
  detectLocation: () => Promise<void>;
  setCustomLocation: (lat: number, lon: number, name: string) => void;
}

// Default fallback location: Mandya Karnataka farming district
const DEFAULT_LOCATION = {
  latitude: 12.5218,
  longitude: 76.8951,
  locationName: 'Mandya, Karnataka',
};

const LocationContext = createContext<UserLocation | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [latitude, setLatitude] = useState<number>(() => {
    const saved = localStorage.getItem('bhumisetu_lat');
    return saved ? parseFloat(saved) : DEFAULT_LOCATION.latitude;
  });

  const [longitude, setLongitude] = useState<number>(() => {
    const saved = localStorage.getItem('bhumisetu_lon');
    return saved ? parseFloat(saved) : DEFAULT_LOCATION.longitude;
  });

  const [locationName, setLocationName] = useState<string>(() => {
    return localStorage.getItem('bhumisetu_location_name') || DEFAULT_LOCATION.locationName;
  });

  const [accuracy, setAccuracy] = useState<number | undefined>(undefined);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'gps' | 'manual' | 'default'>(() => {
    return (localStorage.getItem('bhumisetu_location_source') as any) || 'default';
  });

  // Reverse geocoding helper
  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const locality =
          addr.suburb ||
          addr.village ||
          addr.town ||
          addr.city ||
          addr.county ||
          addr.state_district ||
          'Local Area';
        const state = addr.state || addr.country || 'India';
        return `${locality}, ${state}`;
      }
    } catch (e) {
      console.warn('Reverse geocoding network notice:', e);
    }
    return `${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E`;
  };

  const detectLocation = async (): Promise<void> => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by your browser or device.');
      return;
    }

    setIsDetecting(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const acc = position.coords.accuracy;

          setLatitude(lat);
          setLongitude(lon);
          setAccuracy(acc);
          setSource('gps');

          localStorage.setItem('bhumisetu_lat', String(lat));
          localStorage.setItem('bhumisetu_lon', String(lon));
          localStorage.setItem('bhumisetu_location_source', 'gps');

          // Get human-readable town/city name
          const name = await reverseGeocode(lat, lon);
          setLocationName(name);
          localStorage.setItem('bhumisetu_location_name', name);

          setIsDetecting(false);
          resolve();
        },
        (err) => {
          let userMsg = 'Unable to retrieve location.';
          if (err.code === err.PERMISSION_DENIED) {
            userMsg = 'Location permission denied. Please allow GPS access in your browser settings.';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            userMsg = 'Location position unavailable. Check device GPS / network.';
          } else if (err.code === err.TIMEOUT) {
            userMsg = 'Location request timed out.';
          }
          setError(userMsg);
          setIsDetecting(false);
          resolve();
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 30000,
        }
      );
    });
  };

  const setCustomLocation = (lat: number, lon: number, name: string) => {
    setLatitude(lat);
    setLongitude(lon);
    setLocationName(name);
    setSource('manual');
    setError(null);

    localStorage.setItem('bhumisetu_lat', String(lat));
    localStorage.setItem('bhumisetu_lon', String(lon));
    localStorage.setItem('bhumisetu_location_name', name);
    localStorage.setItem('bhumisetu_location_source', 'manual');
  };

  // Auto-detect on first visit if permission is already granted
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted' && source !== 'manual') {
          detectLocation();
        }
      }).catch(() => {
        // Permissions query unsupported
      });
    }
  }, []);

  return (
    <LocationContext.Provider
      value={{
        latitude,
        longitude,
        locationName,
        accuracy,
        isDetecting,
        error,
        source,
        detectLocation,
        setCustomLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useUserLocation = (): UserLocation => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useUserLocation must be used within a LocationProvider');
  }
  return context;
};
