import { useMemo, useState } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEvaluation, useEvaluationPairs } from "../../api/hooks";
import type { Evaluation } from "../../api/types";
import { num, timeLabel } from "../../lib/format";
import {
  beatsPersistence,
  evolutionRows,
  modelMatrix,
  modelLabel,
  modelVersions,
  pairRows,
  PERIOD_OPTIONS,
  type PeriodDays,
} from "../../lib/intelligence";
import { CHART, Card, ErrorState, tooltipStyle } from "../ui";
import { Details, Notice, PanelSkeleton, Segmented, Stat, StatGrid } from "./parts";

const TITLE = "¿Qué tan bien predice Weather Intelligence?";
const DEFAULT_HORIZON = 6;

const dateLabel = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function OfflineModels({ models }: { models: Evaluation["offline_models"] }) {
  const matrix = useMemo(() => modelMatrix(models), [models]);
  if (!matrix.rows.length) return null;
  return (
    <section aria-label="Comparación de modelos" className="mt-8">
      <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-dim)]">
        Comparación de modelos en el entrenamiento
      </h3>
      <p className="mt-1 text-xs text-[var(--color-text-faint)]">
        RMSE de validación en °C (menor es mejor) sobre un periodo histórico reservado: no son
        pronósticos emitidos en vivo. Se marca ★ el modelo campeón de cada horizonte, con su RMSE
        en el periodo de prueba.
      </p>
      {/* `relative`: los textos sr-only (position:absolute) deben quedar dentro del scroll. */}
      <div className="relative mt-3 overflow-x-auto">
        <table className="w-full min-w-[460px] text-left text-xs">
          <caption className="sr-only">RMSE de validación de cada modelo, por horizonte</caption>
          <thead className="text-[var(--color-text-faint)]">
            <tr>
              <th scope="col" className="py-1.5 pr-3 font-medium">Modelo</th>
              {matrix.horizons.map((h) => (
                <th key={h} scope="col" className="py-1.5 pl-2 text-right font-medium">+{h} h</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.rows.map((r) => (
              <tr key={r.type} className="border-t border-[var(--color-border)]">
                <th scope="row" className="py-2 pr-3 font-normal text-[var(--color-text)]">{r.label}</th>
                {matrix.horizons.map((h) => {
                  const c = r.cells[h];
                  return (
                    <td key={h} className="mono py-2 pl-2 text-right align-top">
                      {c ? (
                        <span className={c.champion ? "font-semibold text-[var(--color-accent)]" : ""}>
                          {c.champion && (
                            <span aria-hidden>★ </span>
                          )}
                          {num(c.validRmse, 2)}
                          {c.champion && <span className="sr-only"> (campeón)</span>}
                          {c.champion && c.testRmse !== null && (
                            <span className="block text-[10px] font-normal text-[var(--color-text-faint)]">
                              prueba {num(c.testRmse, 2)}
                            </span>
                          )}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function HorizonTable({ data }: { data: Evaluation }) {
  const rows = data.horizons.filter((h) => h.n_verified > 0);
  if (!rows.length) return null;
  return (
    <section aria-label="Error por horizonte" className="mt-6">
      <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-dim)]">
        Error por horizonte (últimos {data.window_days} días)
      </h3>
      <div className="relative mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-xs">
          <caption className="sr-only">Error de los pronósticos verificados por horizonte</caption>
          <thead className="text-[var(--color-text-faint)]">
            <tr>
              <th scope="col" className="py-1.5 pr-3 font-medium">Horizonte</th>
              <th scope="col" className="py-1.5 pr-3 text-right font-medium">Verificados</th>
              <th scope="col" className="py-1.5 pr-3 text-right font-medium">MAE °C</th>
              <th scope="col" className="py-1.5 pr-3 text-right font-medium">RMSE °C</th>
              <th scope="col" className="py-1.5 pr-3 text-right font-medium">Sesgo °C</th>
              <th scope="col" className="py-1.5 pr-3 text-right font-medium">MAE «no cambia» °C</th>
              <th scope="col" className="py-1.5 text-right font-medium">Cobertura</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => {
              const beats = beatsPersistence(h);
              return (
                <tr key={h.horizon_hours} className="border-t border-[var(--color-border)]">
                  <th scope="row" className="py-1.5 pr-3 font-normal text-[var(--color-text)]">
                    +{h.horizon_hours} h
                    {h.n_verified < 30 && (
                      <span className="ml-1 text-[var(--color-warn)]" title="Muestra pequeña: interpretar con cautela">
                        *
                      </span>
                    )}
                  </th>
                  <td className="mono py-1.5 pr-3 text-right">{h.n_verified}</td>
                  <td className="mono py-1.5 pr-3 text-right">{num(h.mae, 2)}</td>
                  <td className="mono py-1.5 pr-3 text-right">{num(h.rmse, 2)}</td>
                  <td className="mono py-1.5 pr-3 text-right">{num(h.bias, 2)}</td>
                  <td className="mono py-1.5 pr-3 text-right">
                    {h.persistence ? num(h.persistence.mae, 2) : "—"}
                    {beats !== null && (
                      <span className={beats ? "text-[var(--color-ok)]" : "text-[var(--color-warn)]"}>
                        {" "}
                        {beats ? "▲" : "▼"}
                        <span className="sr-only">{beats ? " el modelo mejora a esta referencia" : " el modelo no mejora a esta referencia"}</span>
                      </span>
                    )}
                  </td>
                  <td className="mono py-1.5 text-right">{h.coverage_pct !== null ? `${num(h.coverage_pct, 0)} %` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-[var(--color-text-faint)]">
        ▲ el modelo supera a «la temperatura no cambia» (persistencia) · * menos de 30 casos.
        «Observado» = dato de Open-Meteo, no una estación.
      </p>
      <Details summary="Lectura de cada horizonte">
        {rows.map((h) => (
          <p key={h.horizon_hours}>{h.explanation}</p>
        ))}
      </Details>
    </section>
  );
}

function PredictedVsObserved({ days, horizon }: { days: PeriodDays; horizon: number }) {
  const pairs = useEvaluationPairs(days, horizon);
  const rows = useMemo(() => pairRows(pairs.data?.points ?? []), [pairs.data]);
  return (
    <section aria-label="Predicho frente a observado" className="mt-6">
      <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-dim)]">
        Predicho vs observado a +{horizon} h
      </h3>
      {pairs.isLoading ? (
        <div className="mt-2 h-48 animate-pulse rounded-2xl bg-[var(--color-surface-2)]" aria-hidden />
      ) : pairs.error ? (
        <div className="mt-2"><ErrorState message={pairs.error.message} onRetry={() => pairs.refetch()} /></div>
      ) : rows.length < 2 ? (
        <p className="mt-2 text-sm text-[var(--color-text-faint)]">
          Todavía no hay suficientes pronósticos verificados a +{horizon} h en este periodo.
        </p>
      ) : (
        <div className="mt-2 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
              <CartesianGrid stroke={CHART.grid} strokeDasharray="2 5" strokeOpacity={0.5} vertical={false} />
              <XAxis
                dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]}
                tick={{ fill: CHART.text, fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={40}
                tickFormatter={(t: number) => timeLabel(new Date(t).toISOString()).replace(",", "")}
              />
              <YAxis tick={{ fill: CHART.text, fontSize: 11 }} axisLine={false} tickLine={false} width={40} domain={["auto", "auto"]} unit="°" />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(t) => timeLabel(new Date(t as number).toISOString())}
                formatter={(v: number) => [`${num(v)} °C`]}
              />
              <Line dataKey="predicted" name="Pronosticado" stroke={CHART.series[0]} strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line dataKey="observed" name="Observado" stroke={CHART.series[1]} strokeWidth={1.8} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

function Evolution({ data, horizon }: { data: Evaluation; horizon: number }) {
  const rows = useMemo(() => evolutionRows(data, horizon), [data, horizon]);
  return (
    <section aria-label="Evolución del error" className="mt-6">
      <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-dim)]">
        Evolución del error diario a +{horizon} h
      </h3>
      {rows.length < 2 ? (
        <p className="mt-2 text-sm text-[var(--color-text-faint)]">
          Se necesitan al menos dos días con pronósticos verificados para ver una tendencia.
        </p>
      ) : (
        <div className="mt-2 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
              <CartesianGrid stroke={CHART.grid} strokeDasharray="2 5" strokeOpacity={0.5} vertical={false} />
              <XAxis dataKey="day" tick={{ fill: CHART.text, fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={30} />
              <YAxis tick={{ fill: CHART.text, fontSize: 11 }} axisLine={false} tickLine={false} width={40} domain={[0, "auto"]} unit="°" />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string, p) => [`${num(v, 2)} °C (${(p.payload as { n: number }).n} casos)`, name]}
              />
              <Line dataKey="mae" name="MAE" stroke={CHART.series[2]} strokeWidth={2} dot={{ r: 2.5 }} isAnimationActive={false} />
              <Line dataKey="rmse" name="RMSE" stroke={CHART.series[3]} strokeWidth={1.4} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export function EvaluationPanel() {
  const [days, setDays] = useState<PeriodDays>(30);
  const [horizon, setHorizon] = useState(DEFAULT_HORIZON);
  const q = useEvaluation(days);

  const selector = (
    <Segmented
      label="Periodo evaluado"
      value={days}
      onChange={setDays}
      options={PERIOD_OPTIONS.map((d) => ({ value: d, text: `${d} días` }))}
    />
  );

  if (q.isLoading) {
    return (
      <Card title={TITLE} right={selector}>
        <PanelSkeleton rows={4} />
      </Card>
    );
  }
  if (q.error || !q.data) {
    return (
      <Card title={TITLE} right={selector}>
        <ErrorState message={q.error?.message ?? "Sin respuesta"} onRetry={() => q.refetch()} />
      </Card>
    );
  }
  const d = q.data;
  const versions = modelVersions(d);
  const verifiedHorizons = d.horizons.filter((h) => h.n_verified > 0).map((h) => h.horizon_hours);
  const activeHorizon = verifiedHorizons.includes(horizon) ? horizon : (verifiedHorizons[0] ?? horizon);

  return (
    <Card
      title={TITLE}
      subtitle={`${d.location} · pronósticos emitidos por el sistema y comparados con lo observado después`}
      right={selector}
    >
      {d.status === "ok" ? (
        <>
          <StatGrid>
            <Stat label="Pronósticos verificados" value={d.n_verified_total.toLocaleString("es-ES")} hint={`${d.n_pending} pendientes`} />
            <Stat label="Última verificación" value={dateLabel(d.last_verified_at)} />
            <Stat
              label="Versión del modelo"
              value={versions.length ? new Date(versions[0]).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }) : "—"}
              hint={versions.length > 1 ? `${versions.length} versiones en el periodo` : "fecha de entrenamiento"}
            />
            <Stat label="Registro desde" value={dateLabel(d.first_logged_at)} />
          </StatGrid>

          <HorizonTable data={d} />

          {verifiedHorizons.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="text-xs text-[var(--color-text-faint)]">Horizonte de las gráficas:</span>
              <Segmented
                label="Horizonte de las gráficas"
                value={activeHorizon}
                onChange={setHorizon}
                options={verifiedHorizons.map((h) => ({ value: h, text: `+${h} h` }))}
              />
            </div>
          )}
          <PredictedVsObserved days={days} horizon={activeHorizon} />
          <Evolution data={d} horizon={activeHorizon} />
        </>
      ) : (
        <Notice
          title={d.status === "collecting" ? "El registro acaba de empezar" : "Todavía no se ha emitido ningún pronóstico registrado"}
        >
          {d.notes[0]}
          {d.status === "collecting" && (
            <p className="mt-2 text-xs text-[var(--color-text-faint)]">
              {d.n_logged_total} pronósticos registrados · {d.n_pending} esperando su hora objetivo
              {d.first_logged_at ? ` · el primero se emitió el ${dateLabel(d.first_logged_at)}` : ""}.
              No se muestran métricas hasta que existan resultados verificados.
            </p>
          )}
        </Notice>
      )}

      <OfflineModels models={d.offline_models} />

      <Details summary="Cómo se evalúa">
        {d.notes.slice(d.status === "ok" ? 0 : 1).map((n) => (
          <p key={n}>{n}</p>
        ))}
        <p>
          Cada pronóstico se guarda en el momento de emitirse (con su modelo y versión) y no se
          reconstruye después con modelos nuevos. Se verifica unas 1,5 h tras su hora objetivo.
          MAE = error absoluto medio; RMSE penaliza más los errores grandes; sesgo positivo = el
          modelo sobreestima.
        </p>
        {d.horizons.some((h) => h.model_types.length > 0) && (
          <p>
            Modelos en el periodo:{" "}
            {[...new Set(d.horizons.flatMap((h) => h.model_types))].map(modelLabel).join(", ")}.
          </p>
        )}
      </Details>
    </Card>
  );
}
