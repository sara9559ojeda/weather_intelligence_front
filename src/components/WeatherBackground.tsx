import { lazy, memo, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useMotionValue, useSpring, useTransform } from "motion/react";
import type { WeatherCategory } from "../lib/weatherCode";
import type { ParticleKind } from "./ParticlesLayer";
import { ErrorBoundary } from "./ui";

// tsParticles (motor + preset slim) solo hace falta en algunos cielos y nunca
// con movimiento reducido: se carga aparte para no engordar el bundle inicial.
// Ya era asíncrono (el motor se inicializa con loadSlim), así que el momento
// en que aparecen las partículas apenas cambia.
const ParticlesLayer = lazy(() =>
  import("./ParticlesLayer").then((m) => ({ default: m.ParticlesLayer })),
);

/**
 * Escena meteorológica cinematográfica, fija detrás de toda la interfaz.
 * Puramente decorativa: solo recibe la categoría (derivada de weather_code)
 * y is_day que ya expone la API — no lee ni transforma ningún dato.
 *
 * Capas (de atrás hacia delante):
 *  1. Cielo (degradado CSS, transición suave, "respiración" atmosférica lentísima)
 *  2. Luz — el sol/la luna como fuente de luz (glow radial), no un icono
 *  3. Canvas — nubes con profundidad, lluvia cinematográfica, niebla, rayos
 *  4. tsParticles — estrellas / motas de luz diurnas / nieve, cuando aporta
 *  5. Desvanecido inferior hacia --color-bg para que el contenido siga legible
 *
 * Profundidad: el cursor (solo en desktop, pointer:fine) desplaza muy
 * levemente la luz, las nubes y las partículas, cada capa a una velocidad
 * distinta. En touch, una deriva ambiental sustituye al cursor.
 */

const SKY: Record<string, string> = {
  "clear-day": "linear-gradient(180deg, #4f9bef 0%, #8ec4fb 42%, #dcedff 100%)",
  "clear-night": "linear-gradient(180deg, #02040b 0%, #0a1130 55%, #172a4a 100%)",
  "cloudy-day": "linear-gradient(180deg, #aebcd0 0%, #c9d3e1 55%, #e4eaf2 100%)",
  "cloudy-night": "linear-gradient(180deg, #080a12 0%, #171f31 55%, #242d43 100%)",
  "fog-day": "linear-gradient(180deg, #c1cad6 0%, #dfe4ea 100%)",
  "fog-night": "linear-gradient(180deg, #0e111a 0%, #232936 100%)",
  "rain-day": "linear-gradient(180deg, #27384f 0%, #3d506a 55%, #52647d 100%)",
  "rain-night": "linear-gradient(180deg, #03050b 0%, #0b1420 55%, #151e2c 100%)",
  "storm-day": "linear-gradient(180deg, #262b3a 0%, #3d4356 55%, #565b6e 100%)",
  "storm-night": "linear-gradient(180deg, #020207 0%, #0d0d17 55%, #171822 100%)",
  "snow-day": "linear-gradient(180deg, #9bb7d1 0%, #d6e5f1 55%, #f3f9fc 100%)",
  "snow-night": "linear-gradient(180deg, #040813 0%, #0f1a2d 55%, #192940 100%)",
};

const GLOW: Record<
  string,
  { pos: string; core: string; mid: string; blend: React.CSSProperties["mixBlendMode"] }
> = {
  "clear-day": { pos: "72% 20%", core: "#fff3d2", mid: "#ffcf6b", blend: "screen" },
  "clear-night": { pos: "88% 46%", core: "#eef3ff", mid: "#9fb4e8", blend: "screen" },
  "cloudy-day": { pos: "66% 14%", core: "#fdf6e6", mid: "#f3dca6", blend: "screen" },
  "cloudy-night": { pos: "88% 46%", core: "#dbe3f5", mid: "#8f9fc4", blend: "screen" },
  "fog-day": { pos: "60% 10%", core: "#fbfbfb", mid: "#e7ebef", blend: "normal" },
  "fog-night": { pos: "88% 46%", core: "#c9d2e0", mid: "#8b95aa", blend: "screen" },
  "rain-day": { pos: "88% 46%", core: "#dfe7f2", mid: "#a9b8cc", blend: "screen" },
  "rain-night": { pos: "88% 46%", core: "#8fa2c4", mid: "#4d5c7c", blend: "screen" },
  "storm-day": { pos: "88% 46%", core: "#c6cbdb", mid: "#7d84a0", blend: "screen" },
  "storm-night": { pos: "88% 46%", core: "#9aa0c0", mid: "#4a4e6e", blend: "screen" },
  "snow-day": { pos: "64% 12%", core: "#ffffff", mid: "#cfe3f5", blend: "screen" },
  "snow-night": { pos: "88% 46%", core: "#dbe8fb", mid: "#7f96c0", blend: "screen" },
};

