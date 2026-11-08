import { useRef, type KeyboardEvent } from "react";

export interface TabDef<T extends string> {
  id: T;
  label: string;
  /** Texto corto para pantallas estrechas (si no, se usa `label`). */
  short?: string;
}

/**
 * Pestañas accesibles (patrón WAI-ARIA tabs): flechas ← → mueven el foco y activan,
 * Inicio/Fin saltan a los extremos. El contenido de cada pestaña vive en un
 * `role="tabpanel"` que enlaza con `tabPanelId(id)`.
 */
export const tabId = (id: string) => `tab-${id}`;
export const tabPanelId = (id: string) => `tabpanel-${id}`;

export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
  label,
}: {
  tabs: readonly TabDef<T>[];
  active: T;
  onChange: (id: T) => void;
  label: string;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = tabs.findIndex((t) => t.id === active);
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const target = tabs[next].id;
    onChange(target);
    refs.current[target]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="glass mx-auto flex w-full max-w-[var(--container)] gap-1 overflow-x-auto rounded-full p-1.5"
    >
      {tabs.map((t) => {
        const selected = t.id === active;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            role="tab"
            id={tabId(t.id)}
            type="button"
            aria-selected={selected}
            aria-controls={tabPanelId(t.id)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={`min-w-fit flex-1 whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-colors sm:text-sm ${
              selected
                ? "glass-soft text-[var(--color-accent)]"
                : "text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
            }`}
          >
            <span className="sm:hidden">{t.short ?? t.label}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
