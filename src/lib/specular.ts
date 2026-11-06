import type { PointerEvent } from "react";

/**
 * Foco de luz que sigue al cursor sobre una superficie `.glass` (ver index.css:
 * el pseudo-elemento ::before lee --mx/--my). Solo con ratón o lápiz: en táctil
 * el foco se queda en su posición de reposo (reflejo superior).
 */
export const specular = {
  onPointerMove(e: PointerEvent<HTMLElement>) {
    if (e.pointerType === "touch") return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  },
  onPointerLeave(e: PointerEvent<HTMLElement>) {
    e.currentTarget.style.removeProperty("--mx");
    e.currentTarget.style.removeProperty("--my");
  },
};
