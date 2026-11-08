import { useQuery } from "@tanstack/react-query";
import { useLocation } from "../location/LocationContext";
import { apiGet } from "./client";
import type {
  AnomalyRow,
  CorrelationMatrix,
  DashboardData,
  HorizonPrediction,
  Insight,
  Observation,
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
