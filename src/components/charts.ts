// Paneles que dependen de Recharts. App los importa de forma diferida a través
// de este módulo para que todos acaben en un único chunk y Recharts (~550 kB)
// salga del camino crítico de la primera pintura.
export { AnomaliesPanel } from "./AnomaliesPanel";
export { ClustersPanel } from "./ClustersPanel";
export { HistoryCharts } from "./HistoryCharts";
export { PredictedVsActual } from "./PredictedVsActual";
export { PredictionPanel } from "./PredictionPanel";
export { ScatterTempHumidity } from "./ScatterTempHumidity";
export { EvaluationPanel } from "./intelligence/EvaluationPanel";
export { RegimesPanel } from "./intelligence/RegimesPanel";
export { ReliabilityPanel } from "./intelligence/ReliabilityPanel";
