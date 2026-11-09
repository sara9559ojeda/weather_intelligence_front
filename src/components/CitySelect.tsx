import { useEffect, useId, useRef, useState } from "react";
import { useLocation } from "../location/LocationContext";

function PinIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={`h-3 w-3 shrink-0 text-[var(--color-text-dim)] transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}

/**
 * Selector de ciudad de la cabecera. Con una sola ciudad es una etiqueta.
 *
 * Es un listbox propio (no un <select> nativo) para que la lista desplegable
 * respete el tema claro/oscuro y el estilo de la cabecera: la lista nativa la
 * dibuja el sistema operativo y no se puede estilar.
 */
export function CitySelect() {
  const { locations, current, select } = useLocation();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ text: "", timer: 0 });
  const listId = useId();

  // Cierra al hacer clic fuera.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Mantiene visible la opción activa al navegar con teclado.
  useEffect(() => {
    if (!open) return;
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  if (!current) return null;

  if (locations.length < 2) {
    return (
      <span className="glass-soft inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-[var(--color-text-dim)]">
        <PinIcon />
        {current.name}
      </span>
    );
  }

  const currentIndex = Math.max(
    0,
    locations.findIndex((l) => l.slug === current.slug),
  );

  const openList = () => {
    setActive(currentIndex);
    setOpen(true);
  };

  const choose = (index: number) => {
    const loc = locations[index];
    if (loc) select(loc.slug);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const move = (index: number) => setActive(Math.min(locations.length - 1, Math.max(0, index)));

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp": {
        e.preventDefault();
        if (!open) return openList();
        return move(active + (e.key === "ArrowDown" ? 1 : -1));
      }
      case "Home":
      case "End": {
        if (!open) return;
        e.preventDefault();
        return move(e.key === "Home" ? 0 : locations.length - 1);
      }
      case "Enter":
      case " ": {
        // Espacio también abre/selecciona, como un select nativo.
        e.preventDefault();
        return open ? choose(active) : openList();
      }
      case "Escape": {
        if (!open) return;
        e.preventDefault();
        setOpen(false);
        return;
      }
      case "Tab": {
        setOpen(false);
        return;
      }
      default: {
        // Búsqueda por letras: "ba" salta a Barranquilla.
        if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
        const t = typeahead.current;
        window.clearTimeout(t.timer);
        t.text += e.key.toLocaleLowerCase("es");
        t.timer = window.setTimeout(() => (t.text = ""), 600);
        const norm = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es");
        const hit = locations.findIndex((l) => norm(l.name).startsWith(norm(t.text)));
        if (hit >= 0) {
          if (!open) setOpen(true);
          setActive(hit);
        }
      }
    }
  };

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <button
        ref={buttonRef}
        id="city-select"
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-label={`Ciudad: ${current.name}`}
        onClick={() => (open ? setOpen(false) : openList())}
        className="glass-soft inline-flex cursor-pointer items-center gap-1.5 rounded-full py-1.5 pl-3 pr-2.5 text-xs font-medium text-[var(--color-text)] outline-none transition-colors hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
      >
        <PinIcon />
        <span className="max-w-[9.5rem] truncate">{current.name}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Ciudad"
          className="absolute right-0 top-full z-20 mt-2 max-h-72 min-w-full w-max overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 text-xs shadow-[0_18px_40px_-12px_rgb(10_30_70/0.45)]"
        >
          {locations.map((l, i) => {
            const selected = l.slug === current.slug;
            return (
              <li
                key={l.slug}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl px-3 py-2 ${
                  i === active
                    ? "bg-[color-mix(in_srgb,var(--color-accent)_16%,transparent)] text-[var(--color-text)]"
                    : "text-[var(--color-text-dim)]"
                } ${selected ? "font-semibold text-[var(--color-text)]" : ""}`}
              >
                <span className="whitespace-nowrap">{l.name}</span>
                {selected && (
                  <span className="text-[var(--color-accent-dim)]">
                    <CheckIcon />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
