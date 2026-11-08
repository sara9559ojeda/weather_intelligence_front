import { useEffect, useState } from "react";
import { useDashboard } from "./api/hooks";
import { useAuth } from "./auth/AuthContext";
import { useLocation } from "./location/LocationContext";
import { TABS, useActiveTab } from "./hooks/useActiveTab";
import { useRealtime, type RealtimeStatus } from "./hooks/useRealtime";
import { useWeatherTheme } from "./hooks/useWeatherTheme";
import { relativeAge } from "./lib/format";
import { weatherVisual } from "./lib/weatherCode";
import { CitySelect } from "./components/CitySelect";
import { TabBar, tabId, tabPanelId } from "./components/TabBar";
import { ErrorState, Skeleton } from "./components/ui";
import { WeatherBackground } from "./components/WeatherBackground";
import { AnalystView } from "./views/AnalystView";
import { HistoricalView } from "./views/HistoricalView";
import { OverviewView } from "./views/OverviewView";
import { PredictiveView } from "./views/PredictiveView";

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
  const { status: liveStatus, lastEventAt } = useRealtime();
  const { user, logout } = useAuth();
  const { current: city } = useLocation();
  const [tab, setTab] = useActiveTab();

  const dashboard = useDashboard();

  const currentObs = dashboard.data?.current.observation;
  const visual = weatherVisual(currentObs?.weather_code);
  // El tema (claro/oscuro) sigue al día/noche reales de la observación.
  const { isDay } = useWeatherTheme(currentObs?.is_day, visual.category);

  return (
    <div className="min-h-screen">
      <WeatherBackground category={visual.category} isDay={isDay} />

      <header className="sticky top-0 z-10 px-4 pt-4 sm:px-6">
        <div className="glass mx-auto flex max-w-[var(--container)] flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-3xl px-5 py-3 sm:rounded-full">
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-[var(--color-text)] sm:text-base">
              Weather Intelligence
            </h1>
            <p className="hidden text-[11px] text-[var(--color-text-dim)] sm:block">
              Minería de datos · Machine Learning · IA{city ? ` — ${city.name}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CitySelect />
            <ConnectionStatus status={liveStatus} lastEventAt={lastEventAt} />
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
          <div className="space-y-8">
            <TabBar tabs={TABS} active={tab} onChange={setTab} label="Secciones del panel" />
            {/* Solo se monta la pestaña activa: cada una pide sus datos al abrirse. */}
            <div role="tabpanel" id={tabPanelId(tab)} aria-labelledby={tabId(tab)} tabIndex={-1}>
              {tab === "overview" && <OverviewView data={dashboard.data} />}
              {tab === "history" && <HistoricalView data={dashboard.data} />}
              {tab === "predictive" && <PredictiveView data={dashboard.data} />}
              {tab === "analyst" && <AnalystView />}
            </div>
          </div>
        ) : null}
      </main>

      <footer className="mx-auto max-w-[var(--container)] px-4 py-10 text-center text-xs text-[var(--color-text-faint)] sm:px-6">
        Datos: Open-Meteo (ERA5 + Forecast) y Meteostat, CC BY 4.0. Predicción no garantizada.
      </footer>
    </div>
  );
}
