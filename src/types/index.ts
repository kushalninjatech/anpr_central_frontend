// Organization Types
export interface Organization {
  id: number;
  name: string;
  code: string;
  location: string | null;
  description: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  token: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  location_count?: number;
  camera_count?: number;
  detection_count?: number;
}

export interface OrganizationCreate {
  name: string;
  code: string;
  location?: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active?: boolean;
}

export interface OrganizationUpdate {
  name?: string;
  code?: string;
  location?: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active?: boolean;
}

export interface OrganizationListResponse {
  organizations: Organization[];
  total: number;
}

// Location Types
export interface Location {
  id: number;
  organization_id: number;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  organization?: Organization;
  detection_count?: number;
}

export interface LocationCreate {
  organization_id: number;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  is_active?: boolean;
}

export interface LocationUpdate {
  name?: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  is_active?: boolean;
}

export interface LocationListResponse {
  locations: Location[];
  total: number;
}

// ANPR Detection Types
export type ProcessingStatus = 'pending' | 'processing' | 'retrying' | 'success' | 'failed';
export type NumberplateColor = 'white' | 'yellow' | 'black' | 'blue' | 'red' | 'green' | 'unknown';
export type VehicleSide = 'front' | 'back' | 'side' | 'unknown';
export type ActivityType = 'in' | 'out';

export interface Detection {
  detection_id: number;
  client_detection_id: string | null;
  organization_id: number;
  organization_name: string | null; // Organization name from join
  camera_id: string;
  camera_name: string | null;
  object_type: string | null; // Renamed from vehicle_class
  vehicle_track_id: string | null;
  activity_type: ActivityType | null;
  detected_at: string | null; // Client-side detection timestamp
  image_url: string | null; // URL for accessing the image (e.g., /uploads/detections/1/2025/01/uuid.jpg)
  status: ProcessingStatus;
  retry_count: number;
  error_message: string | null;
  created_at: string; // Server received timestamp
  updated_at: string;
  numberplate_available: boolean | null;
  numberplate_text: string | null; // Extracted numberplate text
  numberplate_color: NumberplateColor | null;
  vehicle_side: VehicleSide | null;
  llm_confidence: string | null;
  llm_reasoning?: string | null; // LLM raw response
}

export interface DetectionListResponse {
  detections: Detection[];
  total: number;
}

export interface DetectionStats {
  total_detections: number;
  pending_detections: number;
  processing_detections: number;
  success_detections: number;
  failed_detections: number;
  success_rate: number;
}

// Camera Types
export interface Camera {
  id?: number;
  camera_id: string;
  camera_name: string;
  organization_id: number;
  organization_name: string | null;
  location_name?: string | null;
  is_active?: boolean;
  stream_url?: string | null;
  detection_count: number;
  last_detection: string | null;
  first_detection: string | null;
  created_at?: string;
}

export interface CameraListResponse {
  cameras: Camera[];
  total: number;
}

// Dashboard Stats (System Stats for Super Admin)
export interface DashboardStats {
  total_organizations: number;
  active_organizations: number;
  total_detections: number;
  pending_detections: number;
  processing_detections: number;
  success_detections: number;
  failed_detections: number;
  total_cameras: number;
  total_in: number;
  total_out: number;
  active_occupancy: number;
}

// Organization Stats for Admin View
export interface OrganizationStats {
  id: number;
  name: string;
  code: string;
  is_super_admin: boolean;
  is_active: boolean;
  camera_count: number;
  detection_count: number;
  created_at: string;
  updated_at: string;
}

// Health Types
export interface HealthResponse {
  status: string;
  version: string;
  uptime_seconds: number;
  cpu_usage: number;
  ram_usage: number;
}

// API Response Types
export interface ApiError {
  detail: string;
}

// Sync Job Types
export type SyncJobStatus =
  | 'pending'
  | 'running'
  | 'cancelling'
  | 'completed'
  | 'completed_with_errors'
  | 'cancelled'
  | 'failed';

export interface SyncJob {
  id: number;
  ip: string | null;
  from_datetime: string;
  to_datetime: string;
  status: SyncJobStatus;
  total_records: number;
  success_count: number;
  fail_count: number;
  skipped_count: number;
  progress_percent: number;
  celery_task_id: string | null;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SyncJobCreate {
  from_datetime: string;
  to_datetime: string;
}

export interface SyncJobListResponse {
  jobs: SyncJob[];
  total: number;
}
