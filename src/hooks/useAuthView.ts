import { useCallback, useEffect, useState } from "react";

/**
 * Pantalla que ve quien aún no ha iniciado sesión. Se refleja en el hash de la URL
 * (sin router): "" → landing, "#/login" → inicio de sesión, "#/registro" → registro.
 * Así el botón "atrás" del navegador funciona y los enlaces son compartibles.
 */
export type AuthView = "landing" | "login" | "register";

const HASH: Record<AuthView, string> = { landing: "", login: "#/login", register: "#/registro" };

function parse(hash: string): AuthView {
  if (hash === HASH.login) return "login";
  if (hash === HASH.register) return "register";
  return "landing";
}

export function useAuthView(): { view: AuthView; go: (view: AuthView) => void; clear: () => void } {
  const [view, setView] = useState<AuthView>(() => parse(window.location.hash));

  useEffect(() => {
    const sync = () => setView(parse(window.location.hash));
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  const go = useCallback((next: AuthView) => {
    const url = window.location.pathname + window.location.search + HASH[next];
    window.history.pushState(null, "", url);
    setView(next);
    window.scrollTo(0, 0);
  }, []);

  /** Quita el hash (p. ej. al iniciar sesión) sin añadir una entrada al historial. */
  const clear = useCallback(() => {
    if (!window.location.hash) return;
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }, []);

  return { view, go, clear };
}
