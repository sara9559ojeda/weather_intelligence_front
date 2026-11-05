import { useMemo } from "react";
import { Particles, ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine, ISourceOptions } from "@tsparticles/engine";

/**
 * Capa tsParticles del fondo (estrellas, motas de luz diurnas, nieve).
 * Módulo aparte para que WeatherBackground la cargue de forma diferida.
 */

export type ParticleKind = "stars-dense" | "stars-faint" | "dust" | "snow";

async function initEngine(engine: Engine) {
  await loadSlim(engine);
}

function particleOptions(kind: ParticleKind): ISourceOptions {
  const base: ISourceOptions = {
    fullScreen: { enable: false },
    detectRetina: true,
    fpsLimit: 60,
    interactivity: { events: { onHover: { enable: false }, onClick: { enable: false } } },
    background: { color: "transparent" },
  };

  if (kind === "stars-dense" || kind === "stars-faint") {
    const dense = kind === "stars-dense";
    return {
      ...base,
      particles: {
        number: { value: dense ? 110 : 28 },
        color: { value: "#eaf1ff" },
        opacity: {
          value: { min: 0.12, max: dense ? 0.95 : 0.55 },
          animation: { enable: true, speed: 0.35, sync: false, startValue: "random" },
        },
        size: { value: { min: 0.4, max: dense ? 1.7 : 1.2 } },
        move: { enable: false },
        shape: { type: "circle" },
      },
    };
  }

  if (kind === "dust") {
    return {
      ...base,
      particles: {
        number: { value: 16 },
        color: { value: "#ffedc4" },
        opacity: { value: { min: 0.04, max: 0.16 } },
        size: { value: { min: 1, max: 3 } },
        shape: { type: "circle" },
        move: {
          enable: true,
          speed: { min: 0.15, max: 0.4 },
          direction: "none",
          random: true,
          straight: false,
          outModes: { default: "out" },
        },
      },
    };
  }

  // snow
  return {
    ...base,
    particles: {
      number: { value: 65 },
      color: { value: "#ffffff" },
      opacity: { value: { min: 0.35, max: 0.85 } },
      size: { value: { min: 1.4, max: 3.6 } },
      shape: { type: "circle" },
      move: {
        enable: true,
        direction: "bottom",
        speed: { min: 0.8, max: 2.2 },
        straight: false,
        random: true,
        outModes: { default: "out" },
      },
      wobble: { enable: true, distance: 10, speed: { min: 4, max: 10 } },
    },
  };
}

export function ParticlesLayer({ kind, sceneKey }: { kind: ParticleKind; sceneKey: string }) {
  // <Particles> destruye y recarga el contenedor cada vez que cambia la
  // identidad de `options`: hay que mantenerla estable entre renders o las
  // estrellas/nieve se regeneran (parpadeo) con cada actualización de datos.
  const options = useMemo(() => particleOptions(kind), [kind]);

  return (
    <ParticlesProvider init={initEngine}>
      <Particles
        key={sceneKey + kind}
        id={`wi-particles-${sceneKey}`}
        options={options}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      />
    </ParticlesProvider>
  );
}
