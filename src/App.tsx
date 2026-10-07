import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiGet } from "./api/client";
import {
  useAnomalies,
  useCorrelations,
  useDashboard,
  useHistory,
  useInsight,
  usePredictionHistory,
} from "./api/hooks";
import type { Insight } from "./api/types";
import { useSSE } from "./hooks/useSSE";
import { useTheme } from "./hooks/useTheme";
import { relativeAge } from "./lib/format";
import { weatherVisual } from "./lib/weatherCode";
import { AiInsights } from "./components/AiInsights";
import { AnomaliesPanel } from "./components/AnomaliesPanel";
import { ClustersPanel } from "./components/ClustersPanel";
import { CorrelationHeatmap } from "./components/CorrelationHeatmap";
import { CurrentConditions } from "./components/CurrentConditions";
import { HistoricalComparison } from "./components/HistoricalComparison";
import { HistoryCharts } from "./components/HistoryCharts";
import { ModelPerformance } from "./components/ModelPerformance";
import { PredictedVsActual } from "./components/PredictedVsActual";
import { PredictionPanel } from "./components/PredictionPanel";
import { ScatterTempHumidity } from "./components/ScatterTempHumidity";
import { ErrorState, Skeleton } from "./components/ui";
import { WeatherBackground } from "./components/WeatherBackground";

export function App() {
  const queryClient = useQueryClient();
  const { status: sseStatus, lastEventAt } = useSSE();
  const { theme, toggle: toggleTheme } = useTheme();

  const [historyHours, setHistoryHours] = useState(168);
  const [pvaHorizon, setPvaHorizon] = useState(6);

  const dashboard = useDashboard();
  const history = useHistory(historyHours);
  const anomalies = useAnomalies();
  const correlations = useCorrelations();
  const predictionHistory = usePredictionHistory(pvaHorizon);
  const insight = useInsight(true);

  const refreshInsight = async () => {
    const fresh = await apiGet<Insight>("/insights", { force: true });
    queryClient.setQueryData(["insight"], fresh);
  };

  const currentObs = dashboard.data?.current.observation;
  const visual = weatherVisual(currentObs?.weather_code);
  const isDay = currentObs?.is_day ?? true;

  return (
    <div className="min-h-screen">
      <WeatherBackground category={visual.category} isDay={isDay} />

      <header className="sticky top-0 z-10 px-4 pt-4 sm:px-6">
        <div className="glass mx-auto flex max-w-[var(--container)] items-center justify-between gap-4 rounded-full px-5 py-3">
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-[var(--color-text)] sm:text-base">
              Weather Intelligence
            </h1>
            <p className="hidden text-[11px] text-[var(--color-text-faint)] sm:block">
              Minería de datos · Machine Learning · IA — Madrid-Barajas
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  sseStatus === "live"
                    ? "bg-[var(--color-ok)]"
                    : sseStatus === "connecting"
                      ? "bg-[var(--color-warn)]"
                      : "bg-[var(--color-danger)]"
                }`}
              />
              <span className="hidden text-[var(--color-text-dim)] sm:inline">
                {sseStatus === "live" ? "en vivo" : sseStatus === "connecting" ? "conectando" : "sin conexión"}
                {lastEventAt && ` · actualizado ${relativeAge((Date.now() - lastEventAt.getTime()) / 60000)}`}
              </span>
            </div>
            <button
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              className="glass-soft flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-dim)] transition-colors hover:text-[var(--color-text)]"
            >
              {theme === "dark" ? "☀" : "🌙"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[var(--container)] px-4 py-8 sm:px-6">
        {dashboard.isLoading ? (
          <div className="space-y-10">
            <Skeleton className="h-72 rounded-[var(--radius-card)]" />
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        ) : dashboard.error ? (
          <ErrorState
            message={dashboard.error.message}
            onRetry={() => dashboard.refetch()}
          />
        ) : dashboard.data ? (
          <div className="space-y-10">
            {/* Hero — condiciones actuales, protagonista de la pantalla */}
            <CurrentConditions data={dashboard.data.current} recentObservations={history.data} />

            {/* Fila 1 — predicción a corto plazo */}
            <PredictionPanel
              predictions={dashboard.data.predictions}
              currentTemp={dashboard.data.current.observation.temperature_2m}
              modelPerformance={dashboard.data.model_performance}
            />

            {/* Fila 2 — comparación histórica + regímenes */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <HistoricalComparison data={dashboard.data.historical_comparison} />
              <ClustersPanel
                data={dashboard.data.clusters}
                activeCluster={dashboard.data.historical_comparison.cluster_id}
              />
            </div>

            {/* Fila 3 — series temporales */}
            <HistoryCharts
              data={history.data}
              isLoading={history.isLoading}
              error={history.error}
              hours={historyHours}
              onHoursChange={setHistoryHours}
            />

            {/* Fila 4 — bivariado + correlaciones */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <ScatterTempHumidity data={history.data} isLoading={history.isLoading} />
              <CorrelationHeatmap data={correlations.data} isLoading={correlations.isLoading} />
            </div>

            {/* Fila 5 — anomalías + predicho vs real */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <AnomaliesPanel
                data={anomalies.data}
                recent={dashboard.data.recent_anomalies}
                isLoading={anomalies.isLoading}
              />
              <PredictedVsActual
                data={predictionHistory.data}
                isLoading={predictionHistory.isLoading}
                error={predictionHistory.error}
                horizon={pvaHorizon}
                onHorizonChange={setPvaHorizon}
              />
            </div>

            {/* Fila 6 — rendimiento del modelo */}
            <ModelPerformance runs={dashboard.data.model_performance} />

            {/* Fila 7 — interpretación con IA */}
            <AiInsights
              insight={insight.data}
              isLoading={insight.isLoading}
              onRefresh={refreshInsight}
            />
          </div>
        ) : null}
      </main>

      <footer className="mx-auto max-w-[var(--container)] px-4 py-10 text-center text-xs text-[var(--color-text-faint)] sm:px-6">
        Datos: Open-Meteo (ERA5 + Forecast) y Meteostat, CC BY 4.0. Predicción no garantizada.
      </footer>
    </div>
  );
}
