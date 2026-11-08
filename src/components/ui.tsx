import { Component, type ReactNode } from "react";
import { motion } from "motion/react";
import { specular } from "../lib/specular";

/* Colores para gráficos (leídos de los tokens CSS en index.css). */
export const CHART = {
  axis: "var(--color-text-faint)",
  grid: "var(--color-border)",
  text: "var(--color-text-dim)",
  series: [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
  ],
  accent: "var(--color-accent)",
  ok: "var(--color-ok)",
  warn: "var(--color-warn)",
  danger: "var(--color-danger)",
};

/* Estilo común del tooltip de Recharts: cristal coherente con el resto de la UI. */
export const tooltipStyle = {
  background: "color-mix(in srgb, var(--color-surface) 90%, transparent)",
  backdropFilter: "blur(14px)",
  border: "1px solid var(--glass-border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--color-text)",
  boxShadow: "0 12px 32px -16px rgba(0,0,0,0.35)",
};

/**
 * Panel de cristal — el único contenedor "con caja" que queda en la app,
 * reservado para lo que de verdad necesita agruparse (gráficos, tablas).
 * Casi transparente a propósito: el fondo meteorológico debe seguir viéndose
 * a través. Entra con un fundido muy leve la primera vez que aparece en
 * pantalla; nunca se repite al hacer scroll de vuelta.
 */
export function Card({
  title,
  subtitle,
  right,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`glass rounded-[var(--radius-card)] ${className}`}
      {...specular}
    >
      {(title || right) && (
        <header className="flex items-start justify-between gap-3 px-6 pt-5 pb-3">
          <div>
            {title && (
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-dim)]">
                {title}
              </h2>
            )}
            {subtitle && <p className="mt-1 text-xs text-[var(--color-text-faint)]">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      <div className="px-6 pb-6">{children}</div>
    </motion.section>
  );
}

export function Skeleton({ className = "h-40" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-[var(--color-surface-2)] ${className}`}
      aria-hidden
    />
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-sm">
      <p className="font-medium text-[var(--color-danger)]">No se pudo cargar</p>
      <p className="text-[var(--color-text-dim)]">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)]"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

/**
 * Contiene el fallo de un panel (p. ej. que no llegue su chunk diferido tras
 * un despliegue) para que no desmonte toda la app; muestra el ErrorState de
 * siempre en su lugar, o `fallback` si se indica (null para capas decorativas).
 */
export class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return this.props.fallback !== undefined ? (
      this.props.fallback
    ) : (
      <ErrorState message={this.state.error.message} />
    );
  }
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm">
      <p className="font-medium text-[var(--color-text-dim)]">{title}</p>
      {hint && <p className="mt-1 text-xs text-[var(--color-text-faint)]">{hint}</p>}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "ok" | "warn" | "danger" | "accent";
}) {
  const tones: Record<string, string> = {
    neutral: "border-[var(--color-border)] text-[var(--color-text-dim)]",
    ok: "border-[color-mix(in_srgb,var(--color-ok)_50%,transparent)] text-[var(--color-ok)]",
    warn: "border-[color-mix(in_srgb,var(--color-warn)_50%,transparent)] text-[var(--color-warn)]",
    danger: "border-[color-mix(in_srgb,var(--color-danger)_50%,transparent)] text-[var(--color-danger)]",
    accent: "border-[color-mix(in_srgb,var(--color-accent)_50%,transparent)] text-[var(--color-accent)]",
  };
  return (
    <span
      className={`badge-solid inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
