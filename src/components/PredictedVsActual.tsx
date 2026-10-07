import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HorizonPrediction } from "../api/types";
import { num, timeLabel } from "../lib/format";
import { CHART, Card, ErrorState, Skeleton } from "./ui";
import { tooltipStyle } from "./PredictionPanel";

const HORIZONS = [1, 3, 6, 12, 24];

export function PredictedVsActual({
  data,
  isLoading,
  error,
  horizon,
  onHorizonChange,
}: {
  data?: HorizonPrediction[];
  isLoading: boolean;
  error: Error | null;
  horizon: number;
  onHorizonChange: (h: number) => void;
}) {
  const [showBand, setShowBand] = useState(false);
  const chartData = useMemo(
    () =>
      (data ?? []).map((p) => ({
        t: p.target_time,
        pred: p.predicted_temperature,
        real: p.actual_temperature ?? null,
        lo: p.lower_bound,
        hi: p.upper_bound,
      })),
    [data],
  );

  return (
    <Card
      title="Predicho vs real"
      subtitle={`predicciones del campeón a +${horizon} h sobre el conjunto de test`}
      right={
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-[11px] text-[var(--color-text-dim)]">
            <input
              type="checkbox"
              checked={showBand}
              onChange={(e) => setShowBand(e.target.checked)}
            />
            banda
          </label>
          <div className="flex gap-1">
            {HORIZONS.map((h) => (
              <button
                key={h}
                onClick={() => onHorizonChange(h)}
                className={`rounded-full px-2.5 py-1 text-[11px] transition-colors ${
                  horizon === h
                    ? "glass-soft text-[var(--color-accent)]"
                    : "text-[var(--color-text-faint)] hover:text-[var(--color-text)]"
                }`}
              >
                +{h}h
              </button>
            ))}
          </div>
        </div>
      }
    >
      {error ? (
        <ErrorState message={error.message} />
      ) : isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
              <CartesianGrid stroke={CHART.grid} strokeDasharray="2 5" strokeOpacity={0.5} vertical={false} />
              <XAxis
                dataKey="t"
                stroke="transparent"
                axisLine={false}
                tickLine={false}
                tick={{ fill: CHART.text, fontSize: 11 }}
                minTickGap={48}
                tickFormatter={(t) => timeLabel(t).replace(",", "")}
              />
              <YAxis
                stroke="transparent"
                axisLine={false}
                tickLine={false}
                tick={{ fill: CHART.text, fontSize: 11 }}
                width={38}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(t) => timeLabel(t as string)}
                formatter={(v: number, n: string) => [
                  num(v),
                  n === "pred" ? "predicción" : n === "real" ? "real" : n,
                ]}
              />
              {showBand && (
                <>
                  <Line type="monotone" dataKey="lo" stroke={CHART.grid} dot={false} strokeWidth={1} />
                  <Line type="monotone" dataKey="hi" stroke={CHART.grid} dot={false} strokeWidth={1} />
                </>
              )}
              <Line
                type="monotone"
                dataKey="real"
                stroke={CHART.accent}
                strokeWidth={1.6}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="pred"
                stroke={CHART.series[1]}
                strokeWidth={1.6}
                strokeDasharray="4 3"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="mt-2 text-[11px] text-[var(--color-text-faint)]">
        El valor real se conoce a posteriori; el error del modelo por horizonte está en la tarjeta
        "Rendimiento del modelo".
      </p>
    </Card>
  );
}
