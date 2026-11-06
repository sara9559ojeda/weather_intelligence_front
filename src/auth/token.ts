// Token de sesión (JWT) en localStorage. Puede lanzar (Safari en modo privado,
// cookies bloqueadas): sin almacenamiento la sesión vive solo en memoria y se
// pierde al recargar, pero la app sigue funcionando.

const KEY = "wi-token";

let memoryToken: string | null = null;

export function getToken(): string | null {
  if (memoryToken) return memoryToken;
  try {
    memoryToken = localStorage.getItem(KEY);
  } catch {
    /* almacenamiento no disponible */
  }
  return memoryToken;
}

export function setToken(token: string): void {
  memoryToken = token;
  try {
    localStorage.setItem(KEY, token);
  } catch {
    /* almacenamiento no disponible */
  }
}

export function clearToken(): void {
  memoryToken = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* almacenamiento no disponible */
  }
}
