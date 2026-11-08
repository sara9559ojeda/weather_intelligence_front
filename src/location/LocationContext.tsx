import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet, setActiveLocation } from "../api/client";
import type { LocationInfo } from "../api/types";
import { SessionGate } from "../components/SessionGate";
import { readStoredLocation, storeLocation } from "./storage";

interface LocationContextValue {
  locations: LocationInfo[];
  /** Ciudad activa; null solo si el servidor no ofreció catálogo (usa su ciudad por defecto). */
  current: LocationInfo | null;
  select: (slug: string) => void;
}

const LocationContext = createContext<LocationContextValue | null>(null);

/**
 * Catálogo de ciudades y ciudad activa. La elección se recuerda entre visitas;
 * si la guardada ya no existe se usa la predeterminada del servidor.
 * Bloquea la app hasta tener el catálogo para no pedir datos de una ciudad y
 * volver a pedirlos de otra un instante después.
 */
export function LocationProvider({ children }: { children: ReactNode }) {
  const query = useQuery({
    queryKey: ["locations"],
    queryFn: () => apiGet<LocationInfo[]>("/locations"),
    staleTime: 10 * 60_000,
  });
  const [chosen, setChosen] = useState<string | null>(() => readStoredLocation()?.slug ?? null);

  const locations = useMemo(() => query.data ?? [], [query.data]);
  const current = useMemo(
    () => locations.find((l) => l.slug === chosen) ?? locations.find((l) => l.is_default) ?? locations[0] ?? null,
    [locations, chosen],
  );

  // Se fija durante el render (y no en un efecto) para que las peticiones de los
  // hijos, que se lanzan en su primer render, ya salgan con la ciudad correcta.
  setActiveLocation(current?.slug ?? null);

  const select = useCallback(
    (slug: string) => {
      const next = locations.find((l) => l.slug === slug);
      if (!next) return;
      storeLocation({ slug: next.slug, latitude: next.latitude, longitude: next.longitude });
      setChosen(next.slug);
    },
    [locations],
  );

  const value = useMemo(() => ({ locations, current, select }), [locations, current, select]);

  if (query.isPending) return <SessionGate state="checking" />;
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation debe usarse dentro de <LocationProvider>");
  return ctx;
}
