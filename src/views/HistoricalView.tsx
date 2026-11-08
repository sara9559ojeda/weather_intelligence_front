import { useAnomalies, useCorrelations, useHistory } from "../api/hooks";
import type { DashboardData } from "../api/types";
import { CorrelationHeatmap } from "../components/CorrelationHeatmap";
import { NormalityPanel } from "../components/intelligence/NormalityPanel";
import { AnomaliesPanel, ChartSlot, RegimesPanel, ScatterTempHumidity } from "./ChartSlot";

/** Análisis histórico: ¿qué tan normal es hoy?, patrones de la ciudad, relaciones y anomalías. */
export function HistoricalView({ data }: { data: DashboardData }) {
  const history = useHistory(168);
  const anomalies = useAnomalies();
  const correlations = useCorrelations();

  return (
    <div className="space-y-10">
      <NormalityPanel />

      <ChartSlot skeleton="h-[40rem]">
        <RegimesPanel />
      </ChartSlot>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ChartSlot skeleton="h-96">
          <ScatterTempHumidity data={history.data} isLoading={history.isLoading} />
        </ChartSlot>
        <CorrelationHeatmap data={correlations.data} isLoading={correlations.isLoading} />
      </div>

      <ChartSlot skeleton="h-96">
        <AnomaliesPanel
          data={anomalies.data}
          recent={data.recent_anomalies}
          isLoading={anomalies.isLoading}
        />
      </ChartSlot>
    </div>
  );
}
