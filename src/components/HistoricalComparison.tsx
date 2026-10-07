import type { HistoricalComparison as Comparison } from "../api/types";
import { num, varLabel, varUnit } from "../lib/format";
import { Badge, Card } from "./ui";

export function HistoricalComparison({ data }: { data: Comparison }) {
  return (
    <Card
      title="Comparación con el histórico"
      subtitle={data.reference}
      right={
        data.is_anomaly === null ? null : data.is_anomaly ? (
          <Badge tone="danger">condición inusual</Badge>
        ) : (
          <Badge tone="ok">dentro de lo normal</Badge>
        )
      }
    >
      <ul className="space-y-4">
        {data.percentiles.map((p) => (
          <li key={p.variable}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-[var(--color-text-dim)]">{varLabel(p.variable)}</span>
              <span className="mono">
                {num(p.value)} {varUnit(p.variable)}{" "}
                <span className="text-[var(--color-text-faint)]">· percentil {Math.round(p.percentile)}</span>
              </span>
            </div>
            <PercentileBar percentile={p.percentile} />
            <p className="mt-1 text-[11px] text-[var(--color-text-faint)]">
              normal para esta época: {num(p.normal_range[0])}–{num(p.normal_range[1])}{" "}
              {varUnit(p.variable)}
            </p>
          </li>
        ))}
      </ul>

      {data.cluster_label && (
        <p className="mt-5 border-t border-[var(--color-border)] pt-4 text-sm text-[var(--color-text-dim)]">
          Régimen más parecido:{" "}
          <span className="text-[var(--color-text)]">
            #{data.cluster_id} · {data.cluster_label}
          </span>
          {data.anomaly_score !== null && (
            <span className="text-[var(--color-text-faint)]">
              {" "}
              · anomaly score {num(data.anomaly_score, 3)}
            </span>
          )}
        </p>
      )}
    </Card>
  );
}

function PercentileBar({ percentile }: { percentile: number }) {
  const extreme = percentile >= 90 || percentile <= 10;
  return (
    <div className="mt-1.5 h-2 w-full rounded-full bg-[var(--color-surface-2)]">
      <div
        className="h-2 rounded-full"
        style={{
          width: `${Math.max(2, Math.min(100, percentile))}%`,
          background: extreme ? "var(--color-warn)" : "var(--color-accent)",
        }}
      />
    </div>
  );
}
