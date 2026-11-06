// Textos de la landing. Todas las cifras salen de las ejecuciones reales del
// proyecto (docs/fase-4-anomalias.md, fase-5-modelado.md, fase-9-retraining.md).

export const STATS = [
  { value: 26, decimals: 0, unit: "años", label: "de observaciones horarias de Madrid-Barajas (2000–2026)" },
  { value: 233880, decimals: 0, unit: "", label: "observaciones analizadas para entrenar y comparar" },
  { value: 0.73, decimals: 2, unit: "°C", label: "de error medio al predecir la próxima hora" },
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
    text: "¿Es normal para este mes y esta hora? Percentiles calculados contra 26 años de datos del mismo momento.",
  },
  {
    icon: "layers",
    title: "Regímenes del tiempo",
    text: "Un algoritmo de clustering agrupa la historia en tres regímenes atmosféricos y te dice en cuál estás.",
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
    text: "Cada 30 minutos consultamos Open-Meteo para Madrid-Barajas y guardamos la observación, rellenando los huecos si los hubiera.",
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
