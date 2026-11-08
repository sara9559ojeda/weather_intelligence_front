// Cliente HTTP hacia el backend. Sin VITE_API_URL la base es relativa ("/api"):
// en desarrollo la redirige Vite y en Docker, Nginx. Con VITE_API_URL (p. ej. en
// Vercel) se llama directamente a la API pública del backend.
//
// Toda petición lleva la sesión (`Authorization: Bearer`). Si el servidor
// responde 401 a una petición con sesión, se avisa al manejador registrado
// (AuthProvider) para volver a la pantalla de login.

import { getToken } from "../auth/token";

export const API_BASE = `${import.meta.env.VITE_API_URL ?? ""}/api`;
const BASE = API_BASE;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let onUnauthorized: (() => void) | null = null;

// Ciudad activa: toda petición de datos (GET, y el POST del analista) la lleva como `?location=<slug>`.
// Sin ciudad elegida, el servidor usa la predeterminada. Las rutas que no son
// "por ciudad" (login, catálogo de ciudades) no la reciben.
let activeLocation: string | null = null;
const LOCATION_FREE_PATHS = ["/auth", "/locations"];

export function setActiveLocation(slug: string | null): void {
  activeLocation = slug;
}

/** Registra qué hacer cuando la sesión deja de ser válida (caducada, usuario desactivado…). */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

async function request<T>(
  method: "GET" | "POST",
  path: string,
  options: { params?: Record<string, string | number | boolean>; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const { params, body, auth = true } = options;
  const url = new URL(BASE + path, window.location.origin);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  }
  if (activeLocation && !LOCATION_FREE_PATHS.some((p) => path.startsWith(p))) {
    url.searchParams.set("location", activeLocation);
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      // 422 de validación: `detail` es una lista de {msg, loc}
      detail = Array.isArray(data?.detail)
        ? data.detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(". ")
        : (data?.detail ?? detail);
    } catch {
      /* respuesta sin cuerpo JSON */
    }
    if (res.status === 401 && token) onUnauthorized?.();
    throw new ApiError(res.status, detail);
  }
  return res.json() as Promise<T>;
}

export function apiGet<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
  return request<T>("GET", path, { params });
}

/** POST JSON. `auth: false` para login/registro (un 401 ahí es "credenciales incorrectas", no sesión caducada). */
export function apiPost<T>(path: string, body?: unknown, options: { auth?: boolean } = {}): Promise<T> {
  return request<T>("POST", path, { body, auth: options.auth });
}
