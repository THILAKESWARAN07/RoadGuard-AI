export interface Detection {
  id: number;
  hazard_type: string;
  latitude: number;
  longitude: number;
  confidence: number;
  severity: string;
  detection_count: number;
  risk_score: number;
  detected_at: string;
  repaired_at: string | null;
  image_url: string | null;
  status: string;
}

export interface Summary {
  total_detections: number;
  open_detections: number;
  critical_roads: number;
  repaired_roads: number;
  safety_score: number;
  recent_detections: Detection[];
}

export interface RouteRecommendation {
  name: string;
  distance_km: number;
  estimated_time_min: number;
  pothole_count: number;
  average_severity: string;
  road_score: number;
  recommendation: string;
}

export interface Report extends Detection {
  description: string | null;
}

export interface AlertItem {
  id: number;
  title: string;
  message: string;
  severity: string;
  detection_id: number;
  risk_score: number;
  created_at: string;
}

export type Role = 'driver' | 'government' | 'admin';
