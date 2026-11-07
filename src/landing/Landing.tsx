import { useRef, useState, type FormEvent } from "react";
import { useWeatherTheme } from "../hooks/useWeatherTheme";
import { specular } from "../lib/specular";
import { BENEFITS, FEATURES, MARQUEE, STATEMENT, STATS, STEPS } from "./content";
import { GlassDiscs } from "./GlassDiscs";
import { Backdrop } from "./Backdrop";
import { Asterisk, Icon } from "./icons";
import { useLandingAnimations } from "./useLandingAnimations";
import "./landing.css";

interface LandingProps {
  onLogin: () => void;
  /** `email` es el que el visitante haya escrito en la portada, para precargarlo. */
  onRegister: (email?: string) => void;
}

const NAV_LINKS = [
  { id: "funciones", label: "Funciones" },
  { id: "como-funciona", label: "Cómo funciona" },
  { id: "beneficios", label: "Beneficios" },
] as const;

function scrollToSection(id: string) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

/** Formulario de correo + botón, como el de la referencia: lleva al registro con el email ya escrito. */
function EmailSignup({ onRegister, id }: { onRegister: (email?: string) => void; id: string }) {
  const [email, setEmail] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onRegister(email.trim() || undefined);
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <label htmlFor={id} className="sr-only">
        Tu correo electrónico
      </label>
      <input
        id={id}
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Tu correo electrónico"
        className="glass-soft min-w-0 flex-1 rounded-full px-5 py-3.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] outline-none transition-colors focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
      />
      <button type="submit" className="lp-btn-solid rounded-full px-7 py-3.5 text-sm font-semibold">
        Registrarse
      </button>
    </form>
  );
}

