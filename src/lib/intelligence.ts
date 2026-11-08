// Lógica pura de los módulos de análisis contextual (sin React): transformar las respuestas
// de la API en lo que dibujan los paneles, y traducir códigos del backend a texto claro.
// Mantenerla aquí (y no en los componentes) permite razonar sobre ella sin renderizar nada.

import type {
  AnalystSectionKind,
  Evaluation,
  HorizonReliability,
  OfflineModel,
  PairPoint,
  RegimeEpisode,
  RegimeProfile,
  ReliabilityLevel,
} from "../api/types";
import { varLabel, varUnit } from "./format";

export type Tone = "neutral" | "ok" | "warn" | "danger" | "accent";

/* ---------------------------------------------------------------- tonos */

/** Rareza estadística ≠ peligro: ni siquiera un extremo se pinta como «peligro». */
export function classificationTone(key: string | null): Tone {
  switch (key) {
    case "typical":
      return "ok";
    case "slightly_low":
    case "slightly_high":
    case "low":
    case "high":
      return "accent";
    case "exceptional_low":
    case "exceptional_high":
      return "warn";
    default:
      return "neutral";
  }
}

export function reliabilityTone(level: ReliabilityLevel): Tone {
  switch (level) {
    case "alta":
      return "ok";
    case "media":
      return "accent";
    case "baja":
      return "warn";
    default:
      return "neutral";
  }
}

export function representativenessTone(r: "alta" | "media" | "baja"): Tone {
  return r === "alta" ? "ok" : r === "media" ? "accent" : "warn";
}

/** Color estable de un régimen (el mismo id → el mismo color en todos los gráficos). */
export const regimeColor = (regimeId: number): string =>
  `var(--color-chart-${(((regimeId % 5) + 5) % 5) + 1})`;

/* ---------------------------------------------------------------- textos */

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
  "septiembre", "octubre", "noviembre", "diciembre"];

export const monthName = (m: number): string => MONTHS[m - 1] ?? String(m);

export function monthsText(months: number[]): string {
  if (!months.length) return "todo el año";
  return months.map(monthName).join(" y ");
}

const MODEL_LABELS: Record<string, string> = {
  ridge: "Ridge (lineal)",
  random_forest: "Random Forest",
  hist_gradient_boosting: "Gradient Boosting",
  baseline_persistence: "Persistencia",
  baseline_seasonal: "Estacional",
  persistence: "Persistencia",
  seasonal: "Estacional",
};

export const modelLabel = (type: string): string =>
  MODEL_LABELS[type] ?? type.replace(/_/g, " ");

export const SECTION_LABELS: Record<AnalystSectionKind, string> = {
  datos: "Dato del sistema",
  asociacion: "Asociación estadística",
  hipotesis: "Hipótesis general",
};

/** Traduce el motivo por el que se usó la respuesta determinista en vez de la IA. */
export function fallbackExplanation(reason: string | null): string {
  if (!reason) return "";
  if (reason === "ia_no_configurada") {
    return "La IA no está activada en este servidor: la respuesta se construyó con plantillas a partir de los datos reales del sistema.";
  }
  if (reason === "ia_desactivada_por_el_usuario") return "Respuesta sin IA, por elección.";
  if (reason === "cupo_de_ia_agotado") {
    return "Se alcanzó el cupo de consultas a la IA por hora: esta respuesta se construyó con plantillas a partir de los datos.";
  }
  if (reason === "sin_datos") return "Todavía no hay datos suficientes de esta ciudad para consultar a la IA.";
  if (reason.startsWith("ia_no_disponible")) {
    return "La IA no estuvo disponible o su texto no superó la verificación de cifras: se muestra el análisis determinista con los datos reales.";
  }
  return "La IA no pudo responder: se muestra el análisis determinista con los datos reales.";
}

export const AVAILABILITY_LABELS: Record<string, string> = {
  observacion_actual: "Observación actual",
  normalidad: "Normalidad histórica",
  regimen: "Régimen meteorológico",
  pronostico: "Pronóstico e intervalos",
  evaluacion_de_pronosticos: "Evaluación de pronósticos",
  modelos: "Modelos entrenados",
};

/* ---------------------------------------------------------------- regímenes */

const PROFILE_VARIABLES = [
  "temperature_2m",
  "relative_humidity_2m",
  "wind_speed_10m",
  "cloud_cover",
  "shortwave_radiation",
  "surface_pressure",
  "precipitation",
] as const;

export interface ProfileRow {
  variable: string;
  name: string;
  unit: string;
  /** `z_<id>` = desviación del régimen respecto al clima de la ciudad; `m_<id>` = mediana real. */
  [key: string]: number | string;
}

const Z_LIMIT = 3;

/** Datos del gráfico «perfil de cada régimen»: desviación típica vs la ciudad, por variable. */
export function profileComparison(regimes: RegimeProfile[]): ProfileRow[] {
  return PROFILE_VARIABLES.filter((v) => regimes.every((r) => v in r.z_vs_city)).map((v) => {
    const row: ProfileRow = { variable: v, name: varLabel(v), unit: varUnit(v) };
    for (const r of regimes) {
      const z = r.z_vs_city[v] ?? 0;
      row[`z_${r.regime_id}`] = Math.max(-Z_LIMIT, Math.min(Z_LIMIT, Number(z.toFixed(2))));
      row[`m_${r.regime_id}`] = r.medians[v] ?? 0;
    }
    return row;
  });
}

