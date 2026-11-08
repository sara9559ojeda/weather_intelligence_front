import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEvaluationPairs, useReliability } from "../../api/hooks";
import type { HorizonReliability } from "../../api/types";
import { num, timeLabel } from "../../lib/format";
import { forecastFan, pairRows, reliabilityTone } from "../../lib/intelligence";
import { CHART, Badge, Card, ErrorState, tooltipStyle } from "../ui";
import { Details, Notice, PanelSkeleton, Segmented, Stat, StatGrid } from "./parts";

const TITLE = "¿Qué tan confiable es el pronóstico?";
const DEFAULT_HORIZON = 6;
const HISTORY_DAYS = 30;

function ForecastFan({ horizons }: { horizons: HorizonReliability[] }) {
  const rows = useMemo(() => forecastFan(horizons), [horizons]);
  if (rows.length < 2) return null;
  return (
    <section aria-label="Intervalos por horizonte" className="mt-6">
      <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-dim)]">
        Pronóstico e intervalo según el horizonte
      </h3>
      <div className="mt-2 h-52">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
            <CartesianGrid stroke={CHART.grid} strokeDasharray="2 5" strokeOpacity={0.5} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: CHART.text, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: CHART.text, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={40}
              domain={["auto", "auto"]}
              unit="°"
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number | number[], name: string) =>
                Array.isArray(v) ? [`${num(v[0])} – ${num(v[1])} °C`, "Intervalo"] : [`${num(v)} °C`, name]
              }
            />
            <Area
              dataKey="band"
              name="Intervalo"
              stroke="none"
              fill={CHART.series[0]}
              fillOpacity={0.2}
              isAnimationActive={false}
            />
            <Line
              dataKey="predicted"
              name="Pronóstico"
              stroke={CHART.series[0]}
              strokeWidth={2}
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function VerifiedHistory({ horizon }: { horizon: number }) {
  const pairs = useEvaluationPairs(HISTORY_DAYS, horizon);
  const rows = useMemo(() => pairRows(pairs.data?.points ?? []), [pairs.data]);
  const inside = rows.filter((r) => r.inside === true).length;
  const bounded = rows.filter((r) => r.inside !== null).length;

  return (
    <section aria-label="Historial verificado" className="mt-6">
      <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-dim)]">
        Qué pasó con los pronósticos a +{horizon} h ya verificados ({HISTORY_DAYS} días)
      </h3>
      {pairs.isLoading ? (
        <div className="mt-2 h-40 animate-pulse rounded-2xl bg-[var(--color-surface-2)]" aria-hidden />
      ) : pairs.error ? (
        <div className="mt-2">
          <ErrorState message={pairs.error.message} onRetry={() => pairs.refetch()} />
        </div>
      ) : rows.length < 2 ? (
        <div className="mt-2">
          <Notice title="Aún no hay suficientes pronósticos verificados de este horizonte">
            Cada pronóstico emitido se compara con lo que realmente se observó cuando llega su hora.
            Esta gráfica aparecerá en cuanto haya resultados; no se rellena con datos inventados.
          </Notice>
        </div>
      ) : (
        <>
          <div className="mt-2 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
                <CartesianGrid stroke={CHART.grid} strokeDasharray="2 5" strokeOpacity={0.5} vertical={false} />
                <XAxis
                  dataKey="t"
                  type="number"
                  scale="time"
                  domain={["dataMin", "dataMax"]}
                  tick={{ fill: CHART.text, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={40}
                  tickFormatter={(t: number) => timeLabel(new Date(t).toISOString()).replace(",", "")}
                />
                <YAxis tick={{ fill: CHART.text, fontSize: 11 }} axisLine={false} tickLine={false} width={40} domain={["auto", "auto"]} unit="°" />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(t) => timeLabel(new Date(t as number).toISOString())}
                  formatter={(v: number | number[], name: string) =>
                    Array.isArray(v) ? [`${num(v[0])} – ${num(v[1])} °C`, "Intervalo"] : [`${num(v)} °C`, name]
                  }
                />
                <Area dataKey="band" name="Intervalo" stroke="none" fill={CHART.series[0]} fillOpacity={0.18} isAnimationActive={false} />
                <Line dataKey="predicted" name="Pronosticado" stroke={CHART.series[0]} strokeWidth={1.4} dot={false} isAnimationActive={false} />
                <Line dataKey="observed" name="Observado" stroke={CHART.series[1]} strokeWidth={1.8} dot={false} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {bounded > 0 && (
            <p className="mt-2 text-xs text-[var(--color-text-faint)]">
              En {inside} de {bounded} casos el valor observado cayó dentro del intervalo
              {pairs.data && pairs.data.n_total > rows.length
                ? ` (se muestran los ${rows.length} más recientes de ${pairs.data.n_total})`
                : ""}
              .
            </p>
          )}
        </>
      )}
    </section>
  );
}

