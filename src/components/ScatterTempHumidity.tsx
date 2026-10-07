import { useMemo } from "react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { Observation } from "../api/types";
import { num } from "../lib/format";
import { CHART, Card, Skeleton } from "./ui";
import { tooltipStyle } from "./PredictionPanel";

export function ScatterTempHumidity({
  data,
  isLoading,
}: {
  data?: Observation[];
  isLoading: boolean;
}) {
  const points = useMemo(
    () =>
      (data ?? [])
        .filter((o) => o.temperature_2m !== null && o.relative_humidity_2m !== null)
        .map((o) => ({ x: o.relative_humidity_2m as number, y: o.temperature_2m as number })),
    [data],
  );

  const r = pearson(points);

  return (
    <Card
      title="Temperatura vs humedad"
      subtitle={points.length > 0 ? `r de Pearson = ${num(r, 2)}` : undefined}
    >
      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 16, bottom: 4, left: -12 }}>
              <CartesianGrid stroke={CHART.grid} strokeDasharray="2 5" strokeOpacity={0.5} />
              <XAxis
                type="number"
                dataKey="x"
                name="Humedad"
                unit="%"
                domain={[0, 100]}
                stroke="transparent"
                axisLine={false}
                tickLine={false}
                tick={{ fill: CHART.text, fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Temperatura"
                unit="°C"
                stroke="transparent"
                axisLine={false}
                tickLine={false}
                tick={{ fill: CHART.text, fontSize: 11 }}
                width={38}
              />
              <ZAxis range={[8, 8]} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, n: string) => [num(v), n]}
                cursor={{ stroke: CHART.grid }}
              />
              <Scatter data={points} fill={CHART.accent} fillOpacity={0.35} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="mt-2 text-[11px] text-[var(--color-text-faint)]">
        Correlación no implica causalidad: la relación está mediada por la hora y la estación.
      </p>
    </Card>
  );
}

function pearson(pts: { x: number; y: number }[]): number {
  const n = pts.length;
  if (n < 3) return NaN;
  const sx = pts.reduce((s, p) => s + p.x, 0);
  const sy = pts.reduce((s, p) => s + p.y, 0);
  const sxy = pts.reduce((s, p) => s + p.x * p.y, 0);
  const sxx = pts.reduce((s, p) => s + p.x * p.x, 0);
  const syy = pts.reduce((s, p) => s + p.y * p.y, 0);
  const num_ = n * sxy - sx * sy;
  const den = Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
  return den === 0 ? NaN : num_ / den;
}
