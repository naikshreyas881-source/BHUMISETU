export type ResourceCategory =
  | 'tractor'
  | 'harvester'
  | 'cultivator'
  | 'seed_drill'
  | 'sprayer'
  | 'drone'
  | 'irrigation_pump'
  | 'transport'
  | 'labour'
  | 'harvesting_service'
  | 'spraying_service'
  | 'other';

export type PricingUnit = 'per_hour' | 'per_acre' | 'per_day';

export type BookingStatus =
  | 'draft'
  | 'submitted'
  | 'pending_approval'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'completed';

export interface Crop {
  id: number;
  farm_id: number;
  crop_name: string;
  stage: string;
  planted_date?: string;
  expected_harvest_date?: string;
  created_at: string;
}

export interface Farm {
  id: number;
  owner_id: number;
  name: string;
  location_name: string;
  latitude: number;
  longitude: number;
  size_acres: number;
  soil_type?: string;
  irrigation_type?: string;
  created_at: string;
  updated_at: string;
  crops?: Crop[];
}

export interface Resource {
  id: number;
  owner_id: number;
  name: string;
  category: ResourceCategory;
  description: string;
  specifications?: Record<string, any>;
  supported_operations: string[];
  price_per_unit: number;
  pricing_unit: PricingUnit;
  location_name: string;
  latitude: number;
  longitude: number;
  service_radius_km: number;
  is_verified: boolean;
  is_active: boolean;
  is_demo: boolean;
  rating: number;
  total_reviews: number;
  image_url?: string;
  distance_km?: number;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: number;
  farmer_id: number;
  resource_id: number;
  farm_id?: number;
  operation: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  estimated_cost: number;
  status: BookingStatus;
  idempotency_key: string;
  notes?: string;
  rejection_reason?: string;
  resource_name?: string;
  farmer_name?: string;
  resource?: Resource;
  created_at: string;
  updated_at: string;
}
