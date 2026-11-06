import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../api/client";
import { useTheme } from "../hooks/useTheme";
import { Backdrop } from "../landing/Backdrop";
import { GlassDiscs } from "../landing/GlassDiscs";
import { Asterisk } from "../landing/icons";
import { useAuthAnimations } from "../landing/useAuthAnimations";
import { specular } from "../lib/specular";
import "../landing/landing.css";

type Mode = "login" | "register";

const inputClass =
  "glass-soft w-full rounded-full px-5 py-3.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] outline-none transition-colors focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-60";

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
      <label htmlFor={id} className="block pl-3 text-xs font-medium text-[var(--color-text-dim)]">
        {label}
      </label>
      {children}
      {hint && <p className="pl-3 text-[11px] text-[var(--color-text-faint)]">{hint}</p>}
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
  { label: "Predicción", figure: "0,73 °C", text: "Error medio a 1 h, medido en datos que el modelo nunca vio." },
  { label: "Anomalías", figure: "4.838", text: "Horas atípicas entre 233.880 observaciones desde 2000." },
  { label: "Lectura con IA", figure: "Claude", text: "Explica el tiempo en lenguaje natural, solo con datos calculados." },
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
  const rootRef = useRef<HTMLDivElement>(null);
  useAuthAnimations(rootRef);

  const [mode, setMode] = useState<Mode>(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const brand = (
    <>
      <Asterisk className="h-6 w-6 text-[var(--color-accent-2)]" />
      <span className="whitespace-nowrap text-sm font-semibold tracking-tight">Weather Intelligence</span>
    </>
  );

  return (
    <div ref={rootRef} className="lp-root relative flex min-h-dvh flex-col overflow-x-clip">
      <Backdrop />

      {/* ------------------------------ Barra superior ------------------------------ */}
      <header className="relative z-40 px-4 pt-4 sm:px-8">
        <nav
          data-nav
          aria-label="Principal"
          className="lp-nav glass mx-auto flex max-w-[1280px] items-center justify-between gap-3 rounded-full py-2.5 pl-5 pr-2.5"
        >
          {onBack ? (
            <button
              onClick={onBack}
              aria-label="Volver al inicio"
              className="flex items-center gap-2.5 text-[var(--color-text)]"
            >
              {brand}
            </button>
          ) : (
            <div className="flex items-center gap-2.5 text-[var(--color-text)]">{brand}</div>
          )}

          <div className="flex items-center gap-2">
            <span className="glass-soft mr-1 hidden items-center gap-2 rounded-full px-3.5 py-2 text-xs text-[var(--color-text-dim)] md:inline-flex">
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
            {onBack && (
              <button onClick={onBack} className="lp-btn-ghost whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium">
                <span className="sm:hidden">Inicio</span>
                <span className="hidden sm:inline">Volver al inicio</span>
              </button>
            )}
          </div>
        </nav>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-[1280px] flex-1 items-center gap-10 px-4 py-10 sm:px-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-6 lg:py-14">
        {/* ----------------------------- Panel de acceso ----------------------------- */}
        <div data-auth-panel className="glass relative z-10 mx-auto w-full max-w-[34rem] rounded-[28px] p-7 sm:p-10 lg:mx-0" {...specular}>
          <p
            data-auth-in
            className="mono mb-4 text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-dim)]"
          >
            {isRegister ? "Nueva cuenta · gratis" : "Acceso · panel meteorológico"}
          </p>
          <h1
            data-auth-in
            className="text-[clamp(2rem,4vw,2.9rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-[var(--color-text)]"
          >
            {isRegister ? (
              <>
                Crea tu cuenta y
                <br />
                entiende el tiempo.
              </>
            ) : (
              <>
                Vuelve a tu panel,
                <br />
                el tiempo te espera.
              </>
            )}
          </h1>
          <p data-auth-in className="mt-4 text-[15px] leading-relaxed text-[var(--color-text-dim)]">
            {isRegister
              ? "Un minuto y estás dentro. Sin verificación por correo."
              : "Usa tu cuenta o crea una en un momento."}
          </p>

          <div
            data-auth-in
            role="tablist"
            aria-label="Acceso"
            className="glass-soft mb-6 mt-7 grid grid-cols-2 gap-1 rounded-full p-1"
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
                className={`rounded-full px-3 py-2.5 text-sm font-medium transition-colors ${
                  mode === m
                    ? "lp-btn-solid shadow-[0_8px_20px_-10px_var(--color-text)]"
                    : "text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
                }`}
              >
                {m === "login" ? "Iniciar sesión" : "Registrarse"}
              </button>
            ))}
          </div>

          <form
            data-auth-in
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

            <Field id="auth-email" label="Correo electrónico">
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
                  className={`${inputClass} pr-24`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute inset-y-0 right-3 my-auto h-8 rounded-full px-3 text-[11px] font-medium text-[var(--color-text-dim)] transition-colors hover:text-[var(--color-text)]"
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </Field>

            {error && (
              <p
                role="alert"
                className="rounded-2xl border border-[color-mix(in_srgb,var(--color-danger)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_14%,transparent)] px-4 py-2.5 text-xs text-[var(--color-danger)]"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="lp-btn-solid w-full rounded-full px-7 py-3.5 text-sm font-semibold disabled:cursor-wait disabled:opacity-70"
            >
              {busy ? (isRegister ? "Creando cuenta…" : "Entrando…") : isRegister ? "Crear cuenta" : "Entrar"}
            </button>
          </form>

          <p data-auth-in className="mt-5 text-center text-xs text-[var(--color-text-faint)]">
            {isRegister ? "¿Ya tienes cuenta? " : "¿Aún no tienes cuenta? "}
            <button
              type="button"
              onClick={() => switchMode(isRegister ? "login" : "register")}
              className="underline underline-offset-2 transition-colors hover:text-[var(--color-text)]"
            >
              {isRegister ? "Inicia sesión" : "Regístrate"}
            </button>
          </p>
        </div>

        {/* ------------------------ Discos de cristal + cifras ------------------------ */}
        <div className="relative">
          <div data-stage className="relative mx-auto hidden w-full max-w-[40rem] lg:block">
            <GlassDiscs className="h-auto w-full overflow-visible" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:-mt-6">
            {HIGHLIGHTS.map((h) => (
              <article
                key={h.label}
                data-auth-card
                className="glass relative rounded-[var(--radius-card)] p-5"
                {...specular}
              >
                <h2 className="mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-accent-2)]">
                  {h.label}
                </h2>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{h.figure}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-dim)]">{h.text}</p>
              </article>
            ))}
          </div>
        </div>
      </main>

      <p className="relative z-10 px-4 pb-6 pt-2 text-center text-[11px] text-[var(--color-text-faint)]">
        Proyecto universitario · datos de Open-Meteo y Meteostat (CC BY 4.0)
      </p>
    </div>
  );
}
