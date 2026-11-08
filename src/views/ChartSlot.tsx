import { lazy, Suspense, type ReactNode } from "react";
import { ErrorBoundary, Skeleton } from "../components/ui";

// Paneles con Recharts: chunk aparte para que la cabecera y el héroe no
// esperen a esa librería. La descarga arranca en cuanto se evalúa este módulo,
// en paralelo con la petición del dashboard, así que normalmente ya está lista
// cuando llegan los datos y el skeleton ni llega a verse.
const loadCharts = () => import("../components/charts");
loadCharts().catch(() => {
  /* si falla, cada panel lo reintenta al renderizarse y lo muestra su ErrorBoundary */
});

export const PredictionPanel = lazy(() => loadCharts().then((m) => ({ default: m.PredictionPanel })));
export const ClustersPanel = lazy(() => loadCharts().then((m) => ({ default: m.ClustersPanel })));
export const HistoryCharts = lazy(() => loadCharts().then((m) => ({ default: m.HistoryCharts })));
export const ScatterTempHumidity = lazy(() =>
  loadCharts().then((m) => ({ default: m.ScatterTempHumidity })),
);
export const AnomaliesPanel = lazy(() => loadCharts().then((m) => ({ default: m.AnomaliesPanel })));
export const PredictedVsActual = lazy(() =>
  loadCharts().then((m) => ({ default: m.PredictedVsActual })),
);
export const RegimesPanel = lazy(() => loadCharts().then((m) => ({ default: m.RegimesPanel })));
export const EvaluationPanel = lazy(() => loadCharts().then((m) => ({ default: m.EvaluationPanel })));
export const ReliabilityPanel = lazy(() => loadCharts().then((m) => ({ default: m.ReliabilityPanel })));

/** Hueco para un panel diferido: skeleton mientras carga el chunk, error si no llega. */
export function ChartSlot({ skeleton, children }: { skeleton: string; children: ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Skeleton className={`${skeleton} rounded-[var(--radius-card)]`} />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}
