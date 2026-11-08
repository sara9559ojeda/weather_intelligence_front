import { useCallback, useState } from "react";

const KEY = "wi-tab";

/** Pestañas del panel. El orden es el de la barra de navegación. */
export const TABS = [
  { id: "overview", label: "Vista general", short: "General" },
  { id: "history", label: "Análisis histórico", short: "Histórico" },
  { id: "predictive", label: "Inteligencia predictiva", short: "Predictiva" },
  { id: "analyst", label: "Analista IA", short: "Analista" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

const isTabId = (v: unknown): v is TabId => TABS.some((t) => t.id === v);

function readStored(): TabId {
  try {
    const v = localStorage.getItem(KEY);
    if (isTabId(v)) return v;
  } catch {
    /* almacenamiento no disponible: se empieza en la vista general */
  }
  return "overview";
}

/** Pestaña activa; se recuerda entre visitas como simple comodidad (nunca es estado importante). */
export function useActiveTab(): [TabId, (id: TabId) => void] {
  const [tab, setTab] = useState<TabId>(readStored);
  const select = useCallback((id: TabId) => {
    setTab(id);
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* ídem */
    }
  }, []);
  return [tab, select];
}
