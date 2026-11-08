import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useRegimes } from "../../api/hooks";
import type { RegimeProfile, Regimes } from "../../api/types";
import { num, timeLabel } from "../../lib/format";
import {
  monthsText,
  profileComparison,
  regimeColor,
  timelineSegments,
  type ProfileRow,
} from "../../lib/intelligence";
import { CHART, Badge, Card, ErrorState, tooltipStyle } from "../ui";
import { Details, Notice, PanelSkeleton } from "./parts";

const TITLE = "Patrones meteorológicos de la ciudad";

function CurrentRegimeBlock({ data }: { data: Regimes }) {
  const cur = data.current;
  if (!cur) return null;
  const prof = data.regimes.find((r) => r.regime_id === cur.regime_id);
  const diffuse = (cur.distance_ratio_to_second ?? 0) > 0.85 && cur.second_label;
  return (
    <section aria-label="Régimen actual">
      <div className="flex flex-wrap items-center gap-2">
        <span
          aria-hidden
          className="inline-block h-3 w-3 rounded-full"
          style={{ background: regimeColor(cur.regime_id) }}
        />
        <h3 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">{cur.label}</h3>
        <Badge tone={cur.distance_band === "típica" ? "ok" : cur.distance_band === "atípica" ? "warn" : "accent"}>
          distancia {cur.distance_band}
        </Badge>
      </div>
      {prof && <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-dim)]">{prof.description}</p>}
      <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-faint)]">{cur.explanation}</p>
      {diffuse && (
        <p className="mt-1 text-xs text-[var(--color-warn)]">
          Está casi a la misma distancia de «{cur.second_label}»: la frontera entre ambos regímenes
          es difusa.
        </p>
      )}
    </section>
  );
}

