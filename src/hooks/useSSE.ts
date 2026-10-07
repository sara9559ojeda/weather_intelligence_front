import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

type Status = "connecting" | "live" | "offline";

/**
 * Escucha /api/stream. Al recibir un evento "update" invalida las queries que
 * dependen de datos en vivo (patrón "SSE notifica, REST trae los datos").
 */
export function useSSE(): { status: Status; lastEventAt: Date | null } {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>("connecting");
  const [lastEventAt, setLastEventAt] = useState<Date | null>(null);

  useEffect(() => {
    const source = new EventSource("/api/stream");

    source.onopen = () => setStatus("live");
    source.onerror = () => setStatus("offline");
    source.addEventListener("update", () => {
      setLastEventAt(new Date());
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["history"] });
      queryClient.invalidateQueries({ queryKey: ["anomalies"] });
      queryClient.invalidateQueries({ queryKey: ["insight"] });
    });
    source.addEventListener("ping", () => setStatus("live"));

    return () => source.close();
  }, [queryClient]);

  return { status, lastEventAt };
}