export interface TimelineSegment {
  regime_id: number;
  label: string;
  leftPct: number;
  widthPct: number;
  start: string;
  end: string;
  hours: number;
}

/** Episodios → segmentos proporcionales al tiempo (tira de 7 días). */
export function timelineSegments(episodes: RegimeEpisode[]): TimelineSegment[] {
  if (!episodes.length) return [];
  const HOUR = 3_600_000;
  const t0 = Date.parse(episodes[0].start);
  const t1 = Date.parse(episodes[episodes.length - 1].end) + HOUR;
  const span = Math.max(HOUR, t1 - t0);
  return episodes.map((e) => {
    const s = Date.parse(e.start);
    const f = Date.parse(e.end) + HOUR;
    return {
      regime_id: e.regime_id,
      label: e.label,
      leftPct: ((s - t0) / span) * 100,
      widthPct: Math.max(0.4, ((f - s) / span) * 100),
      start: e.start,
      end: e.end,
      hours: e.hours,
    };
  });
}

/* ---------------------------------------------------------------- pronósticos */

export interface PairRow {
  t: number;
  observed: number;
  predicted: number;
  band: [number, number] | null;
  inside: boolean | null;
}

/** Pares predicho/observado ordenados en el tiempo, con la banda del intervalo. */
export function pairRows(points: PairPoint[]): PairRow[] {
  return [...points]
    .sort((a, b) => Date.parse(a.target_time) - Date.parse(b.target_time))
    .map((p) => {
      const band: [number, number] | null =
        p.lower !== null && p.upper !== null ? [p.lower, p.upper] : null;
      return {
        t: Date.parse(p.target_time),
        observed: p.observed,
        predicted: p.predicted,
        band,
        inside: band ? p.observed >= band[0] && p.observed <= band[1] : null,
      };
    });
}

export interface FanRow {
  label: string;
  horizon: number;
  predicted: number;
  band: [number, number];
}

/** Pronóstico actual con su intervalo, un punto por horizonte. */
export function forecastFan(horizons: HorizonReliability[]): FanRow[] {
  const rows: FanRow[] = [];
  for (const h of horizons) {
    if (h.predicted_temperature === null || h.lower_bound === null || h.upper_bound === null) continue;
    rows.push({
      label: `+${h.horizon_hours} h`,
      horizon: h.horizon_hours,
      predicted: h.predicted_temperature,
      band: [h.lower_bound, h.upper_bound],
    });
  }
  return rows.sort((a, b) => a.horizon - b.horizon);
}

/** Diferencia (en puntos porcentuales) entre la cobertura nominal y la medida. Positivo = cubre de menos. */
export function coverageGapPoints(h: HorizonReliability): number | null {
  const measured = h.live_n >= 30 ? h.live_coverage_pct : h.offline_coverage_pct;
  if (measured === null || h.nominal_level === null) return null;
  return Number((h.nominal_level * 100 - measured).toFixed(1));
}

export function evolutionRows(evaluation: Evaluation, horizon: number) {
  const series = evaluation.series.find((s) => s.horizon_hours === horizon);
  return (series?.points ?? []).map((p) => ({ day: p.day, mae: p.mae, rmse: p.rmse, n: p.n }));
}

export function modelVersions(evaluation: Evaluation): string[] {
  return [...new Set(evaluation.horizons.flatMap((h) => h.model_versions))];
}

export interface ModelCell {
  validRmse: number | null;
  testRmse: number | null;
  champion: boolean;
}

export interface ModelMatrix {
  horizons: number[];
  rows: { type: string; label: string; cells: Record<number, ModelCell | undefined> }[];
}

/** Matriz modelo × horizonte (RMSE de validación; el campeón lleva además su RMSE de prueba). */
export function modelMatrix(models: OfflineModel[]): ModelMatrix {
  const horizons = [...new Set(models.map((m) => m.horizon_hours))].sort((a, b) => a - b);
  const byType = new Map<string, ModelMatrix["rows"][number]>();
  for (const m of models) {
    const row = byType.get(m.model_type) ?? { type: m.model_type, label: modelLabel(m.model_type), cells: {} };
    row.cells[m.horizon_hours] = { validRmse: m.valid_rmse, testRmse: m.test_rmse, champion: m.is_champion };
    byType.set(m.model_type, row);
  }
  const mean = (r: ModelMatrix["rows"][number]) => {
    const v = Object.values(r.cells).flatMap((c) => (c?.validRmse != null ? [c.validRmse] : []));
    return v.length ? v.reduce((x, y) => x + y, 0) / v.length : Infinity;
  };
  return { horizons, rows: [...byType.values()].sort((a, b) => mean(a) - mean(b)) };
}

/** ¿El modelo supera a la referencia (persistencia) en este horizonte? null si no hay dato. */
export function beatsPersistence(h: { skill_vs_persistence: number | null }): boolean | null {
  return h.skill_vs_persistence === null ? null : h.skill_vs_persistence > 0;
}

export const PERIOD_OPTIONS = [7, 30, 90] as const;
export type PeriodDays = (typeof PERIOD_OPTIONS)[number];
