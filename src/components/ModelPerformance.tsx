import type { ModelRun } from "../api/types";
import { num } from "../lib/format";
import { Card } from "./ui";

export function ModelPerformance({ runs }: { runs: ModelRun[] }) {
  const champions = [...runs].sort((a, b) => a.horizon_hours - b.horizon_hours);

  return (
    <Card
      title="Rendimiento del modelo"
      subtitle="métricas de test del campeón por horizonte"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[var(--color-text-faint)]">
            <tr className="text-left text-xs">
              <th className="py-1.5 font-normal">Horizonte</th>
              <th className="py-1.5 text-right font-normal">MAE</th>
              <th className="py-1.5 text-right font-normal">RMSE</th>
              <th className="py-1.5 text-right font-normal">R²</th>
              <th className="py-1.5 text-right font-normal">skill vs persistencia</th>
            </tr>
          </thead>
          <tbody className="mono">
            {champions.map((r) => {
              const test = (r.metrics?.test ?? {}) as Record<string, number>;
              const skill = test.skill_vs_persistence;
              return (
                <tr key={r.horizon_hours} className="border-t border-[var(--color-border)]">
                  <td className="py-2">+{r.horizon_hours} h</td>
                  <td className="py-2 text-right">{num(test.mae ?? r.mae)}</td>
                  <td className="py-2 text-right">{num(test.rmse ?? r.rmse)}</td>
                  <td className="py-2 text-right">{num(test.r2 ?? r.r2, 3)}</td>
                  <td
                    className={`py-2 text-right ${
                      skill > 0 ? "text-[var(--color-ok)]" : "text-[var(--color-warn)]"
                    }`}
                  >
                    {skill !== undefined ? `${skill > 0 ? "+" : ""}${num(skill, 2)}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] text-[var(--color-text-faint)]">
        Modelo: {champions[0]?.model_type ?? "—"}. El test (los ~4 años más recientes) se evaluó una
        sola vez.
      </p>
    </Card>
  );
}
