import type { CorrelationMatrix } from "../api/types";
import { num, varLabel } from "../lib/format";
import { Card, Skeleton } from "./ui";

/** Azul (−1) → gris (0) → naranja (+1). */
function cellColor(v: number | null): string {
  if (v === null) return "var(--color-surface-2)";
  const t = Math.max(-1, Math.min(1, v));
  if (t >= 0) return `color-mix(in srgb, var(--color-chart-2) ${Math.round(t * 85)}%, var(--color-surface-2))`;
  return `color-mix(in srgb, var(--color-chart-1) ${Math.round(-t * 85)}%, var(--color-surface-2))`;
}

export function CorrelationHeatmap({
  data,
  isLoading,
}: {
  data?: CorrelationMatrix;
  isLoading: boolean;
}) {
  return (
    <Card title="Matriz de correlación" subtitle={data ? `Pearson · ${data.period}` : undefined}>
      {isLoading || !data ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-1 text-center text-[11px]">
            <thead>
              <tr>
                <th className="w-28" />
                {data.variables.map((v) => (
                  <th key={v} className="p-1 text-[var(--color-text-faint)]">
                    {varLabel(v).split(" ")[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.variables.map((rowVar, i) => (
                <tr key={rowVar}>
                  <th className="pr-2 text-right font-normal text-[var(--color-text-dim)]">
                    {varLabel(rowVar)}
                  </th>
                  {data.matrix[i].map((v, j) => (
                    <td
                      key={j}
                      className="mono rounded p-1"
                      style={{ background: cellColor(v), color: "var(--color-text)" }}
                      title={`${varLabel(rowVar)} × ${varLabel(data.variables[j])}: ${num(v ?? 0, 2)}`}
                    >
                      {v === null ? "—" : num(v, 2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
