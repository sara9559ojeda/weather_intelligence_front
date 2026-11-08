import type { ReactNode } from "react";

/** Selector segmentado accesible (grupo de botones con aria-pressed), igual que el de HistoryCharts. */
export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; text: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`rounded-full px-2.5 py-1 text-[11px] transition-colors ${
            value === o.value
              ? "glass-soft text-[var(--color-accent)]"
              : "text-[var(--color-text-faint)] hover:text-[var(--color-text)]"
          }`}
        >
          {o.text}
        </button>
      ))}
    </div>
  );
}

/** Cifra con etiqueta: la unidad de lectura de los paneles. */
export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-[0.06em] text-[var(--color-text-faint)]">{label}</dt>
      <dd className="mono mt-0.5 text-lg font-semibold text-[var(--color-text)]">{value}</dd>
      {hint && <p className="mt-0.5 text-[11px] text-[var(--color-text-faint)]">{hint}</p>}
    </div>
  );
}

/** Texto secundario plegable (método, límites): no estorba pero está a un clic. */
export function Details({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <details className="group mt-4 rounded-2xl border border-[var(--color-border)] px-4 py-3 text-xs text-[var(--color-text-dim)]">
      <summary className="cursor-pointer select-none font-medium text-[var(--color-text-dim)] marker:text-[var(--color-text-faint)]">
        {summary}
      </summary>
      <div className="mt-2 space-y-1.5 leading-relaxed">{children}</div>
    </details>
  );
}

/** Aviso en línea para estados que no son error (recopilando datos, muestra pequeña…). */
export function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      role="status"
      className="rounded-2xl border border-dashed border-[var(--color-border)] p-5 text-sm leading-relaxed"
    >
      <p className="font-medium text-[var(--color-text)]">{title}</p>
      <div className="mt-1 text-[var(--color-text-dim)]">{children}</div>
    </div>
  );
}

/** Lista de cifras en rejilla adaptable (2 columnas en móvil, hasta 4 en escritorio). */
export function StatGrid({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">{children}</dl>;
}

export function PanelSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-2xl bg-[var(--color-surface-2)]" />
      ))}
    </div>
  );
}
