import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "../location/LocationContext";
import { apiGet, apiPost } from "./client";
import type {
  AnalystAnswer,
  AnalystQuestion,
  AnomalyRow,
  CorrelationMatrix,
  DashboardData,
  Evaluation,
  EvaluationPairs,
  ForecastReliability,
  HorizonPrediction,
  Insight,
  Normality,
  Observation,
  Regimes,
} from "./types";

/** Slug de la ciudad activa: forma parte de toda clave de caché para no mezclar ciudades. */
const useCity = () => useLocation().current?.slug ?? null;

export const useDashboard = () =>
  useQuery({
    queryKey: ["dashboard", useCity()],
    queryFn: () => apiGet<DashboardData>("/dashboard"),
    refetchInterval: 5 * 60_000, // red de seguridad; el WebSocket es el disparador principal
  });

export const useHistory = (hours = 168) =>
  useQuery({
    queryKey: ["history", useCity(), hours],
    queryFn: () => apiGet<Observation[]>("/weather/history", { hours }),
  });

export const useAnomalies = (limit = 400) =>
  useQuery({
    queryKey: ["anomalies", useCity(), limit],
    queryFn: () => apiGet<AnomalyRow[]>("/anomalies", { limit, only_flagged: false }),
  });

export const useCorrelations = (days = 120) =>
  useQuery({
    queryKey: ["correlations", useCity(), days],
    queryFn: () => apiGet<CorrelationMatrix>("/stats/correlations", { days }),
  });

export const usePredictionHistory = (horizon = 6, limit = 240) =>
  useQuery({
    queryKey: ["predictionHistory", useCity(), horizon, limit],
    queryFn: () =>
      apiGet<HorizonPrediction[]>("/predictions/history", {
        horizon_hours: horizon,
        limit,
      }),
  });

export const useInsight = (enabled: boolean) =>
  useQuery({
    queryKey: ["insight", useCity()],
    queryFn: () => apiGet<Insight>("/insights"),
    enabled,
    staleTime: 10 * 60_000,
  });

// --- Análisis contextual: cada módulo se pide solo cuando su pestaña está abierta ---

const MINUTE = 60_000;

export const useNormality = () =>
  useQuery({
    queryKey: ["normality", useCity()],
    queryFn: () => apiGet<Normality>("/analysis/normality"),
    staleTime: 5 * MINUTE,
  });

export const useRegimes = () =>
  useQuery({
    queryKey: ["regimes", useCity()],
    queryFn: () => apiGet<Regimes>("/analysis/regimes"),
    staleTime: 5 * MINUTE,
  });

export const useEvaluation = (days: number) =>
  useQuery({
    queryKey: ["evaluation", useCity(), days],
    queryFn: () => apiGet<Evaluation>("/evaluation/summary", { days }),
    staleTime: 2 * MINUTE,
  });

export const useEvaluationPairs = (days: number, horizon: number, enabled = true) =>
  useQuery({
    queryKey: ["evaluationPairs", useCity(), days, horizon],
    queryFn: () =>
      apiGet<EvaluationPairs>("/evaluation/pairs", { days, horizon_hours: horizon, limit: 500 }),
    enabled,
    staleTime: 2 * MINUTE,
  });

export const useReliability = () =>
  useQuery({
    queryKey: ["reliability", useCity()],
    queryFn: () => apiGet<ForecastReliability>("/forecast/reliability"),
    staleTime: 2 * MINUTE,
  });

export const useAnalystQuestions = () =>
  useQuery({
    queryKey: ["analystQuestions"],
    queryFn: () => apiGet<AnalystQuestion[]>("/analyst/questions"),
    staleTime: Infinity,
  });

export interface AskInput {
  question?: string;
  intent?: string;
  detail?: boolean;
}

/** Pregunta al analista sobre la ciudad activa (el cliente añade ?location=). */
export const useAskAnalyst = () =>
  useMutation({
    mutationFn: (input: AskInput) => apiPost<AnalystAnswer>("/analyst/ask", input),
  });
