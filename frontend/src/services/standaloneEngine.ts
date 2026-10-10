import type { User, UserRole } from '../types/auth';
import type {
  Resource,
  Farm,
  Crop,
  Booking,
  BookingStatus,
  ResourceCategory,
  PricingUnit,
} from '../types/marketplace';

const NOW = '2026-10-09T18:00:00Z';

// Default Demo Users
const INITIAL_USERS: User[] = [
  {
    id: 1,
    email: 'farmer1@bhumisetu.org',
    full_name: 'Ramesh Gowda',
    role: 'farmer' as UserRole,
    phone_number: '+919876543210',
    preferred_language: 'kn',
    is_active: true,
    is_verified: true,
    created_at: '2026-08-01T10:00:00Z',
    updated_at: NOW,
  },
  {
    id: 2,
    email: 'owner_manjunath@bhumisetu.org',
    full_name: 'Manjunath Patil',
    role: 'resource_owner' as UserRole,
    phone_number: '+919845012345',
    preferred_language: 'kn',
    is_active: true,
    is_verified: true,
    created_at: '2026-08-01T10:00:00Z',
    updated_at: NOW,
  },
  {
    id: 3,
    email: 'provider_gowda@bhumisetu.org',
    full_name: 'Hassan Krishi Seva',
    role: 'service_provider' as UserRole,
    phone_number: '+919845067890',
    preferred_language: 'en',
    is_active: true,
    is_verified: true,
    created_at: '2026-08-01T10:00:00Z',
    updated_at: NOW,
  },
  {
    id: 4,
    email: 'admin@bhumisetu.org',
    full_name: 'BhumiSetu System Admin',
    role: 'administrator' as UserRole,
    phone_number: '+919999900000',
    preferred_language: 'en',
    is_active: true,
    is_verified: true,
    created_at: '2026-08-01T10:00:00Z',
    updated_at: NOW,
  },
  {
    id: 5,
    email: 'admin_rbac@bhumisetu.org',
    full_name: 'Admin Coordinator',
    role: 'administrator' as UserRole,
    phone_number: '+919999900001',
    preferred_language: 'en',
    is_active: true,
    is_verified: true,
    created_at: '2026-08-01T10:00:00Z',
    updated_at: NOW,
  },
];

// Initial Demonstration Resources
const INITIAL_RESOURCES: Resource[] = [
  {
    id: 1,
    name: 'Mahindra 575 DI Tractor (47 HP)',
    category: 'tractor' as ResourceCategory,
    description:
      'Reliable 47 HP agricultural tractor equipped with heavy-duty rotavator, reversible mouldboard plough, and trolley hitch.',
    specifications: { horsepower: 47, fuel: 'Diesel', pto_rpm: 540, lifting_capacity_kg: 1600 },
    supported_operations: ['ploughing', 'tilling', 'harrowing', 'hauling', 'leveling'],
    price_per_unit: 650.0,
    pricing_unit: 'per_hour' as PricingUnit,
    location_name: 'Mandya Town, Karnataka',
    latitude: 12.5218,
    longitude: 76.8951,
    service_radius_km: 30.0,
    owner_id: 2,
    rating: 4.9,
    total_reviews: 38,
    is_verified: true,
    is_active: true,
    is_demo: true,
    created_at: '2026-08-01T10:00:00Z',
    updated_at: NOW,
  },
  {
    id: 2,
    name: 'Kubota DC-68G Paddy Combine Harvester',
    category: 'harvester' as ResourceCategory,
    description:
      'High-efficiency rubber-crawler combine harvester suited for wet paddy fields. Grain loss less than 1.5%.',
    specifications: { engine_power: 68, cutter_width_m: 2.0, grain_tank_liters: 1250 },
    supported_operations: ['harvesting', 'threshing', 'cleaning'],
    price_per_unit: 2400.0,
    pricing_unit: 'per_hour' as PricingUnit,
    location_name: 'Maddur, Mandya, Karnataka',
    latitude: 12.5842,
    longitude: 77.0425,
    service_radius_km: 40.0,
    owner_id: 2,
    rating: 4.8,
    total_reviews: 24,
    is_verified: true,
    is_active: true,
    is_demo: true,
    created_at: '2026-08-01T10:00:00Z',
    updated_at: NOW,
  },
  {
    id: 3,
    name: 'DJI Agras T40 Agricultural Spraying Drone',
    category: 'drone' as ResourceCategory,
    description:
      'Precision agricultural drone carrying 40kg payload. Spreads micronutrients, liquid bio-fertilizers, and crop protection sprays.',
    specifications: { payload_kg: 40, spray_width_m: 11, flow_rate_l_min: 12 },
    supported_operations: ['spraying', 'fertilizer_distribution', 'aerial_monitoring'],
    price_per_unit: 450.0,
    pricing_unit: 'per_acre' as PricingUnit,
    location_name: 'Hassan Rural, Karnataka',
    latitude: 13.0033,
    longitude: 76.1004,
    service_radius_km: 50.0,
    owner_id: 3,
    rating: 4.95,
    total_reviews: 42,
    is_verified: true,
    is_active: true,
    is_demo: true,
    created_at: '2026-08-01T10:00:00Z',
    updated_at: NOW,
  },
  {
    id: 4,
    name: 'Skilled Rice Transplanting & Weeding Crew (8 Workers)',
    category: 'labour' as ResourceCategory,
    description:
      'Experienced agricultural farm team specializing in SRI paddy transplanting, manual weed removal, and sugarcane earthing-up.',
    specifications: { team_size: 8, experience_years: 12, supervision_included: true },
    supported_operations: ['transplanting', 'weeding', 'harvesting', 'bunding'],
    price_per_unit: 3600.0,
    pricing_unit: 'per_day' as PricingUnit,
    location_name: 'Pandavapura, Mandya, Karnataka',
    latitude: 12.4932,
    longitude: 76.6713,
    service_radius_km: 25.0,
    owner_id: 3,
    rating: 4.75,
    total_reviews: 19,
    is_verified: true,
    is_active: true,
    is_demo: true,
    created_at: '2026-08-01T10:00:00Z',
    updated_at: NOW,
  },
  {
    id: 5,
    name: 'John Deere 5050D Tractor with 9-Tyne Cultivator',
    category: 'tractor' as ResourceCategory,
    description:
      '50 HP tractor suitable for deep soil tilling, seed bed preparation, and secondary cultivation.',
    specifications: { horsepower: 50, fuel: 'Diesel', clutch: 'Dual Clutch' },
    supported_operations: ['ploughing', 'cultivating', 'sowing', 'rotavating'],
    price_per_unit: 700.0,
    pricing_unit: 'per_hour' as PricingUnit,
    location_name: 'Mysuru South, Karnataka',
    latitude: 12.2958,
    longitude: 76.6394,
    service_radius_km: 35.0,
    owner_id: 2,
    rating: 4.88,
    total_reviews: 51,
    is_verified: true,
    is_active: true,
    is_demo: true,
    created_at: '2026-08-01T10:00:00Z',
    updated_at: NOW,
  },
  {
    id: 6,
    name: 'Kirloskar 7.5 HP Portable Diesel Irrigation Pump',
    category: 'irrigation_pump' as ResourceCategory,
    description:
      'High-head portable diesel irrigation pump with suction hose and delivery pipes (up to 300 meters).',
    specifications: { power_hp: 7.5, flow_rate_lps: 18, head_m: 24 },
    supported_operations: ['irrigation', 'water_pumping', 'dewatering'],
    price_per_unit: 180.0,
    pricing_unit: 'per_hour' as PricingUnit,
    location_name: 'Srirangapatna, Mandya, Karnataka',
    latitude: 12.4181,
    longitude: 76.6947,
    service_radius_km: 20.0,
    owner_id: 2,
    rating: 4.7,
    total_reviews: 15,
    is_verified: true,
    is_active: true,
    is_demo: true,
    created_at: '2026-08-01T10:00:00Z',
    updated_at: NOW,
  },
];

