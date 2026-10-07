import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Area,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HorizonPrediction, ModelRun } from "../api/types";
import { num } from "../lib/format";
import { CHART, EmptyState } from "./ui";

export function PredictionPanel({
  predictions,
  currentTemp,
  modelPerformance = [],
}: {
  predictions: HorizonPrediction[];
  currentTemp: number | null;
  modelPerformance?: ModelRun[];
}) {
  const [open, setOpen] = useState(false);

  const sorted = useMemo(
    () => [...predictions].sort((a, b) => a.horizon_hours - b.horizon_hours),
    [predictions],
  );

  const soonest = sorted[0];
  const champion = soonest
    ? modelPerformance.find((r) => r.horizon_hours === soonest.horizon_hours)
    : undefined;
  const skill = champion ? (champion.metrics?.test as Record<string, number> | undefined)?.skill_vs_persistence : undefined;

  if (predictions.length === 0) {
    return (
      <section className="glass rounded-[var(--radius-card)] px-6 py-6">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-dim)]">
          Pronóstico
        </p>
        <div className="mt-3">
          <EmptyState
            title="Sin predicción disponible"
            hint="Se necesita una secuencia horaria reciente y continua de observaciones."
          />
        </div>
      </section>
    );
  }

  const chartData = [
    currentTemp !== null
      ? { h: 0, temp: currentTemp, lo: currentTemp, hi: currentTemp }
      : null,
    ...sorted.map((p) => ({
      h: p.horizon_hours,
      temp: p.predicted_temperature,
      lo: p.lower_bound,
      hi: p.upper_bound,
    })),
  ].filter(Boolean) as { h: number; temp: number; lo: number; hi: number }[];

  const delta =
    soonest && currentTemp !== null ? soonest.predicted_temperature - currentTemp : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="glass rounded-[var(--radius-card)] px-6 py-6 sm:px-8 sm:py-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-accent)]">
            Pronóstico
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-dim)]">
            Intervalo de predicción · 90 %
          </p>
        </div>
        {soonest && (
          <div className="text-right">
            <p className="mono text-3xl font-light text-[var(--color-text)]">
              {num(soonest.predicted_temperature, 0)}°
              {delta !== null && (
                <span
                  className={`ml-2 align-middle text-sm font-medium ${
                    delta >= 0 ? "text-[var(--color-warn)]" : "text-[var(--color-accent)]"
                  }`}
                >
                  {delta >= 0 ? "+" : ""}
                  {num(delta, 1)}°
                </span>
              )}
            </p>
            <p className="text-xs text-[var(--color-text-faint)]">en {soonest.horizon_hours} h</p>
          </div>
        )}
      </div>

      <div className="mt-5 h-52">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: -8 }}>
            <defs>
              <linearGradient id="predBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART.accent} stopOpacity={0.28} />
                <stop offset="100%" stopColor={CHART.accent} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="predLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={CHART.series[2]} />
                <stop offset="100%" stopColor={CHART.accent} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="h"
              tickFormatter={(h) => (h === 0 ? "ahora" : `+${h}h`)}
              stroke="transparent"
              tick={{ fill: CHART.text, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="transparent"
              tick={{ fill: CHART.text, fontSize: 11 }}
              width={34}
              domain={["dataMin - 2", "dataMax + 2"]}
              tickFormatter={(v) => `${Math.round(v)}°`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(h) => (h === 0 ? "Ahora" : `Dentro de ${h} h`)}
              formatter={(value: number, name: string) => [
                `${num(value)} °C`,
                name === "temp" ? "predicción" : name === "hi" ? "máx" : "mín",
              ]}
            />
            <Area type="monotone" dataKey="hi" stroke="none" fill="url(#predBand)" />
            <Area type="monotone" dataKey="lo" stroke="none" fill="var(--color-bg)" fillOpacity={0.001} />
            <Line
              type="monotone"
              dataKey="temp"
              stroke="url(#predLine)"
              strokeWidth={2.4}
              dot={{ r: 2.5, fill: CHART.accent, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-[var(--color-text-faint)]">
        {sorted.map((p) => (
          <span key={p.horizon_hours}>
            +{p.horizon_hours} h <span className="mono text-[var(--color-text-dim)]">{num(p.predicted_temperature, 0)}°</span>
          </span>
        ))}
      </div>

      {champion && (
        <div className="mt-5 border-t border-[color-mix(in_srgb,var(--color-text)_8%,transparent)] pt-4">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-dim)] transition-colors hover:text-[var(--color-text)]"
          >
            <motion.span
              animate={{ rotate: open ? 90 : 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="inline-block"
            >
              ›
            </motion.span>
            ¿Por qué esta predicción?
          </button>
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <p className="mt-3 max-w-prose text-sm leading-relaxed text-[var(--color-text-dim)]">
                  El modelo campeón para +{champion.horizon_hours} h es{" "}
                  <span className="text-[var(--color-text)]">{champion.model_type}</span>, elegido
                  por menor RMSE de validación entre varios candidatos.{" "}
                  {skill !== undefined && (
                    <>
                      Sobre el conjunto de test, mejora un{" "}
                      <span className="text-[var(--color-text)]">
                        {skill > 0 ? "+" : ""}
                        {num(skill * 100, 0)} %
                      </span>{" "}
                      al pronóstico ingenuo de persistencia (suponer que el clima no cambia).
                    </>
                  )}{" "}
                  La banda sombreada es el intervalo de predicción del 5º al 95º percentil: nueve
                  de cada diez veces, la temperatura real debería caer dentro de ella.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.section>
  );
}

export const tooltipStyle = {
  background: "color-mix(in srgb, var(--color-surface) 72%, transparent)",
  backdropFilter: "blur(14px)",
  border: "1px solid var(--glass-border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--color-text)",
  boxShadow: "0 12px 32px -16px rgba(0,0,0,0.35)",
};
