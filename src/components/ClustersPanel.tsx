import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ClusterModel } from "../api/types";
import { num } from "../lib/format";
import { CHART, Card, EmptyState } from "./ui";
import { tooltipStyle } from "./PredictionPanel";

export function ClustersPanel({
  data,
  activeCluster,
}: {
  data: ClusterModel;
  activeCluster: number | null;
}) {
  if (!data.clusters.length) {
    return (
      <Card title="Regímenes meteorológicos (K-Means)">
        <EmptyState title="Sin modelo de clustering" />
      </Card>
    );
  }

  const chartData = data.clusters.map((c) => ({
    name: `#${c.cluster_id}`,
    label: c.label,
    pct: c.share_pct,
    active: c.cluster_id === activeCluster,
  }));

  return (
    <Card
      title="Regímenes meteorológicos (K-Means)"
      subtitle={`k = ${data.k} · silhouette ${num(data.silhouette, 2)}`}
    >
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 28 }}>
            <XAxis type="number" hide domain={[0, "dataMax"]} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="transparent"
              axisLine={false}
              tickLine={false}
              tick={{ fill: CHART.text, fontSize: 12 }}
              width={36}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [`${num(v, 1)} %`, "de las horas"]}
              labelFormatter={(_l, p) => p?.[0]?.payload?.label ?? ""}
              cursor={{ fill: "var(--color-surface-2)" }}
            />
            <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.active ? CHART.accent : CHART.series[3]} />
              ))}
              <LabelList
                dataKey="pct"
                position="right"
                formatter={(v: number) => `${Math.round(v)}%`}
                fill={CHART.text}
                fontSize={11}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-3 space-y-1.5 text-xs">
        {data.clusters.map((c) => (
          <li
            key={c.cluster_id}
            className={`flex gap-2 ${c.cluster_id === activeCluster ? "text-[var(--color-accent)]" : "text-[var(--color-text-dim)]"}`}
          >
            <span className="mono">#{c.cluster_id}</span>
            <span>{c.label}</span>
            {c.centroid.temperature_2m !== undefined && (
              <span className="ml-auto text-[var(--color-text-faint)]">
                {num(c.centroid.temperature_2m, 0)}°C · {num(c.centroid.relative_humidity_2m, 0)}% HR
              </span>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