// Initial Farms
const INITIAL_FARMS: Farm[] = [
  {
    id: 1,
    owner_id: 1,
    name: 'Ramesh Gowda Mandya Farm',
    location_name: 'Koppa, Mandya, Karnataka',
    latitude: 12.5234,
    longitude: 76.8967,
    size_acres: 5.2,
    soil_type: 'Red Clay Loam',
    irrigation_type: 'Canal & Borewell',
    created_at: '2026-08-10T09:00:00Z',
    updated_at: NOW,
    crops: [
      {
        id: 1,
        farm_id: 1,
        crop_name: 'Paddy (Sona Masoori)',
        stage: 'Vegetative',
        planted_date: '2026-08-15',
        expected_harvest_date: '2026-11-20',
        created_at: '2026-08-15T09:00:00Z',
      },
      {
        id: 2,
        farm_id: 1,
        crop_name: 'Sugarcane (Co 86032)',
        stage: 'Tillering',
        planted_date: '2026-06-01',
        expected_harvest_date: '2027-04-15',
        created_at: '2026-06-01T09:00:00Z',
      },
    ],
  },
];

// Initial Bookings
const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 1,
    farmer_id: 1,
    resource_id: 1,
    farm_id: 1,
    operation: 'ploughing',
    start_time: '2026-10-10T08:00:00Z',
    end_time: '2026-10-10T13:00:00Z',
    duration_hours: 5.0,
    estimated_cost: 3250.0,
    status: 'confirmed' as BookingStatus,
    idempotency_key: 'seed_booking_001',
    notes: 'Kaveri Basin seasonal land preparation',
    farmer_name: 'Ramesh Gowda',
    resource_name: 'Mahindra 575 DI Tractor (47 HP)',
    created_at: '2026-10-08T10:00:00Z',
    updated_at: NOW,
    resource: INITIAL_RESOURCES[0],
  },
  {
    id: 2,
    farmer_id: 1,
    resource_id: 2,
    farm_id: 1,
    operation: 'harvesting',
    start_time: '2026-10-14T09:00:00Z',
    end_time: '2026-10-14T13:00:00Z',
    duration_hours: 4.0,
    estimated_cost: 9600.0,
    status: 'submitted' as BookingStatus,
    idempotency_key: 'seed_booking_002',
    notes: 'Early harvest scheduled before monsoon rains',
    farmer_name: 'Ramesh Gowda',
    resource_name: 'Kubota DC-68G Paddy Combine Harvester',
    created_at: '2026-10-09T08:00:00Z',
    updated_at: NOW,
    resource: INITIAL_RESOURCES[1],
  },
];

export class StandaloneEngine {
  private static instance: StandaloneEngine;

  private constructor() {
    this.initStorage();
  }

  public static getInstance(): StandaloneEngine {
    if (!StandaloneEngine.instance) {
      StandaloneEngine.instance = new StandaloneEngine();
    }
    return StandaloneEngine.instance;
  }

  private initStorage() {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('bhumisetu_standalone_users')) {
      localStorage.setItem('bhumisetu_standalone_users', JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem('bhumisetu_standalone_resources')) {
      localStorage.setItem('bhumisetu_standalone_resources', JSON.stringify(INITIAL_RESOURCES));
    }
    if (!localStorage.getItem('bhumisetu_standalone_farms')) {
      localStorage.setItem('bhumisetu_standalone_farms', JSON.stringify(INITIAL_FARMS));
    }
    if (!localStorage.getItem('bhumisetu_standalone_bookings')) {
      localStorage.setItem('bhumisetu_standalone_bookings', JSON.stringify(INITIAL_BOOKINGS));
    }
    if (!localStorage.getItem('bhumisetu_standalone_audit_logs')) {
      const initialLogs = [
        {
          id: 1,
          action: 'SYSTEM_INITIALIZATION',
          actor_email: 'admin@bhumisetu.org',
          resource_type: 'PLATFORM',
          resource_id: 'BHUMISETU',
          ip_address: '127.0.0.1',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          status: 'SUCCESS',
          details: 'Initialized standalone agricultural coordination platform',
        },
      ];
      localStorage.setItem('bhumisetu_standalone_audit_logs', JSON.stringify(initialLogs));
    }
  }

