import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Observation } from "../api/types";
import { num, timeLabel } from "../lib/format";
import { CHART, Card, ErrorState, Skeleton } from "./ui";
import { tooltipStyle } from "./PredictionPanel";

const RANGES = [
  { label: "48 h", hours: 48 },
  { label: "7 días", hours: 168 },
  { label: "30 días", hours: 720 },
];

const SERIES = {
  temperature_2m: { label: "Temperatura (°C)", color: CHART.series[0] },
  relative_humidity_2m: { label: "Humedad (%)", color: CHART.series[2] },
} as const;

export function HistoryCharts({
  data,
  isLoading,
  error,
  hours,
  onHoursChange,
}: {
  data?: Observation[];
  isLoading: boolean;
  error: Error | null;
  hours: number;
  onHoursChange: (h: number) => void;
}) {
  const [metric, setMetric] = useState<keyof typeof SERIES>("temperature_2m");

  const chartData = useMemo(
    () =>
      (data ?? []).map((o) => ({
        t: o.observed_at,
        value: o[metric] as number | null,
      })),
    [data, metric],
  );

  return (
    <Card
      title="Evolución temporal"
      subtitle="observaciones históricas y en tiempo real"
      right={
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.hours}
              onClick={() => onHoursChange(r.hours)}
              className={`rounded-full px-2.5 py-1 text-[11px] transition-colors ${
                hours === r.hours
                  ? "glass-soft text-[var(--color-accent)]"
                  : "text-[var(--color-text-faint)] hover:text-[var(--color-text)]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="mb-3 flex gap-2">
        {(Object.keys(SERIES) as (keyof typeof SERIES)[]).map((k) => (
          <button
            key={k}
            onClick={() => setMetric(k)}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              metric === k
                ? "glass-soft text-[var(--color-text)]"
                : "text-[var(--color-text-faint)] hover:text-[var(--color-text-dim)]"
            }`}
          >
            {SERIES[k].label}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState message={error.message} />
      ) : isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
              <defs>
                <linearGradient id={`hist-${metric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SERIES[metric].color} stopOpacity={0.32} />
                  <stop offset="100%" stopColor={SERIES[metric].color} stopOpacity={0} />
                </linearGradient>
              </defs>
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
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(t) => timeLabel(t as string)}
                formatter={(v: number) => [num(v), SERIES[metric].label]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={SERIES[metric].color}
                strokeWidth={1.8}
                fill={`url(#hist-${metric})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
