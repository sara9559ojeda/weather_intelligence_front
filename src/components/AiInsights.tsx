import { useMemo } from "react";
import type { Insight } from "../api/types";
import { Badge, Card, EmptyState, Skeleton } from "./ui";

/** Divide el texto de Claude en sus 7 secciones (encabezados **en negrita**). */
function parseSections(text: string): { heading: string; body: string }[] {
  const parts = text.split(/\*\*(.+?)\*\*/g).slice(1);
  const out: { heading: string; body: string }[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    out.push({ heading: parts[i].trim(), body: (parts[i + 1] ?? "").trim() });
  }
  return out.length ? out : [{ heading: "Interpretación", body: text }];
}

export function AiInsights({
  insight,
  isLoading,
  onRefresh,
}: {
  insight?: Insight;
  isLoading: boolean;
  onRefresh: () => void;
}) {
  const sections = useMemo(
    () => (insight?.interpretation ? parseSections(insight.interpretation) : []),
    [insight],
  );

  const statusBadge = () => {
    if (!insight) return null;
    if (insight.status === "no_api_key")
      return <Badge tone="warn">sin clave de API</Badge>;
    if (insight.status === "unavailable")
      return <Badge tone="danger">API no disponible</Badge>;
    if (insight.status === "cached" || insight.cached)
      return <Badge tone="neutral">en caché</Badge>;
    return <Badge tone="accent">generado</Badge>;
  };

  return (
    <Card
      title="Interpretación con IA (Claude)"
      subtitle={
        insight?.model
          ? `${insight.model}${insight.tokens ? ` · ${insight.tokens.input + insight.tokens.output} tokens` : ""}`
          : "capa de interpretación en lenguaje natural"
      }
      right={
        <div className="flex items-center gap-2">
          {statusBadge()}
          <button
            onClick={onRefresh}
            className="rounded-md border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-text-dim)] hover:border-[var(--color-accent)] hover:text-[var(--color-text)]"
          >
            Actualizar
          </button>
        </div>
      }
    >
      {isLoading ? (
        <Skeleton className="h-40" />
      ) : insight?.interpretation ? (
        <>
          {insight.stale && (
            <p className="mb-3 text-[11px] text-[var(--color-warn)]">
              La API no respondió; se muestra la última interpretación disponible.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {sections.map((s) => (
              <div key={s.heading}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">
                  {s.heading}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-dim)]">{s.body}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="Interpretación no disponible"
          hint={
            insight?.note ??
            "Configura ANTHROPIC_API_KEY en el backend para activar la interpretación con Claude. El resto del sistema funciona sin ella."
          }
        />
      )}
    </Card>
  );
}
