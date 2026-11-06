import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
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
import { useAuth } from "./auth/AuthContext";
import { useRealtime, type RealtimeStatus } from "./hooks/useRealtime";
import { useTheme } from "./hooks/useTheme";
import { relativeAge } from "./lib/format";
import { weatherVisual } from "./lib/weatherCode";
import { AiInsights } from "./components/AiInsights";
import { CorrelationHeatmap } from "./components/CorrelationHeatmap";
import { CurrentConditions } from "./components/CurrentConditions";
import { HistoricalComparison } from "./components/HistoricalComparison";
import { ModelPerformance } from "./components/ModelPerformance";
import { ErrorBoundary, ErrorState, Skeleton } from "./components/ui";
import { WeatherBackground } from "./components/WeatherBackground";

// Paneles con Recharts: chunk aparte para que la cabecera y el héroe no
// esperen a esa librería. La descarga arranca en cuanto se evalúa este módulo,
// en paralelo con la petición del dashboard, así que normalmente ya está lista
// cuando llegan los datos y el skeleton ni llega a verse.
const loadCharts = () => import("./components/charts");
loadCharts().catch(() => {
  /* si falla, cada panel lo reintenta al renderizarse y lo muestra su ErrorBoundary */
});
const PredictionPanel = lazy(() => loadCharts().then((m) => ({ default: m.PredictionPanel })));
const ClustersPanel = lazy(() => loadCharts().then((m) => ({ default: m.ClustersPanel })));
const HistoryCharts = lazy(() => loadCharts().then((m) => ({ default: m.HistoryCharts })));
const ScatterTempHumidity = lazy(() => loadCharts().then((m) => ({ default: m.ScatterTempHumidity })));
const AnomaliesPanel = lazy(() => loadCharts().then((m) => ({ default: m.AnomaliesPanel })));
const PredictedVsActual = lazy(() => loadCharts().then((m) => ({ default: m.PredictedVsActual })));

/** Hueco para un panel diferido: skeleton mientras carga el chunk, error si no llega. */
function ChartSlot({ skeleton, children }: { skeleton: string; children: ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Skeleton className={`${skeleton} rounded-[var(--radius-card)]`} />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

type ConnStatus = RealtimeStatus;

/**
 * Indicador de conexión en vivo. Lleva su propio reloj para que
 * "actualizado hace X" avance con el tiempo: antes solo se recalculaba cuando
 * App se re-renderizaba y podía quedarse en "ahora mismo" durante una hora.
 * Al vivir aparte, el tic no re-renderiza el resto del dashboard.
 */
function ConnectionStatus({ status, lastEventAt }: { status: ConnStatus; lastEventAt: Date | null }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!lastEventAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [lastEventAt]);

  // Justo tras un evento `now` puede ser anterior a lastEventAt: la edad sale
  // negativa y relativeAge() la muestra como "ahora mismo", que es lo correcto.
  const ageMinutes = lastEventAt ? (now - lastEventAt.getTime()) / 60000 : 0;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        aria-hidden
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          status === "live"
            ? "bg-[var(--color-ok)]"
            : status === "connecting"
              ? "bg-[var(--color-warn)]"
              : "bg-[var(--color-danger)]"
        }`}
      />
      {/* En móvil el texto se oculta a la vista pero no a los lectores de pantalla. */}
      <span className="sr-only text-[var(--color-text-dim)] sm:not-sr-only sm:inline">
        {status === "live" ? "en vivo" : status === "connecting" ? "conectando" : "sin conexión"}
        {lastEventAt && ` · actualizado ${relativeAge(ageMinutes)}`}
      </span>
    </div>
  );
}

export function App() {
  const queryClient = useQueryClient();
  const { status: liveStatus, lastEventAt } = useRealtime();
  const { user, logout } = useAuth();
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
    try {
      const fresh = await apiGet<Insight>("/insights", { force: true });
      queryClient.setQueryData(["insight"], fresh);
    } catch (err) {
      // Se conserva la interpretación anterior. Sin el catch, un fallo de red
      // quedaba como promesa rechazada sin capturar (el botón no la espera).
      console.warn("No se pudo regenerar la interpretación:", err);
    }
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
            <ConnectionStatus status={liveStatus} lastEventAt={lastEventAt} />
            <button
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              className="glass-soft flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-dim)] transition-colors hover:text-[var(--color-text)]"
            >
              {theme === "dark" ? "☀" : "🌙"}
            </button>
            {user && (
              <div className="flex items-center gap-2 border-l border-[var(--glass-border)] pl-3">
                <span
                  className="hidden max-w-[11rem] truncate text-xs text-[var(--color-text-dim)] md:inline"
                  title={user.email}
                >
                  {user.full_name || user.email}
                </span>
                <button
                  onClick={logout}
                  aria-label={`Cerrar sesión (${user.email})`}
                  className="glass-soft rounded-full px-3 py-1.5 text-xs font-medium text-[var(--color-text-dim)] transition-colors hover:text-[var(--color-text)]"
                >
                  Salir
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[var(--container)] px-4 py-8 sm:px-6" aria-busy={dashboard.isLoading}>
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
            <ChartSlot skeleton="h-80">
              <PredictionPanel
                predictions={dashboard.data.predictions}
                currentTemp={dashboard.data.current.observation.temperature_2m}
                modelPerformance={dashboard.data.model_performance}
              />
            </ChartSlot>

            {/* Fila 2 — comparación histórica + regímenes */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <HistoricalComparison data={dashboard.data.historical_comparison} />
              <ChartSlot skeleton="h-80">
                <ClustersPanel
                  data={dashboard.data.clusters}
                  activeCluster={dashboard.data.historical_comparison.cluster_id}
                />
              </ChartSlot>
            </div>

            {/* Fila 3 — series temporales */}
            <ChartSlot skeleton="h-96">
              <HistoryCharts
                data={history.data}
                isLoading={history.isLoading}
                error={history.error}
                hours={historyHours}
                onHoursChange={setHistoryHours}
              />
            </ChartSlot>

            {/* Fila 4 — bivariado + correlaciones */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <ChartSlot skeleton="h-96">
                <ScatterTempHumidity data={history.data} isLoading={history.isLoading} />
              </ChartSlot>
              <CorrelationHeatmap data={correlations.data} isLoading={correlations.isLoading} />
            </div>

            {/* Fila 5 — anomalías + predicho vs real */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <ChartSlot skeleton="h-96">
                <AnomaliesPanel
                  data={anomalies.data}
                  recent={dashboard.data.recent_anomalies}
                  isLoading={anomalies.isLoading}
                />
              </ChartSlot>
              <ChartSlot skeleton="h-96">
                <PredictedVsActual
                  data={predictionHistory.data}
                  isLoading={predictionHistory.isLoading}
                  error={predictionHistory.error}
                  horizon={pvaHorizon}
                  onHorizonChange={setPvaHorizon}
                />
              </ChartSlot>
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
