import { useLocation } from "../location/LocationContext";

function PinIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

/** Selector de ciudad de la cabecera. Con una sola ciudad es una etiqueta. */
export function CitySelect() {
  const { locations, current, select } = useLocation();
  if (!current) return null;

  if (locations.length < 2) {
    return (
      <span className="glass-soft inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-[var(--color-text-dim)]">
        <PinIcon />
        {current.name}
      </span>
    );
  }

  return (
    <label className="glass-soft relative inline-flex items-center gap-1.5 rounded-full py-1.5 pl-3 pr-2 text-xs font-medium text-[var(--color-text)] focus-within:outline focus-within:outline-2 focus-within:outline-[var(--color-accent)]">
      <span className="sr-only">Ciudad</span>
      <PinIcon />
      <select
        id="city-select"
        value={current.slug}
        onChange={(e) => select(e.target.value)}
        className="max-w-[9.5rem] cursor-pointer appearance-none truncate bg-transparent pr-5 text-xs font-medium text-[var(--color-text)] outline-none"
      >
        {locations.map((l) => (
          <option key={l.slug} value={l.slug}>
            {l.name}
          </option>
        ))}
      </select>
      <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute right-2 h-3 w-3 text-[var(--color-text-dim)]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </label>
  );
}