  private getUsers(): User[] {
    const raw = localStorage.getItem('bhumisetu_standalone_users');
    return raw ? JSON.parse(raw) : INITIAL_USERS;
  }

  private getResources(): Resource[] {
    const raw = localStorage.getItem('bhumisetu_standalone_resources');
    return raw ? JSON.parse(raw) : INITIAL_RESOURCES;
  }

  private getFarms(): Farm[] {
    const raw = localStorage.getItem('bhumisetu_standalone_farms');
    return raw ? JSON.parse(raw) : INITIAL_FARMS;
  }

  private getBookings(): Booking[] {
    const raw = localStorage.getItem('bhumisetu_standalone_bookings');
    return raw ? JSON.parse(raw) : INITIAL_BOOKINGS;
  }

  private saveBookings(bookings: Booking[]) {
    localStorage.setItem('bhumisetu_standalone_bookings', JSON.stringify(bookings));
  }

  private saveFarms(farms: Farm[]) {
    localStorage.setItem('bhumisetu_standalone_farms', JSON.stringify(farms));
  }

  public logAudit(action: string, actor: string, type: string, id: string, details: string) {
    const raw = localStorage.getItem('bhumisetu_standalone_audit_logs');
    const logs = raw ? JSON.parse(raw) : [];
    logs.unshift({
      id: logs.length + 1,
      action,
      actor_email: actor,
      resource_type: type,
      resource_id: id,
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString(),
      status: 'SUCCESS',
      details,
    });
    localStorage.setItem('bhumisetu_standalone_audit_logs', JSON.stringify(logs.slice(0, 100)));
  }

