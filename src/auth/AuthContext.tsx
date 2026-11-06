import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError, apiGet, apiPost, setUnauthorizedHandler } from "../api/client";
import type { AuthUser, TokenResponse } from "../api/types";
import { clearToken, getToken, setToken } from "./token";

/**
 * checking     comprobando la sesión guardada (GET /auth/me)
 * anonymous    sin sesión: toca la pantalla de login
 * authenticated con sesión válida
 * unreachable  hay token pero el servidor no responde (no se descarta la sesión)
 */
export type AuthStatus = "checking" | "anonymous" | "authenticated" | "unreachable";

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>(() => (getToken() ? "checking" : "anonymous"));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [attempt, setAttempt] = useState(0);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setStatus("anonymous");
    // Los datos en caché son de esa sesión: no deben verse en la siguiente.
    queryClient.clear();
  }, [queryClient]);

  // Cualquier 401 posterior (sesión caducada, usuario desactivado) vuelve al login.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Al abrir la app (y al reintentar) se valida el token guardado.
  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    setStatus("checking");
    apiGet<AuthUser>("/auth/me")
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        setStatus("authenticated");
      })
      .catch((err) => {
        if (cancelled) return;
        // El 401 ya lo gestionó el manejador global (logout); otro error = sin servidor.
        if (!(err instanceof ApiError && err.status === 401)) setStatus("unreachable");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const startSession = useCallback((res: TokenResponse) => {
    setToken(res.access_token);
    setUser(res.user);
    setStatus("authenticated");
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      startSession(await apiPost<TokenResponse>("/auth/login", { email, password }, { auth: false }));
    },
    [startSession],
  );

  const register = useCallback(
    async (email: string, password: string, fullName: string) => {
      startSession(
        await apiPost<TokenResponse>(
          "/auth/register",
          { email, password, full_name: fullName },
          { auth: false },
        ),
      );
    },
    [startSession],
  );

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const value = useMemo(
    () => ({ status, user, login, register, logout, retry }),
    [status, user, login, register, logout, retry],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
