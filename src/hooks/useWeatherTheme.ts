import { useLayoutEffect, useState } from "react";
import type { WeatherCategory } from "../lib/weatherCode";
import { isDaylight } from "../lib/sun";

type Theme = "light" | "dark";

/** Cielos oscuros incluso de día: necesitan texto claro para leerse. */
const DARK_SKY_BY_DAY: ReadonlySet<WeatherCategory> = new Set(["rain", "storm"]);

/**
 * El tema no lo elige el usuario: sigue al tiempo. Claro con cielo claro
 * (de día, salvo lluvia o tormenta) y oscuro de noche o con cielo cerrado.
 * Con datos reales se pasan `isDay` y la categoría de la última observación;
 * sin ellos (portada y login, antes de tener sesión) se calcula con la posición
 * del sol sobre la última ciudad elegida y se revisa cada minuto.
 */
export function useWeatherTheme(
  isDay?: boolean | null,
  category?: WeatherCategory | null,
): { theme: Theme; isDay: boolean } {
  const [computed, setComputed] = useState(() => isDaylight());

  useLayoutEffect(() => {
    if (isDay != null) return;
    const id = window.setInterval(() => setComputed(isDaylight()), 60_000);
    return () => window.clearInterval(id);
  }, [isDay]);

  const day = isDay ?? computed;
  const theme: Theme = !day || (category != null && DARK_SKY_BY_DAY.has(category)) ? "dark" : "light";

  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Retira la preferencia manual que guardaban versiones anteriores.
  useLayoutEffect(() => {
    try {
      localStorage.removeItem("wi-theme");
    } catch {
      /* almacenamiento no disponible */
    }
  }, []);

  return { theme, isDay: day };
}
