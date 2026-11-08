// Última ciudad elegida. Se guarda también su posición para que la portada y el
// login (sin sesión, sin datos) calculen el día/noche del lugar que el usuario sigue.

const KEY = "wi-location";

export interface StoredLocation {
  slug: string;
  latitude: number;
  longitude: number;
}

export function readStoredLocation(): StoredLocation | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<StoredLocation>;
    if (typeof v.slug === "string" && typeof v.latitude === "number" && typeof v.longitude === "number") {
      return { slug: v.slug, latitude: v.latitude, longitude: v.longitude };
    }
  } catch {
    /* almacenamiento no disponible o contenido corrupto */
  }
  return null;
}

export function storeLocation(value: StoredLocation): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* almacenamiento no disponible */
  }
}
