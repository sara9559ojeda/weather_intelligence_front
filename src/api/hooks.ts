import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./client";
import type {
  AnomalyRow,
  CorrelationMatrix,
  DashboardData,
  HorizonPrediction,
  Insight,
  Observation,
} from "./types";

export const useDashboard = () =>
  useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiGet<DashboardData>("/dashboard"),
    refetchInterval: 5 * 60_000, // red de seguridad; el SSE es el disparador principal
  });

export const useHistory = (hours = 168) =>
  useQuery({
    queryKey: ["history", hours],
    queryFn: () => apiGet<Observation[]>("/weather/history", { hours }),
  });

export const useAnomalies = (limit = 400) =>
  useQuery({
    queryKey: ["anomalies", limit],
    queryFn: () => apiGet<AnomalyRow[]>("/anomalies", { limit, only_flagged: false }),
  });

export const useCorrelations = (days = 120) =>
  useQuery({
    queryKey: ["correlations", days],
    queryFn: () => apiGet<CorrelationMatrix>("/stats/correlations", { days }),
  });

export const usePredictionHistory = (horizon = 6, limit = 240) =>
  useQuery({
    queryKey: ["predictionHistory", horizon, limit],
    queryFn: () =>
      apiGet<HorizonPrediction[]>("/predictions/history", {
        horizon_hours: horizon,
        limit,
      }),
  });

export const useInsight = (enabled: boolean) =>
  useQuery({
    queryKey: ["insight"],
    queryFn: () => apiGet<Insight>("/insights"),
    enabled,
    staleTime: 10 * 60_000,
  });
