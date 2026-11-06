import { useAuth } from "../auth/AuthContext";

/**
 * Pantalla intermedia mientras se valida la sesión guardada (o se descarga el
 * dashboard). Si el servidor no responde se ofrece reintentar o salir, sin
 * descartar la sesión por un fallo de red.
 */
export function SessionGate({ state }: { state: "checking" | "unreachable" | "anonymous" | "authenticated" }) {
  const { retry, logout } = useAuth();

  return (
    <div className="flex min-h-dvh items-center justify-center px-4" aria-busy={state === "checking"}>
      {state === "unreachable" ? (
        <div className="glass max-w-sm rounded-[var(--radius-card)] p-6 text-center" role="alert">
          <h1 className="text-base font-semibold text-[var(--color-text)]">Sin conexión con el servidor</h1>
          <p className="mt-2 text-sm text-[var(--color-text-dim)]">
            Tu sesión sigue guardada. Comprueba tu conexión e inténtalo de nuevo.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button
              onClick={retry}
              className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-white transition-[filter] hover:brightness-110"
            >
              Reintentar
            </button>
            <button
              onClick={logout}
              className="glass-soft rounded-full px-4 py-2 text-xs font-medium text-[var(--color-text-dim)] transition-colors hover:text-[var(--color-text)]"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      ) : (
        <p role="status" className="text-sm text-[var(--color-text-faint)]">
          Cargando…
        </p>
      )}
    </div>
  );
}
