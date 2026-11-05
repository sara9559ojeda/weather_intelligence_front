import type { ModelRun } from "../api/types";

/**
 * Métrica de test de un ModelRun (`metrics.test.<key>`). `metrics` es un JSON
 * libre que guarda el backend, así que se comprueba el tipo en vez de hacer
 * un cast: devuelve undefined si falta, es null o no es un número finito.
 */
export function testMetric(run: ModelRun, key: string): number | undefined {
  const test = run.metrics?.test;
  if (typeof test !== "object" || test === null) return undefined;
  const value = (test as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
