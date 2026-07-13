export const API_ENDPOINTS = {
  HEALTH: '/health',
  DETECTIONS: '/api/detections',
  REPORTS: '/api/reports',
  DASHBOARD_SUMMARY: '/api/dashboard/summary',
  ROUTE_RECOMMENDATIONS: '/api/routes/recommendations',
  ACTIVE_ALERTS: '/api/alerts/active',
  REPAIR_DETECTION: (id: number) => `/api/detections/${id}/repair`,
} as const;

export const HAZARD_TYPES = {
  POTHOLE: 'pothole',
  PEDESTRIAN: 'pedestrian',
  ANIMAL: 'animal',
} as const;

export const ROAD_STATUS = {
  OPEN: 'open',
  REPAIRED: 'repaired',
  CRITICAL: 'critical',
} as const;

export const SEVERITY_LEVELS = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
} as const;

export const USER_ROLES = {
  DRIVER: 'driver',
  GOVERNMENT: 'government',
  ADMIN: 'admin',
} as const;