/** Perfil de cada régimen frente al clima de la ciudad (desviaciones típicas por variable). */
function ProfileChart({ regimes }: { regimes: RegimeProfile[] }) {
  const rows = useMemo(() => profileComparison(regimes), [regimes]);
  if (!rows.length) return null;
  return (
    <section aria-label="Comparación de perfiles" className="mt-8">
      <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-dim)]">
        ¿En qué se diferencian los regímenes?
      </h3>
      <p className="mt-1 text-xs text-[var(--color-text-faint)]">
        Cada barra muestra cuánto se aleja la mediana del régimen del clima medio de la ciudad
        (en desviaciones típicas): a la derecha, más que lo habitual; a la izquierda, menos.
      </p>
      <div className="mt-3" style={{ height: 56 + rows.length * 46 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
            <CartesianGrid stroke={CHART.grid} strokeDasharray="2 5" strokeOpacity={0.5} horizontal={false} />
            <XAxis
              type="number"
              domain={[-3, 3]}
              ticks={[-3, -2, -1, 0, 1, 2, 3]}
              tick={{ fill: CHART.text, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={112}
              tick={{ fill: CHART.text, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <ReferenceLine x={0} stroke={CHART.axis} />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: "var(--color-surface-2)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as ProfileRow;
                return (
                  <div style={tooltipStyle} className="px-3 py-2">
                    <p className="mb-1 font-medium">{row.name}</p>
                    {regimes.map((r) => (
                      <p key={r.regime_id} className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ background: regimeColor(r.regime_id) }}
                        />
                        <span>
                          {r.label}: {num(row[`m_${r.regime_id}`] as number, 1)} {row.unit}{" "}
                          <span className="text-[var(--color-text-faint)]">
                            ({num(row[`z_${r.regime_id}`] as number, 1)} σ)
                          </span>
                        </span>
                      </p>
                    ))}
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "var(--color-text-dim)" }}
              formatter={(_v, entry) => {
                const id = Number(String(entry.dataKey).replace("z_", ""));
                return regimes.find((r) => r.regime_id === id)?.label ?? String(entry.dataKey);
              }}
            />
            {regimes.map((r) => (
              <Bar
                key={r.regime_id}
                dataKey={`z_${r.regime_id}`}
                fill={regimeColor(r.regime_id)}
                radius={[0, 3, 3, 0]}
                maxBarSize={14}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

/** Tira de los últimos 7 días: un segmento por episodio, proporcional a su duración. */
function Timeline({ data }: { data: Regimes }) {
  const segments = useMemo(() => timelineSegments(data.episodes), [data.episodes]);
  if (!segments.length) return null;
  const first = data.episodes[0].start;
  const last = data.episodes[data.episodes.length - 1].end;
  return (
    <section aria-label="Evolución reciente" className="mt-8">
      <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-dim)]">
        Últimos 7 días
      </h3>
      <div
        className="relative mt-3 h-8 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]"
        role="img"
        aria-label={`Secuencia de regímenes entre ${timeLabel(first)} y ${timeLabel(last)}: ${segments
          .map((s) => `${s.label} (${s.hours} h)`)
          .join(", ")}`}
      >
        {segments.map((s) => (
          <div
            key={`${s.start}-${s.regime_id}`}
            title={`${s.label} · ${timeLabel(s.start)} → ${timeLabel(s.end)} (${s.hours} h)`}
            className="absolute inset-y-0"
            style={{
              left: `${s.leftPct}%`,
              width: `${s.widthPct}%`,
              background: regimeColor(s.regime_id),
              opacity: 0.88,
              borderRight: "1px solid var(--color-surface)",
            }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-[var(--color-text-faint)]" aria-hidden>
        <span>{timeLabel(first)}</span>
        <span>{timeLabel(last)}</span>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-text-dim)]">
        {data.regimes.map((r) => (
          <li key={r.regime_id} className="flex items-center gap-1.5">
            <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: regimeColor(r.regime_id) }} />
            {r.label}
            <span className="text-[var(--color-text-faint)]">
              · {num(data.recent_share_pct[String(r.regime_id)] ?? 0, 0)} % de la semana
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RegimeList({ data }: { data: Regimes }) {
  const activeId = data.current?.regime_id;
  return (
    <section aria-label="Regímenes de la ciudad" className="mt-8">
      <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-dim)]">
        Los {data.regimes.length} regímenes de {data.location}
      </h3>
      <ul className="mt-3 space-y-3">
        {data.regimes.map((r) => (
          <li
            key={r.regime_id}
            className={`rounded-2xl border p-4 text-sm ${
              r.regime_id === activeId
                ? "border-[var(--color-accent)]"
                : "border-[var(--color-border)]"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: regimeColor(r.regime_id) }} />
              <span className="font-medium text-[var(--color-text)]">{r.label}</span>
              {r.regime_id === activeId && <Badge tone="accent">ahora</Badge>}
              <span className="mono ml-auto text-xs text-[var(--color-text-dim)]">
                {num(r.share_pct, 1)} % de las horas
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-dim)]">
              Mediana: {num(r.medians.temperature_2m, 1)} °C · humedad {num(r.medians.relative_humidity_2m, 0)} % ·
              viento {num(r.medians.wind_speed_10m, 1)} km/h · nubosidad {num(r.medians.cloud_cover, 0)} % ·
              llueve en {num(r.wet_share_pct, 0)} % de sus horas.
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-faint)]">
              Más frecuente en {monthsText(r.peak_months)}
              {r.persistence
                ? ` · suele durar ${num(r.persistence.median_hours, 0)} h seguidas (mediana de ${r.persistence.n_episodes} episodios)`
                : " · sin episodios suficientes para estimar su duración"}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Transitions({ data }: { data: Regimes }) {
  if (!data.current) return null;
  return (
    <section aria-label="Transiciones históricas" className="mt-8">
      <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-dim)]">
        Cuando este régimen termina, ¿qué suele venir después?
      </h3>
      {data.transitions_supported && data.transitions_from_current.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {data.transitions_from_current.map((t) => (
            <li key={t.to_regime_id} className="text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[var(--color-text-dim)]">{t.label}</span>
                <span className="mono text-xs">
                  {num(t.probability * 100, 0)} % <span className="text-[var(--color-text-faint)]">de {t.count} cambios</span>
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-[var(--color-surface-2)]" aria-hidden>
                <div
                  className="h-1.5 rounded-full"
                  style={{ width: `${t.probability * 100}%`, background: regimeColor(t.to_regime_id) }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-[var(--color-text-faint)]">
          No hay suficientes cambios históricos desde este régimen para estimar a cuál suele pasar.
        </p>
      )}
      <p className="mt-2 text-[11px] text-[var(--color-text-faint)]">
        Son frecuencias del histórico entre episodios consecutivos de regímenes distintos, no una predicción.
      </p>
    </section>
  );
}

export function RegimesPanel() {
  const q = useRegimes();

  if (q.isLoading) {
    return (
      <Card title={TITLE}>
        <PanelSkeleton rows={5} />
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

  if (d.status === "unavailable" || !d.regimes.length) {
    return (
      <Card title={TITLE} subtitle={d.location}>
        <Notice title="Esta ciudad aún no tiene regímenes calculados">
          {d.notes[0] ?? "Falta entrenar el modelo de agrupamiento (K-Means) para esta ciudad."}
        </Notice>
      </Card>
    );
  }

  return (
    <Card
      title={TITLE}
      subtitle={
        d.model
          ? `${d.location} · K-Means con k = ${d.model.k}${d.model.silhouette !== null ? ` · silhouette ${num(d.model.silhouette, 2)}` : ""}`
          : d.location
      }
    >
      {d.current ? (
        <CurrentRegimeBlock data={d} />
      ) : (
        <Notice title="No se pudo situar el momento actual">{d.notes[d.notes.length - 1]}</Notice>
      )}
      <ProfileChart regimes={d.regimes} />
      <Timeline data={d} />
      <RegimeList data={d} />
      <Transitions data={d} />
      <Details summary="Qué es un régimen y cómo se obtuvo">
        <p>
          K-Means asigna cada hora al régimen cuyo centroide está más cerca. No calcula
          probabilidades de pertenencia: «distancia típica» solo indica si la situación actual se
          parece a las habituales de su régimen.
        </p>
        {d.model && <p>{d.model.feature_space}.</p>}
        {d.model && <p>{d.model.labels_rule}</p>}
        {d.model && (
          <p>
            Basado en {d.model.n_observations.toLocaleString("es-ES")} horas
            ({new Date(d.model.period[0]).getFullYear()}–{new Date(d.model.period[1]).getFullYear()}).
          </p>
        )}
        {d.notes.map((n) => (
          <p key={n}>{n}</p>
        ))}
      </Details>
    </Card>
  );
}
