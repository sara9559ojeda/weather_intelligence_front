// Tipos que reflejan las respuestas de la API (backend/app/schemas).

export interface Observation {
  observed_at: string;
  source: string;
  temperature_2m: number | null;
  relative_humidity_2m: number | null;
  dew_point_2m: number | null;
  apparent_temperature: number | null;
  surface_pressure: number | null;
  pressure_msl: number | null;
  precipitation: number | null;
  cloud_cover: number | null;
  wind_speed_10m: number | null;
  wind_direction_10m: number | null;
  wind_gusts_10m: number | null;
  shortwave_radiation: number | null;
  weather_code: number | null;
  is_day: boolean | null;
}

export interface CurrentWeather {
  location: string;
  latitude: number;
  longitude: number;
  observation: Observation;
  age_minutes: number;
  delayed: boolean;
}

export interface HorizonPrediction {
  horizon_hours: number;
  base_time: string;
  target_time: string;
  predicted_temperature: number;
  lower_bound: number | null;
  upper_bound: number | null;
  actual_temperature?: number | null;
  model_type: string;
}

export interface PercentileInfo {
  variable: string;
  value: number;
  percentile: number;
  normal_range: [number, number];
}

export interface HistoricalComparison {
  location: string;
  reference: string;
  observed_at: string;
  percentiles: PercentileInfo[];
  cluster_id: number | null;
  cluster_label: string | null;
  distance_to_centroid: number | null;
  is_anomaly: boolean | null;
  anomaly_score: number | null;
}

export interface AnomalyRow {
  observed_at: string;
  anomaly_score: number;
  is_anomaly: boolean;
  detector: string;
  temperature_2m: number | null;
  relative_humidity_2m: number | null;
  surface_pressure: number | null;
  wind_speed_10m: number | null;
}

export interface ClusterInfo {
  cluster_id: number;
  label: string;
  share_pct: number;
  centroid: Record<string, number>;
}

export interface ClusterModel {
  k: number;
  silhouette: number | null;
  trained_at: string;
  clusters: ClusterInfo[];
}

export interface ModelRun {
  model_type: string;
  horizon_hours: number;
  target: string;
  is_active: boolean;
  mae: number | null;
  rmse: number | null;
  r2: number | null;
  trained_at: string;
  metrics: Record<string, unknown> | null;
}

export interface StatVariable {
  variable: string;
  mean: number;
  median: number;
  std: number;
  min: number;
  p05: number;
  p25: number;
  p75: number;
  p95: number;
  max: number;
}

export interface Stats {
  location: string;
  period: string;
  n_rows: number;
  variables: StatVariable[];
}

export interface CorrelationMatrix {
  variables: string[];
  matrix: (number | null)[][];
  method: string;
  n_rows: number;
  period: string;
}

export interface DashboardData {
  location: string;
  latitude: number;
  longitude: number;
  generated_at: string;
  current: CurrentWeather;
  predictions: HorizonPrediction[];
  historical_comparison: HistoricalComparison;
  recent_anomalies: AnomalyRow[];
  clusters: ClusterModel;
  model_performance: ModelRun[];
  ai_insight: string | null;
}

export interface Insight {
  status: "ok" | "cached" | "no_api_key" | "unavailable";
  interpretation: string | null;
  model?: string;
  generated_at?: string;
  tokens?: { input: number; output: number };
  structured_summary?: Record<string, unknown>;
  cached?: boolean;
  stale?: boolean;
  note?: string;
  error?: string;
}