export function Landing({ onLogin, onRegister }: LandingProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  useWeatherTheme();
  useLandingAnimations(rootRef);

  return (
    <div ref={rootRef} className="lp-root relative min-h-dvh overflow-x-clip">
      <Backdrop />

      {/* ------------------------------ Barra superior ------------------------------ */}
      <header className="sticky top-0 z-40 px-4 pt-4 sm:px-8">
        <nav
          data-nav
          aria-label="Principal"
          className="lp-nav glass mx-auto flex max-w-[1280px] items-center justify-between gap-3 rounded-full py-2.5 pl-5 pr-2.5"
        >
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2.5 text-[var(--color-text)]"
          >
            <Asterisk className="h-6 w-6 text-[var(--color-accent-2)]" />
            <span className="text-sm font-semibold tracking-tight">Weather Intelligence</span>
          </a>

          <ul className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((l) => (
              <li key={l.id}>
                <button
                  onClick={() => scrollToSection(l.id)}
                  className="rounded-full px-4 py-2 text-sm text-[var(--color-text-dim)] transition-colors hover:text-[var(--color-text)]"
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <button onClick={onLogin} className="lp-btn-ghost rounded-full px-4 py-2 text-sm font-medium">
              Iniciar sesión
            </button>
            <button
              onClick={() => onRegister()}
              className="lp-btn-solid hidden rounded-full px-4 py-2 text-sm font-semibold sm:block"
            >
              Registrarse
            </button>
          </div>
        </nav>
      </header>

      <main>
        {/* ---------------------------------- Hero ---------------------------------- */}
        <section
          data-hero
          className="relative mx-auto max-w-[1280px] px-4 pb-16 pt-10 sm:px-8 lg:min-h-[44rem] lg:pt-16"
        >
          <div
            data-hero-panel
            className="glass relative z-10 rounded-[28px] p-7 sm:p-12 lg:w-[56%] lg:py-16"
            {...specular}
          >
            <p
              data-hero-fade
              className="mono mb-5 text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-dim)]"
            >
              Madrid-Barajas · datos, ML e IA
            </p>
            <h1
              data-hero-title
              className="text-[clamp(2.2rem,4.5vw,3.5rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-[var(--color-text)]"
            >
              Entiende el tiempo
              <br />
              antes de que llegue.
            </h1>
            <p
              data-hero-fade
              className="mt-6 max-w-[34rem] text-[15px] leading-relaxed text-[var(--color-text-dim)] sm:text-base"
            >
              Weather Intelligence combina 26 años de datos, Machine Learning e inteligencia artificial para
              decirte qué temperatura habrá en las próximas 24 horas, qué tiene de raro lo de hoy y por qué.
            </p>
            <div data-hero-fade className="mt-9 max-w-[34rem]">
              <EmailSignup onRegister={onRegister} id="hero-email" />
              <p className="mt-3 pl-2 text-xs text-[var(--color-text-faint)]">
                Gratis · sin verificación por correo ·{" "}
                <button onClick={onLogin} className="underline underline-offset-2 hover:text-[var(--color-text)]">
                  ya tengo cuenta
                </button>
              </p>
            </div>
          </div>

          <div
            data-stage
            className="relative mx-auto mt-10 w-full max-w-[34rem] lg:absolute lg:right-[1%] lg:top-1/2 lg:mt-0 lg:w-[60%] lg:max-w-none lg:-translate-y-[46%]"
          >
            <GlassDiscs className="h-auto w-full overflow-visible" />
          </div>
        </section>

        {/* ----------------------------- Cinta de texto ----------------------------- */}
        <div className="lp-marquee overflow-hidden py-6" aria-hidden>
          <div data-marquee-track className="flex w-max items-center gap-10 whitespace-nowrap">
            {[...MARQUEE, ...MARQUEE, ...MARQUEE, ...MARQUEE].map((word, i) => (
              <span key={i} className="flex items-center gap-10">
                <span
                  className={`text-[clamp(1.8rem,4vw,3.2rem)] font-semibold tracking-tight ${
                    i % 2 ? "lp-outline" : "text-[var(--color-text)]"
                  }`}
                >
                  {word}
                </span>
                <Asterisk className="h-6 w-6 text-[var(--color-accent-2)]" />
              </span>
            ))}
          </div>
        </div>

        {/* --------------------------- Qué es + cifras ------------------------------ */}
        <section aria-labelledby="que-es" className="mx-auto max-w-[1280px] px-4 py-20 sm:px-8 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <h2
              id="que-es"
              data-reveal
              className="text-[clamp(1.9rem,4.2vw,3.2rem)] font-semibold leading-[1.1] tracking-[-0.03em]"
            >
              Un panel que explica el tiempo, <span className="text-[var(--color-accent-2)]">no solo lo muestra</span>.
            </h2>
            <p data-reveal className="max-w-xl text-base leading-relaxed text-[var(--color-text-dim)]">
              Weather Intelligence es un panel meteorológico para Madrid-Barajas. Recoge datos reales cada 30
              minutos, los compara con décadas de historia, predice la temperatura de las próximas horas y
              redacta una lectura comprensible. Sirve para saber qué esperar, si lo de hoy es normal y qué
              confianza merece cada cifra.
            </p>
          </div>

          <dl className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="glass rounded-[var(--radius-card)] p-6" {...specular}>
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <p className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-none tracking-tight text-[var(--color-text)]">
                    <span data-count data-value={s.value} data-decimals={s.decimals} className="mono">
                      {s.value.toLocaleString("es-ES", {
                        minimumFractionDigits: s.decimals,
                        maximumFractionDigits: s.decimals,
                      })}
                    </span>
                    {s.unit && <span className="ml-1.5 text-lg text-[var(--color-text-dim)]">{s.unit}</span>}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-dim)]" aria-hidden>
                    {s.label}
                  </p>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ----------------------------- Funcionalidades ---------------------------- */}
        <section
          id="funciones"
          aria-labelledby="funciones-titulo"
          className="mx-auto max-w-[1280px] scroll-mt-24 px-4 py-16 sm:px-8 lg:py-24"
        >
          <p data-reveal className="mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-dim)]">
            Funciones
          </p>
          <h2
            id="funciones-titulo"
            data-reveal
            className="mt-3 max-w-3xl text-[clamp(1.9rem,4.2vw,3.2rem)] font-semibold leading-[1.1] tracking-[-0.03em]"
          >
            Todo lo que necesitas para leer la atmósfera.
          </h2>
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li
                key={f.title}
                data-feature
                className="lp-feature glass rounded-[var(--radius-card)] p-7"
                {...specular}
              >
                <span className="glass-soft inline-flex h-11 w-11 items-center justify-center rounded-2xl text-[var(--color-accent-2)]">
                  <Icon name={f.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-dim)]">{f.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ------------------------------ Cómo funciona ----------------------------- */}
        <section
          id="como-funciona"
          aria-labelledby="como-titulo"
          className="mx-auto max-w-[1280px] scroll-mt-24 px-4 py-16 sm:px-8 lg:py-24"
        >
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <p data-reveal className="mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-dim)]">
                Cómo funciona
              </p>
              <h2
                id="como-titulo"
                data-reveal
                className="mt-3 text-[clamp(1.9rem,4.2vw,3.2rem)] font-semibold leading-[1.1] tracking-[-0.03em]"
              >
                De un dato en bruto a una explicación.
              </h2>
              <div className="mt-10 hidden overflow-hidden lg:block" aria-hidden>
                <p
                  data-step-num
                  className="mono text-[7rem] font-semibold leading-none tracking-tighter text-[var(--color-accent-2)]"
                >
                  01
                </p>
                <p data-step-title className="mt-2 text-2xl font-semibold tracking-tight">
                  {STEPS[0].title}
                </p>
              </div>
            </div>

            <div data-steps className="relative">
              <div className="absolute bottom-0 left-0 top-0 w-px bg-[color-mix(in_srgb,var(--color-text)_14%,transparent)]" aria-hidden>
                <div data-progress className="h-full w-px origin-top scale-y-0 bg-[var(--color-accent-2)]" />
              </div>
              <ol className="space-y-6 pl-8 lg:space-y-0">
                {STEPS.map((s, i) => (
                  <li
                    key={s.title}
                    data-step
                    data-title={s.title}
                    data-active={i === 0 ? "true" : "false"}
                    className="lp-step lg:flex lg:min-h-[52vh] lg:items-center"
                  >
                    <div className="glass w-full rounded-[var(--radius-card)] p-7 sm:p-9" {...specular}>
                      <p className="mono text-xs text-[var(--color-accent-2)]">Paso {i + 1} de {STEPS.length}</p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-tight">{s.title}</h3>
                      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[var(--color-text-dim)]">{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* -------------------------------- Beneficios ------------------------------ */}
        <section
          id="beneficios"
          aria-labelledby="beneficios-titulo"
          className="mx-auto max-w-[1280px] scroll-mt-24 px-4 py-16 sm:px-8 lg:py-24"
        >
          <h2 id="beneficios-titulo" className="sr-only">
            Beneficios
          </h2>
          <p
            data-statement
            className="max-w-5xl text-[clamp(1.9rem,4.6vw,3.6rem)] font-semibold leading-[1.12] tracking-[-0.03em]"
          >
            {STATEMENT}
          </p>
          <ul className="mt-14 grid gap-5 md:grid-cols-3">
            {BENEFITS.map((b, i) => (
              <li
                key={b.title}
                data-benefit
                className="glass rounded-[var(--radius-card)] p-7"
                style={
                  i === 2
                    ? {
                        backgroundImage:
                          "linear-gradient(155deg, color-mix(in srgb, #2dd4bf 34%, transparent), color-mix(in srgb, #2dd4bf 12%, transparent)), var(--glass-fill)",
                      }
                    : undefined
                }
                {...specular}
              >
                <h3 className="text-lg font-semibold tracking-tight">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-dim)]">{b.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ----------------------------- Llamada final ------------------------------ */}
        <section aria-labelledby="cta-titulo" className="mx-auto max-w-[1280px] px-4 pb-20 pt-10 sm:px-8 lg:pb-28">
          <div
            data-cta
            className="glass relative overflow-hidden rounded-[32px] px-7 py-14 text-center sm:px-14 sm:py-20"
            {...specular}
          >
            <h2
              id="cta-titulo"
              className="mx-auto max-w-2xl text-[clamp(2rem,4.6vw,3.4rem)] font-semibold leading-[1.08] tracking-[-0.03em]"
            >
              Mira el cielo de Madrid con otros ojos.
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-base text-[var(--color-text-dim)]">
              Crea tu cuenta en un minuto y entra al panel completo: pronóstico, anomalías y lectura con IA.
            </p>
            <div className="mx-auto mt-9 max-w-md text-left">
              <EmailSignup onRegister={onRegister} id="cta-email" />
            </div>
            <p className="mt-5 text-xs text-[var(--color-text-faint)]">
              ¿Ya tienes cuenta?{" "}
              <button onClick={onLogin} className="underline underline-offset-2 hover:text-[var(--color-text)]">
                Iniciar sesión
              </button>
            </p>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-[1280px] px-4 pb-10 text-center text-xs text-[var(--color-text-faint)] sm:px-8">
        Proyecto universitario · metodología CRISP-ML(Q) · datos de Open-Meteo y Meteostat (CC BY 4.0). Las
        predicciones no están garantizadas.
      </footer>
    </div>
  );
}
