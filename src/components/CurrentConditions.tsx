import { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { CurrentWeather, Observation } from "../api/types";
import { num, relativeAge } from "../lib/format";
import { weatherVisual } from "../lib/weatherCode";
import { Badge } from "./ui";

const SECONDARY = [
  { key: "relative_humidity_2m", label: "Humedad", unit: "%", digits: 0 },
  { key: "wind_speed_10m", label: "Viento", unit: "km/h", digits: 0 },
  { key: "surface_pressure", label: "Presión", unit: "hPa", digits: 0 },
  { key: "precipitation", label: "Precipitación", unit: "mm", digits: 1 },
  { key: "cloud_cover", label: "Nubosidad", unit: "%", digits: 0 },
] as const;

const rise = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

/**
 * El héroe de la app: ciudad, temperatura y condición flotan directamente
 * sobre el fondo meteorológico — sin tarjeta, sin caja. El propio fondo
 * (WeatherBackground) hace de "icono"; aquí solo vive el texto.
 */
export function CurrentConditions({
  data,
  recentObservations,
}: {
  data: CurrentWeather;
  recentObservations?: Observation[];
}) {
  const o = data.observation;
  const visual = weatherVisual(o.weather_code);
  const tempRounded = o.temperature_2m !== null ? Math.round(o.temperature_2m) : null;

  const { hi, lo } = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const temps = (recentObservations ?? [])
      .filter((r) => new Date(r.observed_at).getTime() >= cutoff && r.temperature_2m !== null)
      .map((r) => r.temperature_2m as number);
    if (o.temperature_2m !== null) temps.push(o.temperature_2m);
    if (!temps.length) return { hi: null, lo: null };
    return { hi: Math.max(...temps), lo: Math.min(...temps) };
  }, [recentObservations, o.temperature_2m]);

  return (
    <div className="px-1 pt-6 sm:pt-10">
      <motion.div
        initial="initial"
        animate="animate"
        transition={{ staggerChildren: 0.07, delayChildren: 0.05 }}
        className="flex flex-col items-start"
      >
        <motion.div
          variants={rise}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="flex items-center gap-3"
        >
          <h1
            className="text-[15px] font-medium tracking-tight text-[var(--color-text)]"
            style={{ textShadow: "0 1px 24px color-mix(in srgb, var(--color-bg) 40%, transparent)" }}
          >
            {data.location}
          </h1>
          <Badge tone={data.delayed ? "warn" : "ok"}>
            {o.source === "realtime" ? "tiempo real" : o.source} · {relativeAge(data.age_minutes)}
          </Badge>
        </motion.div>

        <motion.div variants={rise} transition={{ duration: 0.6, ease: "easeOut" }}>
          <AnimatePresence mode="popLayout">
            <motion.p
              key={tempRounded ?? "na"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="mono -ml-1 font-extralight leading-none tracking-tighter text-[var(--color-text)]"
              style={{ fontSize: "clamp(5.5rem, 15vw, 10.5rem)" }}
            >
              {num(o.temperature_2m, 0)}
              <span className="align-top text-[0.3em] font-light text-[var(--color-text-dim)]">°</span>
            </motion.p>
          </AnimatePresence>
        </motion.div>

        <motion.p
          variants={rise}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="-mt-2 text-lg font-medium text-[var(--color-text)] sm:text-xl"
        >
          {visual.label}
        </motion.p>

        <motion.p
          variants={rise}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mt-2 text-sm text-[var(--color-text-dim)]"
        >
          Sensación {num(o.apparent_temperature, 0)}°
          {hi !== null && lo !== null && (
            <>
              <span className="mx-2 text-[var(--color-text-faint)]">·</span>
              Máx {num(hi, 0)}° · Mín {num(lo, 0)}°
              <span className="text-[var(--color-text-faint)]"> (24 h)</span>
            </>
          )}
        </motion.p>

        <motion.div
          variants={rise}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-9 flex flex-wrap gap-x-8 gap-y-5 sm:gap-x-10"
        >
          {SECONDARY.map((m) => (
            <div key={m.key} className="min-w-[5.5rem]">
              <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
                {m.label}
              </p>
              <p className="mono mt-1 text-base font-medium text-[var(--color-text)]">
                {num(o[m.key], m.digits)}
                <span className="ml-0.5 text-xs font-normal text-[var(--color-text-faint)]">
                  {m.unit}
                </span>
              </p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