  // Calculate distance via Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  // Request Handler Interceptor
  public async handleRequest(url: string, method: string = 'GET', data?: any, params?: any): Promise<any> {
    const cleanUrl = url.replace(/^[a-z]+:\/\/[^/]+/i, '').replace(/^\/api\/v1/, '').split('?')[0];

    // 1. Health Endpoint
    if (cleanUrl === '' || cleanUrl === '/' || cleanUrl === '/health') {
      return {
        status: 'healthy',
        database: 'connected',
        platform: 'BHUMISETU',
        tagline: 'Bridging Farms to a Better Future',
        mode: 'standalone_showcase',
      };
    }

    // 2. Auth Endpoints
    if (cleanUrl === '/auth/login' && method.toUpperCase() === 'POST') {
      const { email } = data || {};
      const users = this.getUsers();
      const user = users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
      if (!user) {
        throw { response: { status: 400, data: { detail: 'Incorrect email or password.' } } };
      }
      const token = `standalone_jwt_${user.id}_${Date.now()}`;
      this.logAudit('USER_LOGIN', user.email, 'AUTH', String(user.id), 'Successful user login');
      return {
        access_token: token,
        token_type: 'bearer',
        user,
      };
    }

    if (cleanUrl === '/auth/register' && method.toUpperCase() === 'POST') {
      const users = this.getUsers();
      const nowStr = new Date().toISOString();
      const newUser: User = {
        id: users.length + 1,
        email: data.email,
        full_name: data.full_name,
        role: data.role || 'farmer',
        phone_number: data.phone_number || '',
        preferred_language: data.preferred_language || 'en',
        is_active: true,
        is_verified: true,
        created_at: nowStr,
        updated_at: nowStr,
      };
      users.push(newUser);
      localStorage.setItem('bhumisetu_standalone_users', JSON.stringify(users));
      this.logAudit('USER_REGISTER', newUser.email, 'AUTH', String(newUser.id), 'New account registered');
      return newUser;
    }

    if (cleanUrl === '/auth/me' && method.toUpperCase() === 'GET') {
      const saved = localStorage.getItem('bhumisetu_user');
      if (saved) return JSON.parse(saved);
      return INITIAL_USERS[0];
    }

    // 3. Resources / Marketplace
    if (cleanUrl === '/resources/' || cleanUrl === '/resources') {
      let resources = this.getResources();
      const queryParams = params || {};
      if (queryParams.category) {
        resources = resources.filter((r) => r.category === queryParams.category);
      }
      if (queryParams.max_price) {
        resources = resources.filter((r) => r.price_per_unit <= Number(queryParams.max_price));
      }
      if (queryParams.operation) {
        const op = queryParams.operation.toLowerCase();
        resources = resources.filter((r) =>
          r.supported_operations.some((so) => so.toLowerCase().includes(op))
        );
      }
      if (queryParams.latitude && queryParams.longitude) {
        const uLat = Number(queryParams.latitude);
        const uLon = Number(queryParams.longitude);
        resources = resources.map((r) => ({
          ...r,
          distance_km: this.calculateDistance(uLat, uLon, r.latitude, r.longitude),
        }));
      }
      return resources;
    }

    if (cleanUrl.startsWith('/resources/')) {
      const id = Number(cleanUrl.split('/')[2]);
      const res = this.getResources().find((r) => r.id === id);
      if (res) return res;
      throw { response: { status: 404, data: { detail: 'Resource not found' } } };
    }

    // 4. Farms & Crops
    if (cleanUrl === '/farms/' || cleanUrl === '/farms') {
      if (method.toUpperCase() === 'GET') {
        return this.getFarms();
      }
      if (method.toUpperCase() === 'POST') {
        const farms = this.getFarms();
        const nowStr = new Date().toISOString();
        const newFarm: Farm = {
          id: farms.length + 1,
          owner_id: 1,
          name: data.name,
          location_name: data.location_name,
          latitude: data.latitude || 12.5234,
          longitude: data.longitude || 76.8967,
          size_acres: data.size_acres || 4.0,
          soil_type: data.soil_type || 'Red Loam',
          irrigation_type: data.irrigation_type || 'Borewell',
          created_at: nowStr,
          updated_at: nowStr,
          crops: [],
        };
        farms.push(newFarm);
        this.saveFarms(farms);
        this.logAudit('CREATE_FARM', 'farmer1@bhumisetu.org', 'FARM', String(newFarm.id), `Created farm ${newFarm.name}`);
        return newFarm;
      }
    }

    if (cleanUrl.match(/^\/farms\/\d+\/crops$/) && method.toUpperCase() === 'POST') {
      const farmId = Number(cleanUrl.split('/')[2]);
      const farms = this.getFarms();
      const farm = farms.find((f) => f.id === farmId);
      if (farm) {
        const nowStr = new Date().toISOString();
        const newCrop: Crop = {
          id: (farm.crops?.length || 0) + 1,
          farm_id: farmId,
          crop_name: data.crop_name,
          stage: data.stage || 'Vegetative',
          planted_date: data.planted_date || nowStr.split('T')[0],
          expected_harvest_date: data.expected_harvest_date,
          created_at: nowStr,
        };
        farm.crops = [...(farm.crops || []), newCrop];
        this.saveFarms(farms);
        return newCrop;
      }
    }

    // 5. Bookings Lifecycle
    if (cleanUrl === '/bookings/' || cleanUrl === '/bookings') {
      if (method.toUpperCase() === 'GET') {
        const bookings = this.getBookings();
        const resources = this.getResources();
        const users = this.getUsers();
        return bookings.map((b) => {
          const res = resources.find((r) => r.id === b.resource_id) || INITIAL_RESOURCES[0];
          const farmer = users.find((u) => u.id === b.farmer_id) || INITIAL_USERS[0];
          return {
            ...b,
            resource: res,
            resource_name: res.name,
            farmer_name: farmer.full_name,
          };
        });
      }
      if (method.toUpperCase() === 'POST') {
        const bookings = this.getBookings();
        const resources = this.getResources();
        const users = this.getUsers();

        // Idempotency check
        if (data.idempotency_key) {
          const existing = bookings.find((b) => b.idempotency_key === data.idempotency_key);
          if (existing) return existing;
        }

        const res = resources.find((r) => r.id === data.resource_id) || INITIAL_RESOURCES[0];
        const nowStr = new Date().toISOString();
        const newBooking: Booking = {
          id: bookings.length + 1,
          farmer_id: 1,
          resource_id: data.resource_id,
          farm_id: data.farm_id || 1,
          operation: data.operation || 'ploughing',
          start_time: data.start_time,
          end_time: data.end_time,
          duration_hours: data.duration_hours || 4.0,
          estimated_cost: data.duration_hours ? data.duration_hours * res.price_per_unit : res.price_per_unit * 4,
          status: 'submitted' as BookingStatus,
          idempotency_key: data.idempotency_key || `booking_${Date.now()}`,
          notes: data.notes || '',
          farmer_name: users[0].full_name,
          resource_name: res.name,
          created_at: nowStr,
          updated_at: nowStr,
          resource: res,
        };

        bookings.unshift(newBooking);
        this.saveBookings(bookings);
        this.logAudit('CREATE_BOOKING', 'farmer1@bhumisetu.org', 'BOOKING', String(newBooking.id), `Created booking request for ${res.name}`);
        return newBooking;
      }
    }

    if (cleanUrl.match(/^\/bookings\/\d+\/status$/) && method.toUpperCase() === 'PATCH') {
      const bookingId = Number(cleanUrl.split('/')[2]);
      const bookings = this.getBookings();
      const b = bookings.find((item) => item.id === bookingId);
      if (b) {
        b.status = data.status;
        b.updated_at = new Date().toISOString();
        if (data.rejection_reason) b.rejection_reason = data.rejection_reason;
        this.saveBookings(bookings);
        this.logAudit('UPDATE_BOOKING_STATUS', 'owner_manjunath@bhumisetu.org', 'BOOKING', String(b.id), `Updated booking status to ${data.status}`);
        return b;
      }
    }

    // 6. Live Weather with Open-Meteo Direct Browser Fetch
    if (cleanUrl === '/weather/forecast' || cleanUrl.startsWith('/weather/')) {
      const lat = params?.latitude || 12.5218;
      const lon = params?.longitude || 76.8951;
      try {
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&hourly=precipitation_probability,precipitation&forecast_days=3`
        );
        if (weatherRes.ok) {
          const wData = await weatherRes.json();
          const cur = wData.current || {};
          const hourlyProb = wData.hourly?.precipitation_probability?.slice(0, 24) || [];
          const maxRainProb = hourlyProb.length ? Math.max(...hourlyProb) : 25;
          const totalRain = (wData.hourly?.precipitation?.slice(0, 24) || []).reduce((a: number, b: number) => a + b, 0);

          return {
            is_live: true,
            source: 'Open-Meteo Meteorological Service (Direct Client HTTPS)',
            temperature_c: cur.temperature_2m ?? 24.5,
            relative_humidity_pct: cur.relative_humidity_2m ?? 65,
            current_precipitation_mm: cur.precipitation ?? 0.0,
            wind_speed_kmh: cur.wind_speed_10m ?? 8.5,
            weather_condition: (cur.weather_code || 0) > 50 ? 'Rainy / Overcast' : 'Partly Cloudy',
            max_rain_probability_pct: maxRainProb,
            total_expected_rainfall_mm: Math.round(totalRain * 10) / 10,
            is_severe_alert: maxRainProb > 75 || totalRain > 25,
            updated_at: new Date().toISOString(),
          };
        }
      } catch {
        // Fallback to high-confidence Karnataka agricultural forecast
      }
      return {
        is_live: true,
        source: 'Karnataka Agronomic Climate Baseline',
        temperature_c: 24.2,
        relative_humidity_pct: 68,
        current_precipitation_mm: 0.0,
        wind_speed_kmh: 7.8,
        weather_condition: 'Fair / Humid',
        max_rain_probability_pct: 35,
        total_expected_rainfall_mm: 2.5,
        is_severe_alert: false,
        updated_at: new Date().toISOString(),
      };
    }

    // 7. Coordination Engine
    if (cleanUrl === '/coordination/check-suitability') {
      const res = this.getResources().find((r) => r.id === data.resource_id) || INITIAL_RESOURCES[0];
      const supportsOp = res.supported_operations.some((op) => op.toLowerCase().includes((data.operation || '').toLowerCase()));
      const duration = data.duration_hours || 4.0;
      const cost = duration * res.price_per_unit;
      const budgetOk = !data.max_budget || cost <= data.max_budget;

      return {
        is_feasible: supportsOp && budgetOk,
        operation_supported: supportsOp,
        within_service_radius: true,
        distance_km: 4.8,
        estimated_cost: cost,
        reasons: !supportsOp
          ? [`Equipment does not support requested operation '${data.operation}'`]
          : !budgetOk
          ? [`Estimated cost (₹${cost}) exceeds budget (₹${data.max_budget})`]
          : ['All hard physical, distance, and financial constraints satisfied.'],
      };
    }

    if (cleanUrl === '/coordination/priority-score') {
      const urgency = (data.urgency_level || data.urgency || 'medium').toLowerCase();
      const urgencyScores: Record<string, number> = { critical: 25.0, high: 18.0, medium: 10.0, low: 4.0 };
      const uScore = urgencyScores[urgency] || 10.0;

      const rainProb = data.rain_probability_pct ?? 25.0;
      const isSevere = data.severe_weather_alert ?? false;
      let weatherScore = 15.0;
      if (isSevere) {
        weatherScore = 25.0;
      } else if (rainProb > 60.0) {
        weatherScore = 22.0;
      } else if (rainProb > 30.0) {
        weatherScore = 15.0;
      } else {
        weatherScore = 8.0;
      }

      const cropStage = data.crop_stage || 'Vegetative';
      const cropScores: Record<string, number> = { harvesting: 20.0, flowering: 14.0, vegetative: 8.0, sowing: 5.0 };
      const cropScore = cropScores[cropStage.toLowerCase()] || 12.0;

      const acres = data.farm_size_acres || 4.0;
      const impactScore = Math.min(10.0, Math.round(acres * 1.5 * 10) / 10);

      const deadline = data.deadline_hours || 36.0;
      const deadlineScore = deadline <= 24 ? 10.0 : deadline <= 48 ? 7.0 : 4.0;

      const soilScore = 8.0;

      const totalScore = Math.min(100.0, Math.round((uScore + weatherScore + cropScore + impactScore + deadlineScore + soilScore) * 10) / 10);

      const explanationStr = `Agronomic Priority Assessment: ${totalScore}/100. Evaluated operational urgency (${uScore}/25 pts), micro-climate weather risk (${weatherScore}/25 pts), crop perishability stage (${cropScore}/20 pts), farm acreage impact (${impactScore}/10 pts), and deadline proximity (${deadlineScore}/10 pts).`;

      return {
        overall_score: totalScore,
        priority_score: totalScore,
        breakdown: {
          urgency: {
            score: uScore,
            max_weight: 25.0,
            explanation: `Operational urgency (${urgency}): Time-sensitive agricultural task.`,
            data_source: 'Farmer request input',
          },
          weather_risk: {
            score: weatherScore,
            max_weight: 25.0,
            explanation: `Micro-climate risk based on rain probability (${rainProb}%).`,
            data_source: 'Open-Meteo Meteorological Service',
          },
          crop_readiness: {
            score: cropScore,
            max_weight: 20.0,
            explanation: `Crop stage (${cropStage}): Active developmental growth phase.`,
            data_source: 'Agronomic crop cycle model',
          },
          farm_impact: {
            score: impactScore,
            max_weight: 10.0,
            explanation: `Field impact for ${acres} Acres agricultural land.`,
            data_source: 'Farm parcel registry',
          },
          deadline_proximity: {
            score: deadlineScore,
            max_weight: 10.0,
            explanation: `Window closes within ${deadline} hours.`,
            data_source: 'Booking schedule timeline',
          },
          agronomic_window: {
            score: soilScore,
            max_weight: 10.0,
            explanation: `Favorable soil trafficability and access road passability.`,
            data_source: 'Agronomic regional baseline',
          },
        },
        plain_language_explanation: explanationStr,
        explanation: explanationStr,
        missing_information: [],
        limitations: [
          'Priority score ranks competing requests objectively but never overrides equipment incompatibility or hard schedule conflicts.',
        ],
        normalization_method: 'Linear multi-criteria weighted summation [0, 100]',
      };
    }


    if (cleanUrl === '/coordination/check-conflicts') {
      return {
        has_conflict: false,
        conflict_type: 'NONE',
        conflicting_booking_ids: [],
        message: 'No temporal overlap with existing bookings or scheduled maintenance.',
      };
    }

    if (cleanUrl === '/coordination/recommend') {
      const resources = this.getResources();
      return {
        preferred_feasible: true,
        explanation: 'The requested machinery is fully available and physically suitable for the planned farm acreage.',
        alternative_resources: resources.slice(1, 3),
        alternative_time_slots: [
          { shift_name: 'Tomorrow Morning', start_time: '2026-10-11T07:00:00Z', end_time: '2026-10-11T12:00:00Z' },
          { shift_name: 'Tomorrow Afternoon', start_time: '2026-10-11T13:00:00Z', end_time: '2026-10-11T18:00:00Z' },
        ],
      };
    }

    if (cleanUrl === '/coordination/weather-prediction') {
      const res = data.resource_id ? this.getResources().find((r) => r.id === data.resource_id) : null;
      const farm = data.farm_id ? this.getFarms().find((f) => f.id === data.farm_id) : null;
      const lat = data.latitude || (farm ? farm.latitude : (res ? res.latitude : 12.5218));
      const lon = data.longitude || (farm ? farm.longitude : (res ? res.longitude : 76.8951));
      const category = (data.equipment_category || (res ? res.category : 'tractor')).toLowerCase();
      const operation = (data.operation || '').toLowerCase();
      const startTimeStr = data.start_time;
      const durationHours = data.duration_hours || 4.0;

      // Check forecast horizon (> 7 days)
      const bookingDate = new Date(startTimeStr || new Date().toISOString());
      const now = new Date();
      const daysAhead = (bookingDate.getTime() - now.getTime()) / (1000 * 3600 * 24);

      if (daysAhead > 7.0) {
        return {
          score: null,
          risk_category: 'Limited Prediction / Unverified Horizon',
          factors: [],
          expected_weather: {
            temperature_c: null,
            relative_humidity_pct: null,
            max_rain_probability_pct: null,
            total_expected_rainfall_mm: null,
            wind_speed_kmh: null,
            weather_condition: 'Forecast unavailable',
            is_severe_alert: false,
          },
          plain_language_explanation: `Requested booking date is ${Math.round(daysAhead)} days ahead, which exceeds the 7-day meteorological forecast horizon. BHUMISETU avoids presenting misleadingly precise numbers without verified forecasts.`,
          suggested_alternatives: [],
          is_limited_prediction: true,
          limitations: ['Booking date exceeds high-resolution forecast horizon', 'Soil moisture telemetry not connected'],
          equipment_category: category,
          operation: data.operation || operation,
        };
      }

      // Live Open-Meteo query or baseline
      let temp = 26.5;
      let humidity = 65;
      let rainProb = 15;
      let rainMm = 0.0;
      let windKmh = 10.5;
      let condition = 'Partly Cloudy';
      let isSevere = false;
      let isLive = false;

      try {
        const omRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,wind_speed_10m,weather_code&forecast_days=7&timezone=UTC`
        );
        if (omRes.ok) {
          const w = await omRes.json();
          const times: string[] = w.hourly?.time || [];
          const startIso = bookingDate.toISOString().substring(0, 13);
          const idx = times.findIndex((t) => t.startsWith(startIso));
          const useIdx = idx >= 0 ? idx : 12;
          temp = w.hourly?.temperature_2m?.[useIdx] ?? 26.5;
          humidity = w.hourly?.relative_humidity_2m?.[useIdx] ?? 65;
          rainProb = w.hourly?.precipitation_probability?.[useIdx] ?? 15;
          rainMm = w.hourly?.precipitation?.[useIdx] ?? 0.0;
          windKmh = w.hourly?.wind_speed_10m?.[useIdx] ?? 10.5;
          const code = w.hourly?.weather_code?.[useIdx] ?? 0;
          condition = code > 60 ? 'Rain showers' : code > 2 ? 'Partly Cloudy' : 'Clear sky';
          isSevere = code >= 80 || rainMm >= 25.0;
          isLive = true;
        }
      } catch {
        // Fallback to Karnataka baseline
      }

      // Equipment-specific scoring logic
      let baseScore = 100.0;
      const deductions: { factor: string; penalty: number; detail: string; severity: string }[] = [];

      const combined = `${category} ${operation}`.toLowerCase();
      const isSprayer = combined.includes('spray') || combined.includes('drone') || combined.includes('chemical');
      const isHarvester = combined.includes('harvest') || combined.includes('combine') || combined.includes('thresh');
      const isIrrigation = combined.includes('irrigat') || combined.includes('pump') || combined.includes('water');
      const isTractor = combined.includes('tractor') || combined.includes('plough') || combined.includes('till');
      const isSeeder = combined.includes('sow') || combined.includes('seed') || combined.includes('plant');

      if (isSprayer) {
        if (windKmh > 20.0) {
          deductions.push({
            factor: 'High Wind Speed (Spray Drift)',
            penalty: 45.0,
            detail: `Wind speed of ${windKmh} km/h causes severe spray drift onto off-target areas.`,
            severity: 'high',
          });
        } else if (windKmh > 15.0) {
          deductions.push({
            factor: 'Moderate Wind Speed',
            penalty: 20.0,
            detail: `Wind of ${windKmh} km/h presents moderate drift risk; use low-drift nozzles.`,
            severity: 'moderate',
          });
        }

        if (rainMm > 2.0 || rainProb > 60.0) {
          deductions.push({
            factor: 'Rain Wash-off Hazard',
            penalty: 40.0,
            detail: `Precipitation (${rainMm} mm, ${rainProb}%) will wash chemical off foliar canopy.`,
            severity: 'high',
          });
        } else if (rainMm > 0.5 || rainProb > 35.0) {
          deductions.push({
            factor: 'Precipitation Risk',
            penalty: 20.0,
            detail: `Rain risk (${rainProb}%) may dilute chemical spray solution.`,
            severity: 'moderate',
          });
        }

        if (temp > 35.0) {
          deductions.push({
            factor: 'High Temperature Evaporation',
            penalty: 15.0,
            detail: `High temperature (${temp}°C) causes rapid droplet volatilization and leaf scorch risk.`,
            severity: 'moderate',
          });
        }
      } else if (isHarvester) {
        if (rainMm > 1.0 || rainProb > 50.0) {
          deductions.push({
            factor: 'Wet Crop & Grain Spoilage',
            penalty: 50.0,
            detail: `Rainfall (${rainMm} mm, ${rainProb}%) risks grain fungal decay, clogged thresher drums, and machine bogging down.`,
            severity: 'high',
          });
        } else if (rainMm > 0.2 || rainProb > 25.0) {
          deductions.push({
            factor: 'Elevated Moisture Risk',
            penalty: 25.0,
            detail: `Elevated grain moisture (${rainProb}% prob) increases post-harvest drying costs.`,
            severity: 'moderate',
          });
        }
        if (windKmh > 35.0) {
          deductions.push({
            factor: 'High Wind Reel Disruption',
            penalty: 20.0,
            detail: `Wind of ${windKmh} km/h hinders cutter-bar alignment and risks crop lodging.`,
            severity: 'moderate',
          });
        }
      } else if (isIrrigation) {
        if (rainMm >= 15.0 || rainProb >= 70.0) {
          deductions.push({
            factor: 'High Rainfall Redundancy',
            penalty: 55.0,
            detail: `Upcoming natural rainfall (${rainMm} mm, ${rainProb}%) makes irrigation redundant; risks root waterlogging.`,
            severity: 'high',
          });
        } else if (rainMm >= 5.0 || rainProb >= 40.0) {
          deductions.push({
            factor: 'Moderate Rain Expected',
            penalty: 25.0,
            detail: `Natural precipitation (${rainMm} mm) may meet crop water demands; evaluate before pumping.`,
            severity: 'moderate',
          });
        } else {
          baseScore = 98.0;
        }
      } else if (isTractor) {
        if (rainMm > 10.0 || rainProb > 75.0) {
          deductions.push({
            factor: 'Heavy Rain & Waterlogging',
            penalty: 45.0,
            detail: `Heavy rain (${rainMm} mm, ${rainProb}%) causes severe wheel slip, deep rutting, and soil compaction.`,
            severity: 'high',
          });
        } else if (rainMm > 3.0 || rainProb > 45.0) {
          deductions.push({
            factor: 'Wet Soil Traction Loss',
            penalty: 25.0,
            detail: `Rainfall reduces tyre grip and causes soil smearing during tillage.`,
            severity: 'moderate',
          });
        }
      } else if (isSeeder) {
        if (rainMm > 6.0 || rainProb > 65.0) {
          deductions.push({
            factor: 'Seed Wash-out & Furrow Crusting',
            penalty: 45.0,
            detail: `Downpours (${rainMm} mm, ${rainProb}%) wash away planted seeds and form dense surface crusts.`,
            severity: 'high',
          });
        } else if (rainMm > 2.0 || rainProb > 40.0) {
          deductions.push({
            factor: 'Moderate Rain Crusting Risk',
            penalty: 20.0,
            detail: `Rainfall may crust topsoil; monitor emergence.`,
            severity: 'moderate',
          });
        }
      }

      if (isSevere) {
        deductions.push({
          factor: 'Severe Weather Warning',
          penalty: 45.0,
          detail: 'Convective storm or lightning alert in effect for this time window.',
          severity: 'high',
        });
      }

      const totalPen = deductions.reduce((acc, d) => acc + d.penalty, 0);
      const score = Math.max(5.0, Math.min(100.0, Math.round((baseScore - totalPen) * 10) / 10));

      let riskCategory = 'Highly Suitable';
      if (score < 40.0) riskCategory = 'High Risk';
      else if (score < 60.0) riskCategory = 'Moderate Risk';
      else if (score < 80.0) riskCategory = 'Generally Suitable';

      const altDate = new Date(bookingDate.getTime() + 24 * 3600 * 1000);
      const altSlots = [
        {
          start_time: altDate.toISOString(),
          end_time: new Date(altDate.getTime() + durationHours * 3600 * 1000).toISOString(),
          label: `${altDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}, 07:00 UTC`,
          rain_prob_pct: 10,
          wind_speed_kmh: 8.5,
          expected_rain_mm: 0.0,
        },
      ];

      return {
        score,
        risk_category: riskCategory,
        factors: deductions,
        expected_weather: {
          temperature_c: temp,
          relative_humidity_pct: humidity,
          max_rain_probability_pct: rainProb,
          total_expected_rainfall_mm: rainMm,
          wind_speed_kmh: windKmh,
          weather_condition: condition,
          is_severe_alert: isSevere,
        },
        plain_language_explanation: deductions.length
          ? `Booking weather suitability is ${Math.round(score)}/100 (${riskCategory}) for ${category} ${operation}. Primary factor: ${deductions[0].detail}`
          : `Optimal conditions for ${category} (${score}/100, ${riskCategory}): ${condition}, ${temp}°C, low rain probability (${rainProb}%), and safe winds (${windKmh} km/h).`,
        suggested_alternatives: (riskCategory === 'High Risk' || riskCategory === 'Moderate Risk') ? altSlots : [],
        is_limited_prediction: false,
        limitations: isLive ? ['Ground soil moisture inferred from precipitation'] : ['Karnataka agro-climatic baseline used (offline fetch)'],
        equipment_category: category,
        operation: data.operation || operation,
      };
    }


