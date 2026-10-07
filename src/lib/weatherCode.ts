// Interpretación puramente visual del weather_code (WMO 4677) que ya trae la API.
// No introduce datos nuevos: solo decide qué icono y qué fondo mostrar.

export type WeatherCategory = "clear" | "cloudy" | "fog" | "rain" | "storm" | "snow";

export interface WeatherVisual {
  category: WeatherCategory;
  label: string;
}

const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);
const STORM_CODES = new Set([95, 96, 99]);
const FOG_CODES = new Set([45, 48]);

const LABELS: Record<number, string> = {
  0: "Cielo despejado",
  1: "Mayormente despejado",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Niebla",
  48: "Niebla helada",
  51: "Llovizna ligera",
  53: "Llovizna",
  55: "Llovizna densa",
  56: "Llovizna helada",
  57: "Llovizna helada densa",
  61: "Lluvia ligera",
  63: "Lluvia",
  65: "Lluvia intensa",
  66: "Lluvia helada",
  67: "Lluvia helada intensa",
  71: "Nieve ligera",
  73: "Nieve",
  75: "Nieve intensa",
  77: "Granos de nieve",
  80: "Chubascos ligeros",
  81: "Chubascos",
  82: "Chubascos intensos",
  85: "Chubascos de nieve",
  86: "Chubascos de nieve intensos",
  95: "Tormenta",
  96: "Tormenta con granizo",
  99: "Tormenta fuerte con granizo",
};

export function weatherVisual(code: number | null | undefined): WeatherVisual {
  const c = code ?? 0;
  const label = LABELS[c] ?? "Condición desconocida";

  if (STORM_CODES.has(c)) return { category: "storm", label };
  if (SNOW_CODES.has(c)) return { category: "snow", label };
  if (RAIN_CODES.has(c)) return { category: "rain", label };
  if (FOG_CODES.has(c)) return { category: "fog", label };
  if (c === 0 || c === 1) return { category: "clear", label };
  return { category: "cloudy", label };
}
