import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiGet } from "../api/client";
import { useHistory, useInsight } from "../api/hooks";
import type { DashboardData, Insight } from "../api/types";
import { AiInsights } from "../components/AiInsights";
import { CurrentConditions } from "../components/CurrentConditions";
import { HistoricalComparison } from "../components/HistoricalComparison";
import { useLocation } from "../location/LocationContext";
import { ChartSlot, ClustersPanel, HistoryCharts, PredictionPanel } from "./ChartSlot";

/** Vista general: lo esencial de hoy (condiciones, pronóstico, comparación rápida, evolución). */
export function OverviewView({ data }: { data: DashboardData }) {
  const queryClient = useQueryClient();
  const { current: city } = useLocation();
  const [historyHours, setHistoryHours] = useState(168);
  const history = useHistory(historyHours);
  const insight = useInsight(true);

  const refreshInsight = async () => {
    try {
      const fresh = await apiGet<Insight>("/insights", { force: true });
      queryClient.setQueryData(["insight", city?.slug ?? null], fresh);
    } catch (err) {
      // Se conserva la interpretación anterior. Sin el catch, un fallo de red
      // quedaba como promesa rechazada sin capturar (el botón no la espera).
      console.warn("No se pudo regenerar la interpretación:", err);
    }
  };

  return (
    <div className="space-y-10">
      {/* Hero — condiciones actuales, protagonista de la pantalla */}
      <CurrentConditions data={data.current} recentObservations={history.data} />

      {/* Fila 1 — predicción a corto plazo */}
      <ChartSlot skeleton="h-80">
        <PredictionPanel
          predictions={data.predictions}
          currentTemp={data.current.observation.temperature_2m}
          modelPerformance={data.model_performance}
        />
      </ChartSlot>

      {/* Fila 2 — comparación histórica rápida + regímenes (el detalle está en «Análisis histórico») */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <HistoricalComparison data={data.historical_comparison} />
        <ChartSlot skeleton="h-80">
          <ClustersPanel data={data.clusters} activeCluster={data.historical_comparison.cluster_id} />
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

      {/* Fila 4 — interpretación con IA */}
      <AiInsights insight={insight.data} isLoading={insight.isLoading} onRefresh={refreshInsight} />
    </div>
  );
}
