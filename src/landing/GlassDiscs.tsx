import { useId } from "react";

interface DiscSpec {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  thick: number;
  tone: 1 | 2 | 3;
}

// Tres discos apilados (de abajo arriba). Cada uno es una elipse con "canto":
// el grosor se dibuja repitiendo la elipse unos píxeles más abajo.
const DISCS: DiscSpec[] = [
  { cx: 318, cy: 418, rx: 236, ry: 92, thick: 16, tone: 3 },
  { cx: 306, cy: 290, rx: 276, ry: 108, thick: 18, tone: 2 },
  { cx: 336, cy: 158, rx: 296, ry: 116, thick: 20, tone: 1 },
];

/**
 * Pila de discos de cristal de la portada (SVG). Cada disco anida tres grupos
 * para que GSAP anime por separado la entrada (`data-disc-in`), el parallax de
 * scroll (`data-disc-scroll`) y la flotación continua (`data-disc-float`) sin que
 * unas transformaciones pisen a otras.
 */
export function GlassDiscs({ className = "" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");

  return (
    <svg
      viewBox="0 0 640 600"
      role="img"
      aria-label="Capas de cristal que representan las capas de datos del análisis"
      className={className}
    >
      <defs>
        {DISCS.map((d) => (
          <g key={d.tone}>
            <linearGradient id={`${uid}-top-${d.tone}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" style={{ stopColor: `var(--disc${d.tone}-a)` }} />
              <stop offset="1" style={{ stopColor: `var(--disc${d.tone}-b)` }} />
            </linearGradient>
            <linearGradient id={`${uid}-rim-${d.tone}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
              <stop offset="0.45" stopColor="#fff" stopOpacity="0.05" />
              <stop offset="1" stopColor="#fff" stopOpacity="0.6" />
            </linearGradient>
          </g>
        ))}
        <radialGradient id={`${uid}-bead`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="0.45" style={{ stopColor: "var(--bead)" }} />
          <stop offset="1" style={{ stopColor: "var(--bead-dark)" }} />
        </radialGradient>
        <radialGradient id={`${uid}-coral`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" style={{ stopColor: "var(--coral)" }} stopOpacity="0.95" />
          <stop offset="1" style={{ stopColor: "var(--coral)" }} stopOpacity="0" />
        </radialGradient>
      </defs>

      <g transform="rotate(-12 320 300)">
        {DISCS.map((d, i) => (
          <g key={d.tone} data-disc-in>
            <g data-disc-scroll data-depth={i + 1}>
              <g data-disc-float data-float={i}>
                {/* sombra proyectada sobre el disco inferior */}
                <ellipse cx={d.cx + 6} cy={d.cy + d.thick + 26} rx={d.rx * 0.92} ry={d.ry * 0.9} fill="#0b1b2b" opacity="0.16" />
                {/* canto */}
                {Array.from({ length: d.thick }, (_, k) => (
                  <ellipse
                    key={k}
                    cx={d.cx}
                    cy={d.cy + d.thick - k}
                    rx={d.rx}
                    ry={d.ry}
                    style={{ fill: "var(--disc-edge)" }}
                  />
                ))}
                {/* cara superior */}
                <ellipse
                  cx={d.cx}
                  cy={d.cy}
                  rx={d.rx}
                  ry={d.ry}
                  fill={`url(#${uid}-top-${d.tone})`}
                  fillOpacity="0.96"
                />
                {/* velo interior: el "segundo anillo" del cristal */}
                <ellipse cx={d.cx + 10} cy={d.cy - 4} rx={d.rx * 0.62} ry={d.ry * 0.6} fill="#fff" opacity="0.2" />
                {/* reflejo de borde */}
                <ellipse
                  cx={d.cx}
                  cy={d.cy}
                  rx={d.rx - 1}
                  ry={d.ry - 1}
                  fill="none"
                  stroke={`url(#${uid}-rim-${d.tone})`}
                  strokeWidth="1.8"
                />
              </g>
            </g>
          </g>
        ))}

        {/* resplandor coral del disco superior y esferas flotantes */}
        <ellipse cx="560" cy="250" rx="130" ry="150" fill={`url(#${uid}-coral)`} data-blob-soft />
        <g data-disc-float data-float="4">
          <circle cx="330" cy="34" r="17" fill={`url(#${uid}-bead)`} />
        </g>
        <g data-disc-float data-float="5">
          <circle cx="548" cy="402" r="13" fill={`url(#${uid}-bead)`} />
        </g>
      </g>
    </svg>
  );
}
