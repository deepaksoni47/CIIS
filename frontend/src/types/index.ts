export interface IssueCategory {
  WATER: "WATER";
  ELECTRICITY: "ELECTRICITY";
  WIFI: "WIFI";
  SANITATION: "SANITATION";
  CROWDING: "CROWDING";
  TEMPERATURE: "TEMPERATURE";
  OTHER: "OTHER";
}

export type IssueCategoryType = keyof IssueCategory;

export interface IssueStatus {
  OPEN: "OPEN";
  IN_PROGRESS: "IN_PROGRESS";
  RESOLVED: "RESOLVED";
  CLOSED: "CLOSED";
}

export type IssueStatusType = keyof IssueStatus;

export interface Location {
  latitude: number;
  longitude: number;
}

export interface Issue {
  id: string;
  category: IssueCategoryType;
  location: Location;
  severity: number;
  status: IssueStatusType;
  description?: string;
  building_id?: string;
  reported_by?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  metadata?: Record<string, any>;
}

export interface CreateIssueDto {
  category: IssueCategoryType;
  latitude: number;
  longitude: number;
  severity: number;
  description?: string;
  building_id?: string;
}

export interface UpdateIssueDto {
  status?: IssueStatusType;
  severity?: number;
  description?: string;
  assigned_to?: string;
}

export interface IssueFilters {
  category?: IssueCategoryType;
  status?: IssueStatusType;
  severity_min?: number;
  severity_max?: number;
  start_date?: string;
  end_date?: string;
  building_id?: string;
  limit?: number;
  offset?: number;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
  issueCount?: number;
  avgSeverity?: number;
  categories?: string[];
  issueIds?: string[];
}

export interface TrendData {
  period: string;
  count: number;
  avg_severity: number;
}

export interface RiskScore {
  zone_id?: string;
  building_id?: string;
  category?: IssueCategoryType;
  risk_score: number;
  recurrence_probability: number;
  issue_count: number;
  avg_severity: number;
}

export interface AIInsight {
  insight: string;
  recommendations: string[];
  data_points: Record<string, any>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
}
