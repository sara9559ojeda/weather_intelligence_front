import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE, apiPost } from "../api/client";
import { useLocation } from "../location/LocationContext";
import type { StreamTicket } from "../api/types";

export type RealtimeStatus = "connecting" | "live" | "offline";

const BACKOFF_BASE_MS = 1_000;
const BACKOFF_MAX_MS = 30_000;

/** ws(s)://…/api/ws a partir de la base de la API (relativa o absoluta). */
function websocketUrl(ticket: string): string {
  const url = new URL(`${API_BASE}/ws`, window.location.href);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("ticket", ticket);
  return url.toString();
}

/**
 * Tiempo real por WebSocket (/api/ws). Patrón "el socket notifica, REST trae los
 * datos": un mensaje `observation` o `model_updated` invalida las queries
 * afectadas y TanStack Query las vuelve a pedir.
 *
 * Autenticación: el navegador no permite cabeceras en un WebSocket, así que cada
 * (re)conexión canjea la sesión por un ticket de 60 s (POST /auth/stream-ticket).
 *
 * Reconexión: el servidor cierra la conexión periódicamente (en Vercel, al llegar
 * al máximo de duración de la función) o puede perderse la red. Se reconecta con
 * *backoff* exponencial y, al volver, se invalida todo lo "vivo" porque los
 * eventos emitidos mientras estuvo caído no se reenvían.
 */
export function useRealtime(): { status: RealtimeStatus; lastEventAt: Date | null } {
  const queryClient = useQueryClient();
  const slug = useLocation().current?.slug ?? null;
  // El efecto de conexión no se reinicia al cambiar de ciudad: lee la activa por ref.
  const slugRef = useRef(slug);
  slugRef.current = slug;
  const [status, setStatus] = useState<RealtimeStatus>("connecting");
  const [lastEventAt, setLastEventAt] = useState<Date | null>(null);

  useEffect(() => {
    let disposed = false;
    let socket: WebSocket | null = null;
    let timer: number | undefined;
    let failures = 0; // intentos fallidos seguidos (alimenta el backoff)
    let established = false; // ¿la conexión actual llegó a recibir `connected`?
    let hasConnectedBefore = false;

    const invalidateLive = () => {
      for (const key of ["dashboard", "history", "anomalies", "predictionHistory", "insight"]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    };

    const scheduleReconnect = (delay: number) => {
      if (disposed) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(connect, delay);
    };

    const onMessage = (event: MessageEvent<string>) => {
      let message: { type?: string; data?: { location?: string } };
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      // Con varias ciudades el servidor emite eventos de todas: solo importa la que se ve.
      const eventCity = message.data?.location;
      const isOtherCity = eventCity != null && slugRef.current != null && eventCity !== slugRef.current;
      switch (message.type) {
        case "connected":
          failures = 0;
          established = true;
          setStatus("live");
          // Tras una reconexión puede haberse perdido algún evento: se refresca todo.
          if (hasConnectedBefore) invalidateLive();
          hasConnectedBefore = true;
          break;
        case "observation":
          if (isOtherCity) break;
          setLastEventAt(new Date());
          invalidateLive();
          break;
        case "model_updated":
          if (isOtherCity) break;
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          queryClient.invalidateQueries({ queryKey: ["predictionHistory"] });
          queryClient.invalidateQueries({ queryKey: ["insight"] });
          break;
        case "ping":
          setStatus("live");
          break;
        default:
          break; // tipos futuros: se ignoran
      }
    };

    async function connect() {
      if (disposed) return;
      setStatus((s) => (s === "live" ? s : "connecting"));

      let ticket: string;
      try {
        ticket = (await apiPost<StreamTicket>("/auth/stream-ticket")).ticket;
      } catch {
        // Un 401 ya lo gestiona el cliente (vuelve al login); el resto, a reintentar.
        failures += 1;
        setStatus("offline");
        scheduleReconnect(backoff(failures));
        return;
      }
      if (disposed) return;

      const ws = new WebSocket(websocketUrl(ticket));
      socket = ws;
      established = false;
      ws.onmessage = onMessage;
      ws.onclose = () => {
        if (disposed || socket !== ws) return;
        socket = null;
        if (established) {
          // Cierre ordenado tras una conexión que funcionó (p. ej. límite de
          // duración de la función): reconexión casi inmediata.
          setStatus("connecting");
          scheduleReconnect(500);
        } else {
          // Nunca llegó a establecerse (ticket rechazado, red caída…): backoff.
          failures += 1;
          setStatus("offline");
          scheduleReconnect(backoff(failures));
        }
      };
    }

    const onOnline = () => {
      if (!socket) {
        failures = 0;
        scheduleReconnect(0);
      }
    };
    window.addEventListener("online", onOnline);

    connect();

    return () => {
      disposed = true;
      window.removeEventListener("online", onOnline);
      window.clearTimeout(timer);
      socket?.close();
      socket = null;
    };
  }, [queryClient]);

  return { status, lastEventAt };
}

/** 1 s, 2 s, 4 s… hasta 30 s, con un poco de aleatoriedad para no sincronizar clientes. */
function backoff(failures: number): number {
  const exp = Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** Math.max(0, failures - 1));
  return exp * (0.75 + Math.random() * 0.5);
}
