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

export interface LocationInfo {
  slug: string;
  name: string;
  country: string | null;
  latitude: number;
  longitude: number;
  timezone: string;
  is_default: boolean;
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

// --- Autenticación (backend/app/schemas/auth.py) ---

export interface AuthUser {
  id: number;
  email: string;
  full_name: string | null;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}

export interface StreamTicket {
  ticket: string;
  expires_in: number;
}

// --- Análisis contextual (backend/app/schemas/analysis.py) ---

export type AnalysisStatus = "ok" | "partial" | "insufficient" | "unavailable";

export interface NormalityReference {
  description: string;
  n_observations: number;
  period_start: string | null;
  period_end: string | null;
  years: number | null;
  window_step: number;
  representativeness: "alta" | "media" | "baja";
  widened: boolean;
  min_sample: number;
  local_month: number;
  local_hour: number;
  timezone: string;
}

export interface VariableNormality {
  variable: string;
  label: string;
  unit: string;
  status: "ok" | "insufficient" | "not_applicable";
  value: number | null;
  percentile: number | null;
  classification: string | null;
  classification_label: string | null;
  is_extreme: boolean;
  median: number | null;
  usual_range: [number, number] | null;
  typical_range: [number, number] | null;
  n_sample: number;
  wet_fraction: number | null;
  explanation: string;
}

export interface AnomalyContributor {
  variable: string;
  label: string;
  percentile: number;
  direction: "above" | "below";
}

export interface AnomalyInfo {
  available: boolean;
  is_multivariate_anomaly: boolean | null;
  score: number | null;
  kind: "none" | "multivariate" | "univariate" | "both" | null;
  contributors: AnomalyContributor[];
  explanation: string;
}

export interface SimilarInfo {
  available: boolean;
  n_similar: number;
  share_pct: number | null;
  years_with_similar: number | null;
  years_total: number | null;
  tolerance: string | null;
  explanation: string;
}

export interface Normality {
  status: AnalysisStatus;
  location: string;
  slug: string;
  observed_at: string | null;
  reference: NormalityReference | null;
  variables: VariableNormality[];
  anomaly: AnomalyInfo | null;
  similar: SimilarInfo | null;
  summary: string;
  notes: string[];
}

export interface DominantVariable {
  variable: string;
  label: string;
  unit: string;
  direction: "above" | "below";
  z: number;
  median: number;
}

export interface RegimeProfile {
  regime_id: number;
  label: string;
  description: string;
  n_observations: number;
  share_pct: number;
  medians: Record<string, number>;
  z_vs_city: Record<string, number>;
  dominant: DominantVariable[];
  wet_share_pct: number;
  seasonality: { month: number; share_pct: number; lift: number }[];
  peak_months: number[];
  persistence: {
    n_episodes: number;
    median_hours: number;
    mean_hours: number;
    p90_hours: number;
  } | null;
  distance_p50: number | null;
  distance_p90: number | null;
  distance_p99: number | null;
}

export interface CurrentRegime {
  regime_id: number;
  label: string;
  distance_to_centroid: number;
  distance_band: "típica" | "algo alejada" | "atípica";
  second_regime_id: number | null;
  second_label: string | null;
  distance_ratio_to_second: number | null;
  observed_at: string;
  explanation: string;
}

export interface RegimeEpisode {
  regime_id: number;
  label: string;
  start: string;
  end: string;
  hours: number;
}

export interface RegimeTransition {
  to_regime_id: number;
  label: string;
  count: number;
  probability: number;
}

export interface Regimes {
  status: AnalysisStatus;
  location: string;
  slug: string;
  model: {
    k: number;
    silhouette: number | null;
    trained_at: string;
    feature_space: string;
    n_observations: number;
    period: [string, string];
    labels_rule: string;
  } | null;
  current: CurrentRegime | null;
  regimes: RegimeProfile[];
  timeline: { t: string; regime_id: number }[];
  episodes: RegimeEpisode[];
  recent_share_pct: Record<string, number>;
  transitions_from_current: RegimeTransition[];
  transitions_supported: boolean;
  transitions_total: number;
  notes: string[];
}

export interface BaselineMetrics {
  n: number;
  mae: number;
  rmse: number;
}

export interface HorizonEvaluation {
  horizon_hours: number;
  n_verified: number;
  mae: number | null;
  rmse: number | null;
  bias: number | null;
  persistence: BaselineMetrics | null;
  skill_vs_persistence: number | null;
  reference: BaselineMetrics | null;
  model_on_reference_rows: BaselineMetrics | null;
  coverage_pct: number | null;
  mean_interval_width: number | null;
  last_verified_at: string | null;
  model_versions: string[];
  model_types: string[];
  explanation: string;
}

export interface OfflineModel {
  horizon_hours: number;
  model_type: string;
  is_champion: boolean;
  test_rmse: number | null;
  test_mae: number | null;
  valid_rmse: number | null;
  trained_at: string | null;
}

export interface Evaluation {
  status: "ok" | "collecting" | "unavailable";
  location: string;
  slug: string;
  window_days: number;
  generated_at: string;
  n_logged_total: number;
  n_verified_total: number;
  n_pending: number;
  first_logged_at: string | null;
  last_verified_at: string | null;
  horizons: HorizonEvaluation[];
  series: { horizon_hours: number; points: { day: string; n: number; mae: number; rmse: number }[] }[];
  offline_models: OfflineModel[];
  notes: string[];
}

export interface PairPoint {
  target_time: string;
  predicted: number;
  observed: number;
  lower: number | null;
  upper: number | null;
}

export interface EvaluationPairs {
  horizon_hours: number;
  window_days: number;
  n_total: number;
  points: PairPoint[];
}

export type ReliabilityLevel = "alta" | "media" | "baja" | "preliminar" | "no_evaluable";

export interface HorizonReliability {
  horizon_hours: number;
  predicted_temperature: number | null;
  lower_bound: number | null;
  upper_bound: number | null;
  interval_width: number | null;
  nominal_level: number | null;
  interval_method: string | null;
  base_time: string | null;
  target_time: string | null;
  live_coverage_pct: number | null;
  live_n: number;
  live_mean_width: number | null;
  offline_coverage_pct: number | null;
  offline_n: number | null;
  offline_mean_width: number | null;
  level: ReliabilityLevel;
  level_label: string;
  degraded: boolean;
  reasons: string[];
  statement: string;
  coverage_statement: string;
}

export interface ForecastReliability {
  status: "ok" | "unavailable";
  location: string;
  slug: string;
  generated_at: string;
  horizons: HorizonReliability[];
  criteria: string[];
  notes: string[];
}

// --- Analista (backend/app/schemas/analysis.py) ---

export interface AnalystQuestion {
  id: string;
  text: string;
}

export type AnalystSectionKind = "datos" | "asociacion" | "hipotesis";

export interface AnalystAnswer {
  mode: "ai" | "deterministic";
  intent: string;
  question: string;
  answer: string;
  sections: { kind: AnalystSectionKind; text: string }[];
  deterministic_answer: string;
  evidence: { label: string; value: string; source: string }[];
  limitations: string[];
  availability: Record<string, boolean>;
  fallback_reason: string | null;
  model: string | null;
  generated_at: string;
  context_as_of: string | null;
}
