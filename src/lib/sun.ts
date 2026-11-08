import { readStoredLocation } from "../location/storage";

const RAD = Math.PI / 180;

export interface Coords {
  latitude: number;
  longitude: number;
}

/**
 * Lugar de referencia cuando aún no hay datos de ninguna ciudad (portada y login):
 * la última ciudad elegida en la app o, si no hay, una estimación a partir de la
 * zona horaria del dispositivo (15° de longitud por hora de diferencia con UTC).
 */
export function referenceCoords(): Coords {
  const stored = readStoredLocation();
  if (stored) return { latitude: stored.latitude, longitude: stored.longitude };
  return { latitude: 20, longitude: (-new Date().getTimezoneOffset() / 60) * 15 };
}

/** Elevación del sol sobre el horizonte, en grados (algoritmo astronómico de baja precisión, ±0,01°). */
export function solarElevation(date: Date, lat: number, lon: number): number {
  const n = date.getTime() / 86_400_000 + 2_440_587.5 - 2_451_545.0; // días desde J2000
  const meanLon = (280.46 + 0.9856474 * n) % 360;
  const anomaly = (357.528 + 0.9856003 * n) * RAD;
  const eclLon = (meanLon + 1.915 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly)) * RAD;
  const obliquity = (23.439 - 0.0000004 * n) * RAD;

  const declination = Math.asin(Math.sin(obliquity) * Math.sin(eclLon));
  const rightAscension = Math.atan2(Math.cos(obliquity) * Math.sin(eclLon), Math.cos(eclLon));

  const gmstDeg = ((18.697374558 + 24.06570982441908 * n) * 15) % 360;
  const hourAngle = (gmstDeg + lon) * RAD - rightAscension;

  const sinElevation =
    Math.sin(lat * RAD) * Math.sin(declination) +
    Math.cos(lat * RAD) * Math.cos(declination) * Math.cos(hourAngle);
  return Math.asin(sinElevation) / RAD;
}

/** ¿Es de día en ese lugar? (sol por encima de -0,833°: el borde superior del disco con refracción). */
export function isDaylight(date: Date = new Date(), where: Coords = referenceCoords()): boolean {
  return solarElevation(date, where.latitude, where.longitude) > -0.833;
}
