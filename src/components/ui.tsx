import type { ReactNode } from "react";
import { motion } from "motion/react";

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
      className={`glass-soft inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