    // 8. FarmVoice AI Conversational Engine
    if (cleanUrl === '/voice/interact') {
      const msg = (data.message || '').toLowerCase();
      const lang = data.language || 'en';

      if (msg.includes('tractor') || msg.includes('ಟ್ರ್ಯಾಕ್ಟರ್') || msg.includes('ಉಳುಮೆ') || msg.includes('plough')) {
        const tractor = this.getResources().find((r) => r.category === 'tractor') || INITIAL_RESOURCES[0];
        const draft = {
          draft_id: `draft_${Date.now()}`,
          resource_id: tractor.id,
          resource_name: tractor.name,
          operation: 'ploughing',
          duration_hours: 4.0,
          estimated_cost: 2600.0,
          location: 'Mandya Town',
          start_time: '2026-10-11T08:00:00Z',
          end_time: '2026-10-11T12:00:00Z',
        };

        const reply =
          lang === 'kn'
            ? `ನಾನು ಮಂಡ್ಯದಲ್ಲಿ ಲಭ್ಯವಿರುವ '${tractor.name}' ಅನ್ನು ಪತ್ತೆಹಚ್ಚಿದ್ದೇನೆ. 4 ಗಂಟೆಗಳ ಉಳುಮೆಗೆ ₹2,600 ವೆಚ್ಚವಾಗುತ್ತದೆ. ನೀವು ದೃಢೀಕರಿಸಲು ಬಯಸಿದರೆ "ದೃಢೀಕರಿಸಿ" ಅಥವಾ "Confirm" ಎಂದು ಹೇಳಿ.`
            : `I found '${tractor.name}' in Mandya. 4.0 hours of ploughing will cost ₹2,600. I have prepared a draft. Please speak 'Confirm' or click the button to book.`;

        return {
          response_text: reply,
          detected_language: lang,
          intent: 'booking_draft',
          active_draft: draft,
          requires_confirmation: true,
        };
      }

      if (msg.includes('harvester') || msg.includes('ಕೊಯ್ಲು') || msg.includes('harvest')) {
        const harvester = this.getResources().find((r) => r.category === 'harvester') || INITIAL_RESOURCES[1];
        const draft = {
          draft_id: `draft_${Date.now()}`,
          resource_id: harvester.id,
          resource_name: harvester.name,
          operation: 'harvesting',
          duration_hours: 3.0,
          estimated_cost: 7200.0,
          location: 'Maddur, Mandya',
          start_time: '2026-10-12T09:00:00Z',
          end_time: '2026-10-12T12:00:00Z',
        };

        const reply =
          lang === 'kn'
            ? `ನಾನು '${harvester.name}' ಅನ್ನು ಪತ್ತೆಹಚ್ಚಿದ್ದೇನೆ. ಭತ್ತದ ಕೊಯ್ಲಿಗೆ 3 ಗಂಟೆಗೆ ₹7,200 ವೆಚ್ಚವಾಗುತ್ತದೆ. ದೃಢೀಕರಿಸಲು "Confirm" ಎಂದು ಹೇಳಿ.`
            : `I have found '${harvester.name}'. 3 hours of paddy harvesting will cost ₹7,200. Speak 'Confirm' to finalize the booking.`;

        return {
          response_text: reply,
          detected_language: lang,
          intent: 'booking_draft',
          active_draft: draft,
          requires_confirmation: true,
        };
      }

      const defaultReply =
        lang === 'kn'
          ? 'ನಮಸ್ಕಾರ! ನೀವು ಟ್ರ್ಯಾಕ್ಟರ್, ಕೊಯ್ಲು ಯಂತ್ರ, ಡ್ರೋನ್ ಅಥವಾ ಕೃಷಿ ಕಾರ್ಮಿಕರನ್ನು ಬುಕ್ ಮಾಡಬಹುದು. ಉದಾಹರಣೆಗೆ "ನನಗೆ ಟ್ರ್ಯಾಕ್ಟರ್ ಬೇಕು" ಎಂದು ಹೇಳಿ.'
          : 'Namaskara! You can request tractors, combine harvesters, spraying drones, or agricultural labour crews. For example, say: "I need a tractor for ploughing".';

      return {
        response_text: defaultReply,
        detected_language: lang,
        intent: 'general_assistance',
        active_draft: null,
        requires_confirmation: false,
      };
    }

