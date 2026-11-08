import { useState } from "react";
import { usePredictionHistory } from "../api/hooks";
import type { DashboardData } from "../api/types";
import { ModelPerformance } from "../components/ModelPerformance";
import { ChartSlot, EvaluationPanel, PredictedVsActual, ReliabilityPanel } from "./ChartSlot";

/** Inteligencia predictiva: confiabilidad del pronóstico, desempeño real y evaluación del entrenamiento. */
export function PredictiveView({ data }: { data: DashboardData }) {
  const [pvaHorizon, setPvaHorizon] = useState(6);
  const predictionHistory = usePredictionHistory(pvaHorizon);

  return (
    <div className="space-y-10">
      <ChartSlot skeleton="h-[34rem]">
        <ReliabilityPanel />
      </ChartSlot>

      <ChartSlot skeleton="h-[40rem]">
        <EvaluationPanel />
      </ChartSlot>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ChartSlot skeleton="h-96">
          <PredictedVsActual
            data={predictionHistory.data}
            isLoading={predictionHistory.isLoading}
            error={predictionHistory.error}
            horizon={pvaHorizon}
            onHorizonChange={setPvaHorizon}
          />
        </ChartSlot>
        <ModelPerformance runs={data.model_performance} />
      </div>
    </div>
  );
}
