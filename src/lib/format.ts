const VAR_LABELS: Record<string, string> = {
  temperature_2m: "Temperatura",
  relative_humidity_2m: "Humedad relativa",
  dew_point_2m: "Punto de rocío",
  apparent_temperature: "Sensación térmica",
  surface_pressure: "Presión",
  pressure_msl: "Presión (nivel del mar)",
  precipitation: "Precipitación",
  cloud_cover: "Nubosidad",
  wind_speed_10m: "Viento",
  wind_gusts_10m: "Racha",
  shortwave_radiation: "Radiación solar",
};

const VAR_UNITS: Record<string, string> = {
  temperature_2m: "°C",
  relative_humidity_2m: "%",
  dew_point_2m: "°C",
  apparent_temperature: "°C",
  surface_pressure: "hPa",
  pressure_msl: "hPa",
  precipitation: "mm",
  cloud_cover: "%",
  wind_speed_10m: "km/h",
  wind_gusts_10m: "km/h",
  shortwave_radiation: "W/m²",
};

export const varLabel = (v: string) => VAR_LABELS[v] ?? v;
export const varUnit = (v: string) => VAR_UNITS[v] ?? "";

export function num(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString("es-ES", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function timeLabel(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function hourLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

export function relativeAge(minutes: number): string {
  if (minutes < 1) return "ahora mismo";
  if (minutes < 60) return `hace ${Math.round(minutes)} min`;
  return `hace ${Math.round(minutes / 60)} h`;
}