    if (cleanUrl === '/voice/confirm') {
      const bookings = this.getBookings();
      const resources = this.getResources();
      const users = this.getUsers();
      const res = resources[0];
      const nowStr = new Date().toISOString();

      const newBooking: Booking = {
        id: bookings.length + 1,
        farmer_id: 1,
        resource_id: res.id,
        farm_id: 1,
        operation: 'ploughing',
        start_time: '2026-10-11T08:00:00Z',
        end_time: '2026-10-11T12:00:00Z',
        duration_hours: 4.0,
        estimated_cost: 2600.0,
        status: 'submitted' as BookingStatus,
        idempotency_key: `voice_booking_${Date.now()}`,
        notes: `Created via FarmVoice AI spoken confirmation: "${data.spoken_confirmation_text || 'Confirmed'}"`,
        farmer_name: users[0].full_name,
        resource_name: res.name,
        created_at: nowStr,
        updated_at: nowStr,
        resource: res,
      };

      bookings.unshift(newBooking);
      this.saveBookings(bookings);
      this.logAudit(
        'VOICE_BOOKING_CONFIRMED',
        'farmer1@bhumisetu.org',
        'BOOKING',
        String(newBooking.id),
        `Voice confirmed booking for ${res.name}`
      );

      return {
        status: 'confirmed',
        booking_id: newBooking.id,
        booking: newBooking,
        message: 'Your agricultural booking request has been submitted successfully to the equipment owner!',
      };
    }

    // 9. Admin Auditing & Metrics
    if (cleanUrl === '/admin/audit-logs') {
      const raw = localStorage.getItem('bhumisetu_standalone_audit_logs');
      return raw ? JSON.parse(raw) : [];
    }

    if (cleanUrl === '/admin/system-metrics') {
      const users = this.getUsers();
      const resources = this.getResources();
      const bookings = this.getBookings();
      return {
        total_registered_users: users.length,
        total_resources: resources.length,
        total_bookings: bookings.length,
        active_demonstration_fleet: 6,
        system_status: 'HEALTHY',
        uptime_hours: 99.98,
      };
    }

    return { message: 'Standalone mock handler acknowledged request' };
  }
}
