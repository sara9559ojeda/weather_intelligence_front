// Cliente HTTP hacia el backend. Sin VITE_API_URL la base es relativa ("/api"):
// en desarrollo la redirige Vite y en Docker, Nginx. Con VITE_API_URL (p. ej. en
// Vercel) se llama directamente a la API pública del backend.

export const API_BASE = `${import.meta.env.VITE_API_URL ?? ""}/api`;
const BASE = API_BASE;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiGet<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
  const url = new URL(BASE + path, window.location.origin);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      detail = (await res.json())?.detail ?? detail;
    } catch {
      /* respuesta sin cuerpo JSON */
    }
    throw new ApiError(res.status, detail);
  }
  return res.json() as Promise<T>;
}
