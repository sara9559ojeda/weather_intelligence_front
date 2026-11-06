import { useState, type FormEvent, type ReactNode } from "react";
import { motion } from "motion/react";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../api/client";
import { useTheme } from "../hooks/useTheme";
import { WeatherBackground } from "./WeatherBackground";

type Mode = "login" | "register";

const inputClass =
  "glass-soft w-full rounded-xl px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] outline-none transition-colors focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-60";

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium text-[var(--color-text-dim)]">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-[var(--color-text-faint)]">{hint}</p>}
    </div>
  );
}

/** Mensaje comprensible para el usuario según lo que falló. */
function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return "No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.";
}

export function LoginPage() {
  const { login, register } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fondo sereno: cielo despejado que sigue al tema (claro = día, oscuro = noche),
  // así el texto siempre se lee sobre un cielo del mismo tono.
  const isDay = theme === "light";
  const isRegister = mode === "register";

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setError(null);
    setShowPassword(false);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (isRegister) await register(email.trim(), password, fullName.trim());
      else await login(email.trim(), password);
      // Al autenticarse, Root desmonta esta pantalla: no hay nada más que hacer.
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 py-10">
      <WeatherBackground category="clear" isDay={isDay} />

      <button
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        className="glass-soft fixed right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-dim)] transition-colors hover:text-[var(--color-text)] sm:right-6 sm:top-6"
      >
        {theme === "dark" ? "☀" : "🌙"}
      </button>

      <motion.main
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[400px]"
      >
        <div className="mb-6 text-center [text-shadow:0_1px_14px_color-mix(in_srgb,var(--color-bg)_85%,transparent)]">
          <p className="mono text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-dim)]">
            Madrid-Barajas · 40,49° N
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-text)]">
            Weather Intelligence
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-dim)]">
            Predicción a 1–24 h, anomalías y lectura con IA.
          </p>
        </div>

        <div className="glass rounded-[var(--radius-card)] p-6 sm:p-8">
          <div
            role="tablist"
            aria-label="Acceso"
            className="glass-soft mb-6 grid grid-cols-2 gap-1 rounded-full p-1"
          >
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                role="tab"
                type="button"
                id={`tab-${m}`}
                aria-selected={mode === m}
                aria-controls="auth-panel"
                onClick={() => switchMode(m)}
                className={`rounded-full px-3 py-2 text-xs font-medium transition-colors ${
                  mode === m
                    ? "bg-[var(--color-accent)] text-white shadow-sm"
                    : "text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
                }`}
              >
                {m === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </button>
            ))}
          </div>

          <form
            id="auth-panel"
            role="tabpanel"
            aria-labelledby={`tab-${mode}`}
            onSubmit={onSubmit}
            className="space-y-4"
          >
            {isRegister && (
              <Field id="auth-name" label="Nombre (opcional)">
                <input
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  maxLength={80}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={busy}
                  placeholder="Ana Pérez"
                  className={inputClass}
                />
              </Field>
            )}

            <Field id="auth-email" label="Email">
              <input
                id="auth-email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                placeholder="tu@email.com"
                className={inputClass}
              />
            </Field>

            <Field id="auth-password" label="Contraseña" hint={isRegister ? "Mínimo 8 caracteres." : undefined}>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={isRegister ? 8 : undefined}
                  maxLength={128}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                  className={`${inputClass} pr-16`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute inset-y-0 right-2 my-auto h-7 rounded-full px-3 text-[11px] font-medium text-[var(--color-text-dim)] transition-colors hover:text-[var(--color-text)]"
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </Field>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-[color-mix(in_srgb,var(--color-danger)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_12%,transparent)] px-3 py-2 text-xs text-[var(--color-danger)]"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white transition-[filter,opacity] hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
            >
              {busy ? (isRegister ? "Creando cuenta…" : "Entrando…") : isRegister ? "Crear cuenta" : "Entrar"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-[11px] text-[var(--color-text-faint)]">
          Proyecto universitario · datos de Open-Meteo (CC BY 4.0)
        </p>
      </motion.main>
    </div>
  );
}
