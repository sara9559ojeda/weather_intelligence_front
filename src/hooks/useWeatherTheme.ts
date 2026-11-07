import { useLayoutEffect, useState } from "react";
import { isDaylight } from "../lib/sun";

type Theme = "light" | "dark";

/**
 * El tema no lo elige el usuario: sigue al tiempo. De día, claro; de noche,
 * oscuro. Con datos reales se pasa `isDay` (el de la última observación); sin
 * ellos (portada y login, antes de tener sesión) se calcula con la posición
 * del sol sobre Madrid-Barajas y se revisa cada minuto.
 */
export function useWeatherTheme(isDay?: boolean | null): { theme: Theme; isDay: boolean } {
  const [computed, setComputed] = useState(() => isDaylight());

  useLayoutEffect(() => {
    if (isDay != null) return;
    const id = window.setInterval(() => setComputed(isDaylight()), 60_000);
    return () => window.clearInterval(id);
  }, [isDay]);

  const day = isDay ?? computed;
  const theme: Theme = day ? "light" : "dark";

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
