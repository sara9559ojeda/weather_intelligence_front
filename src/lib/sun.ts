// Madrid-Barajas (backend/ml/config/location.toml).
const LAT = 40.4936;
const LON = -3.5668;

const RAD = Math.PI / 180;

/** Elevación del sol sobre el horizonte, en grados (algoritmo astronómico de baja precisión, ±0,01°). */
export function solarElevation(date: Date, lat = LAT, lon = LON): number {
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

/** ¿Es de día en Madrid-Barajas? (sol por encima de -0,833°: el borde superior del disco con refracción). */
export function isDaylight(date: Date = new Date()): boolean {
  return solarElevation(date) > -0.833;
}
