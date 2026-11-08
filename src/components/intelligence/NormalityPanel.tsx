import { useNormality } from "../../api/hooks";
import type { VariableNormality } from "../../api/types";
import { num } from "../../lib/format";
import { classificationTone, representativenessTone } from "../../lib/intelligence";
import { Badge, Card, ErrorState } from "../ui";
import { Details, Notice, PanelSkeleton } from "./parts";

const TITLE = "¿Qué tan normal es el tiempo de hoy?";

/** Barra 0–100 de percentiles: la franja es lo habitual (P10–P90) y la marca, el valor actual. */
function PercentileBar({ percentile }: { percentile: number }) {
  return (
    <div className="relative mt-2 h-2 w-full rounded-full bg-[var(--color-surface-2)]" aria-hidden>
      <div
        className="absolute inset-y-0 rounded-full bg-[color-mix(in_srgb,var(--color-accent)_28%,transparent)]"
        style={{ left: "10%", width: "80%" }}
      />
      <div
        className="absolute top-1/2 h-4 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-accent)] shadow"
        style={{ left: `${Math.max(1, Math.min(99, percentile))}%` }}
      />
    </div>
  );
}

function VariableRow({ v }: { v: VariableNormality }) {
  if (v.status !== "ok" || v.value === null) {
    // Sin muestra suficiente (o variable ausente): se dice, no se rellena.
    return (
      <li className="text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[var(--color-text-dim)]">{v.label}</span>
          <span className="text-xs text-[var(--color-text-faint)]">
            {v.status === "not_applicable" ? "sin dato" : "muestra insuficiente"}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-[var(--color-text-faint)]">{v.explanation}</p>
      </li>
    );
  }
  if (v.percentile === null) {
    // Hora seca: la precipitación solo se compara cuando llueve.
    return (
      <li className="text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[var(--color-text-dim)]">{v.label}</span>
          <span className="mono">
            {num(v.value, 1)} {v.unit}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-[var(--color-text-faint)]">{v.explanation}</p>
      </li>
    );
  }
  return (
    <li className="text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-[var(--color-text-dim)]">{v.label}</span>
        <span className="flex items-center gap-2">
          <span className="mono">
            {num(v.value, v.unit === "hPa" || v.unit === "%" ? 0 : 1)} {v.unit}
          </span>
          <Badge tone={classificationTone(v.classification)}>{v.classification_label}</Badge>
        </span>
      </div>
      <PercentileBar percentile={v.percentile} />
      <p className="mt-1.5 text-[11px] text-[var(--color-text-faint)]">
        Percentil {num(v.percentile, 0)}
        {v.usual_range && (
          <>
            {" "}
            · lo habitual (P10–P90): {num(v.usual_range[0], 1)}–{num(v.usual_range[1], 1)} {v.unit}
          </>
        )}
        {v.is_extreme && " · poco frecuente en esta ciudad (no implica peligro)"}
      </p>
    </li>
  );
}

export function NormalityPanel() {
  const q = useNormality();

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
  const ref = d.reference;

  if (d.status === "insufficient" || d.status === "unavailable" || !ref) {
    return (
      <Card title={TITLE} subtitle={d.location}>
        <Notice title="Todavía no hay base para comparar">
          {d.summary}
          {d.notes[0] && <p className="mt-1 text-xs text-[var(--color-text-faint)]">{d.notes[0]}</p>}
        </Notice>
      </Card>
    );
  }

  const temp = d.variables.find((v) => v.variable === "temperature_2m");
  const an = d.anomaly;
  const anomalyBadge =
    an && an.available ? (
      an.is_multivariate_anomaly ? (
        <Badge tone="warn">combinación inusual</Badge>
      ) : (
        <Badge tone="ok">combinación habitual</Badge>
      )
    ) : (
      <Badge tone="neutral">detector no disponible</Badge>
    );

  return (
    <Card
      title={TITLE}
      subtitle={`${d.location} · comparado con ${ref.n_observations.toLocaleString("es-ES")} observaciones comparables`}
      right={anomalyBadge}
    >
      {/* La frase principal sale tal cual del backend: es la misma que usa el analista. */}
      <p className="text-base leading-relaxed text-[var(--color-text)]">
        {temp?.status === "ok" && temp.explanation ? temp.explanation : d.summary}
      </p>

      <ul className="mt-5 space-y-5">
        {d.variables.map((v) => (
          <VariableRow key={v.variable} v={v} />
        ))}
      </ul>

      {an && (
        <section className="mt-6 border-t border-[var(--color-border)] pt-4" aria-label="Anomalías">
          <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-dim)]">
            ¿Es una combinación rara o solo un valor extremo?
          </h3>
          <p className="mt-2 text-sm text-[var(--color-text-dim)]">{an.explanation}</p>
          {an.contributors.length > 0 && (
            <p className="mt-2 text-xs text-[var(--color-text-faint)]">
              Variables más alejadas de lo habitual:{" "}
              {an.contributors
                .map((c) => `${c.label.toLowerCase()} (percentil ${num(c.percentile, 0)}, ${c.direction === "above" ? "por encima" : "por debajo"})`)
                .join("; ")}
              . Es una asociación estadística, no una causa.
            </p>
          )}
        </section>
      )}

      {d.similar?.available && (
        <p className="mt-4 text-sm text-[var(--color-text-dim)]">{d.similar.explanation}</p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-faint)]">
        <Badge tone={representativenessTone(ref.representativeness)}>
          representatividad {ref.representativeness}
        </Badge>
        <span>
          {ref.description} · {ref.years ?? "—"} años
          {ref.period_start && ref.period_end &&
            ` (${new Date(ref.period_start).getFullYear()}–${new Date(ref.period_end).getFullYear()})`}
        </span>
      </div>
      {ref.widened && (
        <p className="mt-2 text-xs text-[var(--color-warn)]">
          Se amplió la ventana de comparación porque no había suficientes registros del mismo mes y
          hora: la referencia es menos específica.
        </p>
      )}

      <Details summary="Cómo se calcula">
        {d.notes.map((n) => (
          <p key={n}>{n}</p>
        ))}
        <p>
          La referencia solo usa registros históricos anteriores al momento analizado y se exige un
          mínimo de {ref.min_sample} observaciones; si no se alcanza, el sistema no emite conclusión.
        </p>
      </Details>
    </Card>
  );
}
