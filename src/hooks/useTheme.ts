import { useCallback, useEffect, useRef, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "wi-theme";

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// localStorage puede lanzar (Safari en modo privado, cookies bloqueadas):
// sin persistencia el tema sigue funcionando durante la sesión.
function readStored(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

function writeStored(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* almacenamiento no disponible */
  }
}

/** Preferencia de tema explícita del usuario, persistida; por defecto sigue al sistema. */
export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(() => readStored() ?? systemTheme());
  // ¿El usuario eligió tema a mano? Se consulta en cada cambio del sistema,
  // no solo al montar: si elige después, el sistema ya no debe pisarlo.
  const explicit = useRef(readStored() !== null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (!explicit.current) setTheme(systemTheme());
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const toggle = useCallback(() => {
    explicit.current = true;
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      writeStored(next);
      return next;
    });
  }, []);

  return { theme, toggle };
}
