import { useState, type FormEvent, type ReactNode } from "react";
import { motion } from "motion/react";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../api/client";
import { useTheme } from "../hooks/useTheme";
import { specular } from "../lib/specular";
import { WeatherBackground } from "./WeatherBackground";

type Mode = "login" | "register";

const inputClass =
  "glass-soft w-full rounded-2xl px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] outline-none transition-colors focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-60";

/** Asterisco de ocho puntas (el motivo del titular): gira muy despacio. */
function Asterisk({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={`animate-[spin_48s_linear_infinite] ${className}`}>
      <g stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
        <path d="M16 3v26M3 16h26M6.8 6.8l18.4 18.4M25.2 6.8L6.8 25.2" />
      </g>
    </svg>
  );
}

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

// Cifras reales del proyecto (docs/fase-5-modelado.md y fase-4-anomalias.md).
const HIGHLIGHTS = [
  {
    label: "Predicción",
    figure: "0,73 °C",
    text: "Error medio a 1 h (2,16 °C a 24 h), medido en datos que el modelo nunca vio.",
  },
  {
    label: "Anomalías",
    figure: "4.838",
    text: "Horas atípicas detectadas con Isolation Forest entre 233.880 observaciones desde 2000.",
  },
  {
    label: "Lectura con IA",
    figure: "Claude",
    text: "Explica el estado del tiempo en lenguaje natural, solo con los datos calculados.",
    mint: true,
  },
] as const;

interface LoginPageProps {
  /** Pestaña con la que se abre (la landing la elige según el botón pulsado). */
  initialMode?: Mode;
  /** Email escrito en la portada, para no volver a pedirlo. */
  initialEmail?: string;
  /** Vuelve a la portada; si no se pasa, no se muestra el enlace. */
  onBack?: () => void;
}

export function LoginPage({ initialMode = "login", initialEmail = "", onBack }: LoginPageProps = {}) {
  const { login, register } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cielo despejado que sigue al tema (claro = día, oscuro = noche): el texto
  // siempre se lee sobre un cielo del mismo tono.
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
    <div className="relative flex min-h-dvh flex-col overflow-x-clip">
      <WeatherBackground category="clear" isDay={isDay} />

      <header className="relative z-10 mx-auto flex w-full max-w-[1280px] items-center justify-between px-4 py-5 sm:px-8">
        {onBack ? (
          <button
            onClick={onBack}
            aria-label="Volver al inicio"
            className="flex items-center gap-2.5 text-[var(--color-text)]"
          >
            <Asterisk className="h-6 w-6 text-[var(--color-accent-2)]" />
            <span className="text-sm font-semibold tracking-tight">Weather Intelligence</span>
          </button>
        ) : (
          <div className="flex items-center gap-2.5 text-[var(--color-text)]">
            <Asterisk className="h-6 w-6 text-[var(--color-accent-2)]" />
            <span className="text-sm font-semibold tracking-tight">Weather Intelligence</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="glass-soft hidden items-center gap-2 rounded-full px-3.5 py-1.5 text-xs text-[var(--color-text-dim)] sm:inline-flex">
            <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-ok)]" />
            Madrid-Barajas · 40,49° N
          </span>
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="glass-soft flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-dim)] transition-colors hover:text-[var(--color-text)]"
          >
            {theme === "dark" ? "☀" : "🌙"}
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-[1280px] flex-1 items-center gap-10 px-4 py-6 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14 lg:py-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-xl [text-shadow:0_1px_20px_color-mix(in_srgb,var(--color-bg)_85%,transparent),0_0_3px_color-mix(in_srgb,var(--color-bg)_35%,transparent)]"
        >
          <h1 className="text-[clamp(2.5rem,6.2vw,4.6rem)] font-bold leading-[1.02] tracking-[-0.035em] text-[var(--color-text)]">
            Meteorología <span className="text-[var(--color-accent-2)]">inteligente</span> para Madrid-Barajas.
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-[var(--color-text-dim)]">
            Minería de datos, Machine Learning e IA sobre 26 años de observaciones horarias: qué
            pasará en las próximas 24 horas y qué tiene de raro lo que está pasando ahora.
          </p>
        </motion.div>

        <div className="relative mx-auto w-full max-w-[420px] lg:mx-0 lg:ml-auto">
          {/* Anillo: el motivo geométrico que el cristal refracta al pasar por encima. */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3.25rem] border-[var(--color-accent-2)] opacity-90 lg:block"
          />

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            className="glass relative rounded-[28px] p-6 sm:p-8"
            {...specular}
          >
            <h2 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
              {isRegister ? "Crea tu cuenta" : "Accede a tu panel"}
            </h2>
            <p className="mt-1 mb-5 text-xs text-[var(--color-text-dim)]">
              {isRegister
                ? "Un minuto y estás dentro. Sin verificación por correo."
                : "Usa tu cuenta o crea una en un momento."}
            </p>

            <div
              role="tablist"
              aria-label="Acceso"
              className="glass-soft mb-5 grid grid-cols-2 gap-1 rounded-full p-1"
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
                      ? "bg-[var(--color-accent)] text-white shadow-[0_6px_16px_-6px_var(--color-accent)]"
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
                  autoFocus={!initialEmail}
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
                    autoFocus={!!initialEmail}
                    minLength={isRegister ? 8 : undefined}
                    maxLength={128}
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={busy}
                    className={`${inputClass} pr-20`}
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
                  className="rounded-2xl border border-[color-mix(in_srgb,var(--color-danger)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_14%,transparent)] px-3.5 py-2.5 text-xs text-[var(--color-danger)]"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_10px_24px_-10px_var(--color-accent)] transition-[filter,opacity] hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
              >
                {busy ? (isRegister ? "Creando cuenta…" : "Entrando…") : isRegister ? "Crear cuenta" : "Entrar"}
              </button>
            </form>

            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="mt-5 w-full text-center text-xs text-[var(--color-text-dim)] transition-colors hover:text-[var(--color-text)]"
              >
                ← Volver al inicio
              </button>
            )}
          </motion.div>
        </div>
      </main>

      <section
        aria-label="Qué incluye el panel"
        className="relative z-10 mx-auto grid w-full max-w-[1280px] gap-4 px-4 pb-4 sm:grid-cols-3 sm:px-8"
      >
        {HIGHLIGHTS.map((h, i) => (
          <motion.article
            key={h.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 + i * 0.08, ease: "easeOut" }}
            className="glass rounded-[var(--radius-card)] p-5"
            style={
              "mint" in h
                ? {
                    backgroundImage:
                      "linear-gradient(155deg, color-mix(in srgb, #2dd4bf 34%, transparent), color-mix(in srgb, #2dd4bf 12%, transparent)), var(--glass-fill)",
                  }
                : undefined
            }
            {...specular}
          >
            <h3 className="text-sm font-medium text-[var(--color-accent-2)]">{h.label}</h3>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-text)]">{h.figure}</p>
            <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-dim)]">{h.text}</p>
          </motion.article>
        ))}
      </section>

      <p className="relative z-10 px-4 pb-6 pt-2 text-center text-[11px] text-[var(--color-text-faint)]">
        Proyecto universitario · datos de Open-Meteo y Meteostat (CC BY 4.0)
      </p>
    </div>
  );
}