type Particle = { x: number; y: number; vx: number; vy: number; size: number; phase: number };

/*
 * memo: App se vuelve a renderizar con cada respuesta de la API o evento SSE;
 * el fondo solo depende de dos primitivas, así que no hay nada que repintar.
 */
export const WeatherBackground = memo(function WeatherBackground({
  category,
  isDay,
}: {
  category: WeatherCategory;
  isDay: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const key = `${category}-${isDay ? "day" : "night"}`;

  const [reduceMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  // --- profundidad: cursor en desktop, deriva ambiental en touch ---
  const mvx = useMotionValue(0);
  const mvy = useMotionValue(0);
  const svx = useSpring(mvx, { stiffness: 32, damping: 18, mass: 0.6 });
  const svy = useSpring(mvy, { stiffness: 32, damping: 18, mass: 0.6 });
  const glowX = useTransform(svx, (v) => v * 0.4);
  const glowY = useTransform(svy, (v) => v * 0.4);
  const particleX = useTransform(svx, (v) => v * 0.18);
  const particleY = useTransform(svy, (v) => v * 0.18);

  useEffect(() => {
    if (reduceMotion) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (fine) {
      const onMove = (e: MouseEvent) => {
        mvx.set(((e.clientX / window.innerWidth) - 0.5) * 34);
        mvy.set(((e.clientY / window.innerHeight) - 0.5) * 22);
      };
      window.addEventListener("mousemove", onMove);
      return () => window.removeEventListener("mousemove", onMove);
    }
    const controls = [
      animate(mvx, [-10, 10, -10], { duration: 26, repeat: Infinity, ease: "easeInOut" }),
      animate(mvy, [6, -6, 6], { duration: 34, repeat: Infinity, ease: "easeInOut" }),
    ];
    return () => controls.forEach((c) => c.stop());
  }, [reduceMotion, mvx, mvy]);

  useEffect(() => {
    if (skyRef.current) skyRef.current.style.backgroundImage = SKY[key] ?? SKY["cloudy-day"];
  }, [key]);

  // --- canvas: nubes con profundidad, lluvia cinematográfica, niebla, rayos ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    // Asignar width/height al canvas lo borra. El dpr se relee porque cambia
    // al mover la ventana a un monitor con otra densidad o al hacer zoom.
    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    let cloudsNear: Particle[] = [];
    let cloudsFar: Particle[] = [];
    let rainNear: Particle[] = [];
    let rainFar: Particle[] = [];
    let fogBands: Particle[] = [];
    let nextFlash = 0;
    let flashAlpha = 0;

    function seed() {
      cloudsNear = [];
      cloudsFar = [];
      rainNear = [];
      rainFar = [];
      fogBands = [];

      if (category === "cloudy" || category === "storm" || category === "snow") {
        const nFar = category === "storm" ? 4 : 3;
        for (let i = 0; i < nFar; i++) {
          cloudsFar.push({
            x: rand(0, width),
            y: rand(height * 0.04, height * 0.28),
            vx: rand(2, 5) * (Math.random() < 0.5 ? -1 : 1),
            vy: 0,
            size: rand(140, 260),
            phase: rand(0, Math.PI * 2),
          });
        }
        const nNear = category === "storm" ? 3 : 2;
        for (let i = 0; i < nNear; i++) {
          cloudsNear.push({
            x: rand(0, width),
            y: rand(height * 0.18, height * 0.4),
            vx: rand(6, 12) * (Math.random() < 0.5 ? -1 : 1),
            vy: 0,
            size: rand(90, 170),
            phase: rand(0, Math.PI * 2),
          });
        }
      }

      if (category === "fog") {
        for (let i = 0; i < 6; i++) {
          fogBands.push({
            x: rand(0, width),
            y: rand(height * 0.2, height * 0.92),
            vx: rand(3, 9),
            vy: 0,
            size: rand(160, 340),
            phase: rand(0, Math.PI * 2),
          });
        }
      }

      if (category === "rain" || category === "storm") {
        const nFar = Math.round((width * height) / 15000);
        for (let i = 0; i < nFar; i++) {
          rainFar.push({
            x: rand(0, width),
            y: rand(0, height),
            vx: -34,
            vy: rand(340, 460),
            size: rand(8, 14),
            phase: 0,
          });
        }
        const nNear = Math.round((width * height) / 26000);
        for (let i = 0; i < nNear; i++) {
          rainNear.push({
            x: rand(0, width),
            y: rand(0, height),
            vx: -70,
            vy: rand(620, 820),
            size: rand(18, 30),
            phase: 0,
          });
        }
      }

      nextFlash = performance.now() + rand(5000, 11000);
    }
    seed();

    // Con cielo despejado el canvas no dibuja nada (estrellas/motas van por
    // tsParticles): no tiene sentido limpiar un lienzo vacío 60 veces/s.
    const animated = !reduceMotion && category !== "clear";

    let raf = 0;
    let running = true;
    let last = performance.now();

    // Pinta un fotograma avanzando la simulación `now - last` ms. No programa
    // el siguiente: de eso se encarga loop(), así que puede llamarse aparte.
    function paint(now: number) {
      const dt = Math.min(48, now - last) / 1000;
      last = now;

      const px = reduceMotion ? 0 : svx.get();
      const py = reduceMotion ? 0 : svy.get();

      ctx!.clearRect(0, 0, width, height);

      if (fogBands.length) {
        for (let i = 0; i < fogBands.length; i++) {
          const b = fogBands[i];
          b.x += b.vx * dt;
          if (b.x > width + b.size) b.x = -b.size;
          const wobble = Math.sin(now / 2600 + b.phase) * 6;
          const ox = px * 0.12;
          const g = ctx!.createRadialGradient(
            b.x + ox,
            b.y + wobble,
            0,
            b.x + ox,
            b.y + wobble,
            b.size,
          );
          g.addColorStop(0, "rgba(255,255,255,0.16)");
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx!.fillStyle = g;
          ctx!.beginPath();
          ctx!.ellipse(b.x + ox, b.y + wobble, b.size, b.size * 0.4, 0, 0, Math.PI * 2);
          ctx!.fill();
        }
      }

      const cloudTint = isDay ? "255,255,255" : "168,182,214";
      for (const [layer, depth, op] of [
        [cloudsFar, 0.3, 0.13],
        [cloudsNear, 0.65, 0.19],
      ] as [Particle[], number, number][]) {
        for (const b of layer) {
          b.x += b.vx * dt;
          if (b.x > width + b.size) b.x = -b.size;
          if (b.x < -b.size) b.x = width + b.size;
          const wobble = Math.sin(now / 2400 + b.phase) * 8;
          const ox = px * depth;
          const oy = py * depth * 0.4;
          const g = ctx!.createRadialGradient(
            b.x + ox,
            b.y + oy + wobble,
            0,
            b.x + ox,
            b.y + oy + wobble,
            b.size,
          );
          g.addColorStop(0, `rgba(${cloudTint},${op})`);
          g.addColorStop(1, `rgba(${cloudTint},0)`);
          ctx!.fillStyle = g;
          ctx!.beginPath();
          ctx!.ellipse(b.x + ox, b.y + oy + wobble, b.size, b.size * 0.5, 0, 0, Math.PI * 2);
          ctx!.fill();
        }
      }

      for (const [layer, alpha, width_] of [
        [rainFar, isDay ? 0.28 : 0.22, 1],
        [rainNear, isDay ? 0.55 : 0.42, 1.6],
      ] as [Particle[], number, number][]) {
        ctx!.strokeStyle = isDay ? `rgba(224,236,250,${alpha})` : `rgba(150,175,215,${alpha})`;
        ctx!.lineWidth = width_;
        // Todas las gotas de una capa comparten estilo: un único trazado y un
        // único stroke() por capa en vez de uno por gota (~200 por fotograma).
        ctx!.beginPath();
        for (const d of layer) {
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          if (d.y > height) {
            d.y = -20;
            d.x = rand(0, width);
          }
          if (d.x < -20) d.x = width + 20;
          ctx!.moveTo(d.x, d.y);
          ctx!.lineTo(d.x + d.vx * 0.04, d.y + d.size);
        }
        ctx!.stroke();
      }

      if (category === "storm") {
        if (now > nextFlash) {
          flashAlpha = rand(0.1, 0.24);
          nextFlash = now + rand(5500, 12000);
        }
        if (flashAlpha > 0.002) {
          ctx!.fillStyle = `rgba(255,255,255,${flashAlpha})`;
          ctx!.fillRect(0, 0, width, height);
          flashAlpha *= 0.83;
        }
      }
    }

    function loop(now: number) {
      paint(now);
      if (running) raf = requestAnimationFrame(loop);
    }

    // Repinta sin avanzar la simulación (fotograma único o tras redimensionar).
    function repaint() {
      last = performance.now();
      paint(last);
    }

    if (animated) {
      raf = requestAnimationFrame(loop);
    } else {
      repaint();
    }

    // "resize" llega en ráfagas (decenas por segundo al arrastrar): se agrupa
    // en un solo ajuste por fotograma y se ignora si nada cambió de verdad.
    let resizeRaf = 0;
    function onResize() {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        const prevW = width;
        const prevH = height;
        const prevDpr = dpr;
        if (
          window.innerWidth === prevW &&
          window.innerHeight === prevH &&
          Math.min(window.devicePixelRatio || 1, 2) === prevDpr
        ) {
          return;
        }
        resize();
        // Re-sembrar recoloca nubes y gotas al azar (salto visible): solo se
        // hace si cambia el ancho o la altura de forma notable, no cuando la
        // barra del navegador móvil aparece/desaparece al hacer scroll.
        if (width !== prevW || Math.abs(height - prevH) > prevH * 0.25) seed();
        // Redimensionar borra el canvas: se repinta ya, sin esperar al bucle
        // (y con movimiento reducido no hay bucle, quedaría vacío).
        repaint();
      });
    }
    window.addEventListener("resize", onResize);

    function onVisibility() {
      if (!animated) return;
      cancelAnimationFrame(raf); // nunca dos bucles a la vez
      if (document.hidden) {
        running = false;
      } else {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(resizeRaf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [category, isDay, reduceMotion, svx, svy]);

  const particleKind = useMemo<ParticleKind | null>(() => {
    if (reduceMotion) return null;
    if (category === "snow") return "snow";
    if (!isDay && category === "clear") return "stars-dense";
    if (!isDay && category === "cloudy") return "stars-faint";
    if (isDay && category === "clear") return "dust";
    return null;
  }, [category, isDay, reduceMotion]);

  const glow = GLOW[key] ?? GLOW["cloudy-day"];
  // Cielos oscuros (noche, lluvia, tormenta): el texto es claro, así que el halo es pequeño y tenue.
  const darkSky = !isDay || category === "rain" || category === "storm";

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div
        ref={skyRef}
        className="sky-layer absolute -inset-4 transition-[background] duration-[1600ms] ease-out"
      />

      <motion.div
        className="glow-pulse absolute -inset-[10%]"
        style={{
          x: glowX,
          y: glowY,
          // De noche el texto es claro: el halo de la luna es más pequeño y tenue para no
          // dejar una mancha luminosa justo detrás de él.
          backgroundImage: !darkSky
            ? `radial-gradient(circle at ${glow.pos}, ${glow.core} 0%, ${glow.mid} 16%, transparent 46%)`
            : `radial-gradient(circle at ${glow.pos}, ${glow.core} 0%, ${glow.mid} 5%, transparent 21%)`,
          mixBlendMode: glow.blend,
          opacity: category === "storm" ? 0.3 : darkSky ? 0.32 : 0.85,
          transition: "background-image 1.6s ease, opacity 1.6s ease",
        }}
      />

      <canvas ref={canvasRef} className="absolute inset-0" />

      {particleKind && (
        <motion.div className="absolute inset-0" style={{ x: particleX, y: particleY }}>
          {/* Decorativa: si su chunk no llega, simplemente no hay partículas. */}
          <ErrorBoundary fallback={null}>
            <Suspense fallback={null}>
              <ParticlesLayer kind={particleKind} sceneKey={key} />
            </Suspense>
          </ErrorBoundary>
        </motion.div>
      )}

      <div
        className="absolute inset-x-0 bottom-0 h-[45vh]"
        style={{ background: "linear-gradient(180deg, transparent 0%, var(--color-bg) 100%)" }}
      />
    </div>
  );
});
