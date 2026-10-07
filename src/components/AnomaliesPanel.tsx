import { useMemo } from "react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnomalyRow } from "../api/types";
import { num, timeLabel } from "../lib/format";
import { CHART, Card, Skeleton } from "./ui";
import { tooltipStyle } from "./PredictionPanel";

export function AnomaliesPanel({
  data,
  recent,
  isLoading,
}: {
  data?: AnomalyRow[];
  recent?: AnomalyRow[];
  isLoading: boolean;
}) {
  const points = useMemo(
    () =>
      (data ?? []).map((a) => ({
        t: new Date(a.observed_at).getTime(),
        score: a.anomaly_score,
        flag: a.is_anomaly,
      })),
    [data],
  );

  const top = [...(recent ?? [])]
    .sort((a, b) => a.anomaly_score - b.anomaly_score)
    .slice(0, 6);

  return (
    <Card
      title="Detección de anomalías"
      subtitle="Isolation Forest sobre residuales des-estacionalizados"
    >
      {isLoading ? (
        <Skeleton className="h-40" />
      ) : (
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
              <CartesianGrid stroke={CHART.grid} strokeDasharray="2 5" strokeOpacity={0.5} vertical={false} />
              <XAxis
                type="number"
                dataKey="t"
                domain={["dataMin", "dataMax"]}
                stroke="transparent"
                axisLine={false}
                tickLine={false}
                tick={{ fill: CHART.text, fontSize: 10 }}
                tickFormatter={(t) => new Date(t).toLocaleDateString("es-ES", { month: "short", day: "numeric" })}
                minTickGap={40}
              />
              <YAxis
                type="number"
                dataKey="score"
                stroke="transparent"
                axisLine={false}
                tickLine={false}
                tick={{ fill: CHART.text, fontSize: 10 }}
                width={38}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [num(v, 3), "score"]}
                labelFormatter={(t) => timeLabel(new Date(t as number).toISOString())}
              />
              <Scatter
                data={points.filter((p) => !p.flag)}
                fill={CHART.text}
                fillOpacity={0.25}
              />
              <Scatter data={points.filter((p) => p.flag)} fill={CHART.danger} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-[var(--color-text-faint)]">
            <tr className="text-left">
              <th className="py-1 font-normal">Fecha</th>
              <th className="py-1 text-right font-normal">Temp</th>
              <th className="py-1 text-right font-normal">HR</th>
              <th className="py-1 text-right font-normal">Presión</th>
              <th className="py-1 text-right font-normal">Viento</th>
              <th className="py-1 text-right font-normal">Score</th>
            </tr>
          </thead>
          <tbody className="mono">
            {top.map((a, i) => (
              <tr key={i} className="border-t border-[var(--color-border)]">
                <td className="py-1.5">{timeLabel(a.observed_at)}</td>
                <td className="py-1.5 text-right">{num(a.temperature_2m)}</td>
                <td className="py-1.5 text-right">{num(a.relative_humidity_2m, 0)}</td>
                <td className="py-1.5 text-right">{num(a.surface_pressure, 0)}</td>
                <td className="py-1.5 text-right">{num(a.wind_speed_10m, 0)}</td>
                <td className="py-1.5 text-right text-[var(--color-danger)]">{num(a.anomaly_score, 3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-[var(--color-text-faint)]">
        Una anomalía estadística = "valor inusual respecto al histórico"; no implica un fenómeno
        climático extremo.
      </p>
    </Card>
  );
}