function ReliabilityDetail({ h }: { h: HorizonReliability }) {
  const measuredLive = h.live_n >= 30 && h.live_coverage_pct !== null;
  const coverage = measuredLive ? h.live_coverage_pct : h.offline_coverage_pct;
  const meanWidth = measuredLive ? h.live_mean_width : h.offline_mean_width;
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={reliabilityTone(h.level)}>confiabilidad {h.level_label.toLowerCase()}</Badge>
        {h.degraded && <Badge tone="warn">deterioro reciente</Badge>}
        {h.interval_method === "conformal_rolling" && <Badge tone="accent">intervalo recalibrado</Badge>}
      </div>
      <p className="mt-3 text-base leading-relaxed text-[var(--color-text)]">{h.statement}</p>

      <div className="mt-5">
        <StatGrid>
          <Stat
            label="Pronóstico"
            value={`${num(h.predicted_temperature)} °C`}
            hint={h.target_time ? `para ${timeLabel(h.target_time)}` : undefined}
          />
          <Stat
            label="Intervalo"
            value={`${num(h.lower_bound)}–${num(h.upper_bound)}`}
            hint={`ancho ${num(h.interval_width)} °C`}
          />
          <Stat
            label="Nivel nominal"
            value={h.nominal_level !== null ? `${num(h.nominal_level * 100, 0)} %` : "—"}
            hint="lo que el intervalo busca cubrir"
          />
          <Stat
            label={measuredLive ? "Cobertura real" : "Cobertura (prueba)"}
            value={coverage !== null ? `${num(coverage, 0)} %` : "—"}
            hint={
              measuredLive
                ? `${h.live_n} pronósticos verificados`
                : h.offline_n
                  ? `${h.offline_n.toLocaleString("es-ES")} casos offline`
                  : undefined
            }
          />
        </StatGrid>
        {meanWidth !== null && (
          <p className="mt-3 text-xs text-[var(--color-text-faint)]">
            Ancho medio de los intervalos evaluados: {num(meanWidth)} °C.
          </p>
        )}
      </div>

      {/* En estado preliminar los motivos ya cuentan lo mismo: se evita repetirlo. */}
      {h.level !== "preliminar" && h.level !== "no_evaluable" && (
        <p className="mt-4 text-sm text-[var(--color-text-dim)]">{h.coverage_statement}</p>
      )}
      <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-[var(--color-text-dim)]">
        {h.reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] leading-relaxed text-[var(--color-text-faint)]">
        La cobertura es la frecuencia con que, en el pasado, el valor real cayó dentro del
        intervalo. No es la probabilidad de que este pronóstico concreto acierte.
      </p>
    </>
  );
}

export function ReliabilityPanel() {
  const q = useReliability();
  const [horizon, setHorizon] = useState(DEFAULT_HORIZON);

  if (q.isLoading) {
    return (
      <Card title={TITLE}>
        <PanelSkeleton rows={4} />
      </Card>
    );
  }
  if (q.error || !q.data) {
    return (
      <Card title={TITLE}>
        <ErrorState message={q.error?.message ?? "Sin respuesta"} onRetry={() => q.refetch()} />
      </Card>
    );
  }
  const d = q.data;
  const available = d.horizons.filter((h) => h.predicted_temperature !== null);

  if (d.status !== "ok" || !available.length) {
    return (
      <Card title={TITLE} subtitle={d.location}>
        <Notice title="No hay un pronóstico vigente que evaluar">
          {d.notes[0] ?? "Faltan modelos entrenados o datos recientes de esta ciudad."}
        </Notice>
      </Card>
    );
  }

  const selected = available.find((h) => h.horizon_hours === horizon) ?? available[0];

  return (
    <Card
      title={TITLE}
      subtitle={`${d.location} · intervalos evaluados con pronósticos reales verificados`}
      right={
        <Segmented
          label="Horizonte"
          value={selected.horizon_hours}
          onChange={setHorizon}
          options={available.map((h) => ({ value: h.horizon_hours, text: `+${h.horizon_hours} h` }))}
        />
      }
    >
      <ReliabilityDetail h={selected} />
      <ForecastFan horizons={available} />
      <VerifiedHistory horizon={selected.horizon_hours} />
      <Details summary="Cómo se decide la etiqueta de confiabilidad">
        {d.criteria.map((c) => (
          <p key={c}>{c}</p>
        ))}
        {d.notes.map((n) => (
          <p key={n}>{n}</p>
        ))}
      </Details>
    </Card>
  );
}
