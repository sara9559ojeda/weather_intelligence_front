// Textos de la landing. Todas las cifras salen de las ejecuciones reales del
// proyecto (docs/fase-4-anomalias.md, fase-5-modelado.md, fase-9-retraining.md) y de la
// base de datos a 8 nov 2026: 234.851 observaciones de Madrid-Barajas (desde 2000) más
// 147.765 de cada una de las cinco ciudades colombianas (desde 2010) = 973.676.

export const STATS = [
  { value: 6, decimals: 0, unit: "ciudades", label: "Madrid-Barajas y cinco ciudades colombianas, cada una con sus propios modelos" },
  { value: 973676, decimals: 0, unit: "", label: "observaciones horarias analizadas (a 8 nov 2026)" },
  { value: 0.72, decimals: 2, unit: "°C", label: "de error (RMSE) al predecir la próxima hora en Madrid, sobre datos de prueba" },
  { value: 5, decimals: 0, unit: "", label: "horizontes de predicción: 1, 3, 6, 12 y 24 h" },
] as const;

export type FeatureIcon = "sun" | "trend" | "history" | "layers" | "alert" | "spark";

export const FEATURES: { icon: FeatureIcon; title: string; text: string }[] = [
  {
    icon: "sun",
    title: "Condiciones en vivo",
    text: "Temperatura, humedad, viento, presión y nubosidad al momento. El fondo del panel cambia con el cielo real.",
  },
  {
    icon: "trend",
    title: "Pronóstico a 24 horas",
    text: "Cinco horizontes con banda de confianza del 90 % y la explicación de qué variables pesan en cada uno.",
  },
  {
    icon: "history",
    title: "Comparación histórica",
    text: "¿Es normal para este mes y esta hora? Percentiles calculados contra el histórico de la ciudad en el mismo mes y franja horaria.",
  },
  {
    icon: "layers",
    title: "Regímenes del tiempo",
    text: "Un algoritmo de clustering agrupa la historia de cada ciudad en regímenes atmosféricos (dos o tres, según sus datos) y te dice en cuál estás.",
  },
  {
    icon: "alert",
    title: "Detección de anomalías",
    text: "Isolation Forest marca lo que se aparta de lo esperable, como la tormenta Aline de octubre de 2023.",
  },
  {
    icon: "spark",
    title: "Lectura con IA",
    text: "Claude explica el estado del tiempo en lenguaje natural. Sin clave de API, el resto del panel sigue igual.",
  },
];

export const STEPS = [
  {
    title: "Recogemos",
    text: "Cada 30 minutos consultamos Open-Meteo para cada ciudad y guardamos la observación, rellenando los huecos si los hubiera.",
  },
  {
    title: "Comparamos",
    text: "Cada lectura se mide contra el histórico del mismo mes y la misma hora: percentil, régimen climático y puntuación de anomalía.",
  },
  {
    title: "Predecimos",
    text: "Un modelo de gradient boosting estima la temperatura a 1, 3, 6, 12 y 24 horas, siempre con su margen de incertidumbre.",
  },
  {
    title: "Explicamos",
    text: "Claude convierte el resumen estructurado en una lectura clara, con reglas estrictas para no inventar ningún dato.",
  },
] as const;

export const BENEFITS = [
  {
    title: "Honestidad estadística",
    text: "Cada predicción se compara con una línea base de persistencia y lleva su margen de error. Sin falsa precisión.",
  },
  {
    title: "Siempre al día",
    text: "Ingesta cada 30 minutos y reentrenamiento automático: el modelo nuevo solo sustituye al actual si mejora su error un 2 % o más.",
  },
  {
    title: "Acceso protegido",
    text: "Cuenta propia con contraseña cifrada y API cerrada a quien no ha iniciado sesión.",
  },
] as const;

export const MARQUEE = [
  "Predicción a 24 h",
  "Anomalías",
  "Regímenes atmosféricos",
  "Comparación histórica",
  "Lectura con IA",
  "Tiempo real",
] as const;

export const STATEMENT =
  "Datos honestos, decisiones claras. Cada predicción lleva su margen de error, cada anomalía su explicación, y el modelo solo cambia cuando de verdad mejora.";
