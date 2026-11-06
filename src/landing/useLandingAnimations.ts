import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

const formatNumber = (value: number, decimals: number) =>
  value.toLocaleString("es-ES", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/**
 * Todas las animaciones de la portada (GSAP + ScrollTrigger + SplitText).
 *
 * Se localizan por atributos `data-*` dentro de `root`, y todo vive dentro de un
 * `gsap.matchMedia` que se revierte al desmontar (también con el doble montaje de
 * StrictMode). Con `prefers-reduced-motion` no se crea ninguna animación: el
 * contenido ya está en su estado final en el HTML.
 */
export function useLandingAnimations(root: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const scope = root.current;
    if (!scope) return;

    const mm = gsap.matchMedia(scope);

    mm.add(
      {
        motion: "(prefers-reduced-motion: no-preference)",
        wide: "(min-width: 1024px)",
        fine: "(hover: hover) and (pointer: fine)",
      },
      (context) => {
        const { motion, wide, fine } = context.conditions as Record<string, boolean>;
        if (!motion) return;
        const cleanups: Array<() => void> = [];

        // ---------------------------------------------------------------
        // Entrada de la portada
        // ---------------------------------------------------------------
        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
        intro
          .from("[data-nav]", { yPercent: -140, opacity: 0, duration: 0.9 })
          .from("[data-hero-panel]", { opacity: 0, y: 48, scale: 0.97, duration: 1.1 }, "-=0.55")
          .from("[data-disc-in]", {
            opacity: 0,
            y: 140,
            scale: 0.9,
            transformOrigin: "50% 50%",
            duration: 1.5,
            ease: "expo.out",
            stagger: { each: 0.16, from: "start" },
          }, "-=0.9")
          .from("[data-hero-fade]", { opacity: 0, y: 22, duration: 0.8, stagger: 0.1 }, "-=1.0");

        // Titular: cada línea sube desde una máscara. `autoSplit` lo vuelve a partir
        // si cambia el ancho o termina de cargar la tipografía.
        SplitText.create("[data-hero-title]", {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (split) =>
            gsap.from(split.lines, {
              yPercent: 110,
              duration: 1.1,
              ease: "power4.out",
              stagger: 0.14,
              delay: 0.25,
            }),
        });

        // ---------------------------------------------------------------
        // Movimiento continuo: flotación de los discos y deriva de las manchas
        // ---------------------------------------------------------------
        gsap.utils.toArray<SVGGElement>("[data-disc-float]").forEach((el, i) => {
          gsap.to(el, {
            y: i % 2 ? 16 : -16,
            duration: 3.2 + (i % 3) * 0.7,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: i * 0.3,
          });
        });
        gsap.utils.toArray<HTMLElement>("[data-blob]").forEach((el, i) => {
          gsap.to(el, {
            x: gsap.utils.random(-90, 90),
            y: gsap.utils.random(-70, 70),
            duration: gsap.utils.random(9, 14),
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: i * 0.6,
          });
        });

        // Parallax con el cursor sobre el conjunto de discos (solo ratón)
        if (fine && wide) {
          const stage = scope.querySelector<HTMLElement>("[data-stage]");
          if (stage) {
            const moveX = gsap.quickTo(stage, "x", { duration: 0.9, ease: "power3.out" });
            const moveY = gsap.quickTo(stage, "y", { duration: 0.9, ease: "power3.out" });
            const rotate = gsap.quickTo(stage, "rotation", { duration: 1.2, ease: "power3.out" });
            const onMove = (e: PointerEvent) => {
              const nx = e.clientX / window.innerWidth - 0.5;
              const ny = e.clientY / window.innerHeight - 0.5;
              moveX(nx * -34);
              moveY(ny * -22);
              rotate(nx * 3);
            };
            window.addEventListener("pointermove", onMove, { passive: true });
            cleanups.push(() => window.removeEventListener("pointermove", onMove));
          }
        }

        // ---------------------------------------------------------------
        // Scroll
        // ---------------------------------------------------------------
        // Barra superior: se refuerza al salir de la cabecera
        ScrollTrigger.create({
          start: 40,
          end: "max",
          onToggle: (self) =>
            scope.querySelector("[data-nav]")?.classList.toggle("is-scrolled", self.isActive),
        });

        // Los discos se separan a distinta velocidad al bajar (profundidad)
        gsap.utils.toArray<SVGGElement>("[data-disc-scroll]").forEach((el) => {
          const depth = Number(el.dataset.depth ?? 1);
          gsap.to(el, {
            y: -70 * depth,
            ease: "none",
            scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: 0.6 },
          });
        });
        gsap.to("[data-hero-panel]", {
          y: -40,
          ease: "none",
          scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: 0.6 },
        });

        // Cinta de texto en bucle; el scroll la acelera y luego vuelve a su ritmo
        const track = scope.querySelector<HTMLElement>("[data-marquee-track]");
        if (track) {
          const loop = gsap.to(track, { xPercent: -50, ease: "none", duration: 38, repeat: -1 });
          ScrollTrigger.create({
            onUpdate: (self) => {
              const boost = Math.min(Math.abs(self.getVelocity()) / 260, 7);
              loop.timeScale(1 + boost);
              gsap.to(loop, { timeScale: 1, duration: 0.9, ease: "power2.out", overwrite: true });
            },
          });
        }

        // Títulos y bloques sueltos
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.from(el, {
            opacity: 0,
            y: 46,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          });
        });

        // Cifras que cuentan desde cero al entrar en pantalla
        gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
          const target = Number(el.dataset.value);
          const decimals = Number(el.dataset.decimals ?? 0);
          const state = { v: 0 };
          el.textContent = formatNumber(0, decimals);
          gsap.to(state, {
            v: target,
            duration: 2.2,
            ease: "power3.out",
            onUpdate: () => {
              el.textContent = formatNumber(state.v, decimals);
            },
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          });
        });

        // «Cómo funciona»: la barra se llena con el scroll y el paso activo cambia
        gsap.to("[data-progress]", {
          scaleY: 1,
          ease: "none",
          scrollTrigger: { trigger: "[data-steps]", start: "top 60%", end: "bottom 60%", scrub: 0.4 },
        });
        const steps = gsap.utils.toArray<HTMLElement>("[data-step]");
        const numEl = scope.querySelector<HTMLElement>("[data-step-num]");
        const titleEl = scope.querySelector<HTMLElement>("[data-step-title]");
        steps.forEach((step, i) => {
          ScrollTrigger.create({
            trigger: step,
            start: "top 58%",
            end: "bottom 58%",
            onToggle: (self) => {
              step.dataset.active = String(self.isActive);
              if (!self.isActive) return;
              if (numEl) numEl.textContent = String(i + 1).padStart(2, "0");
              if (titleEl) titleEl.textContent = step.dataset.title ?? "";
              gsap.fromTo(
                [numEl, titleEl].filter(Boolean),
                { yPercent: 40, opacity: 0 },
                { yPercent: 0, opacity: 1, duration: 0.55, ease: "power3.out", stagger: 0.06, overwrite: true },
              );
            },
          });
        });

        // Funcionalidades y beneficios: entran en lotes escalonados
        for (const selector of ["[data-feature]", "[data-benefit]"]) {
          gsap.set(selector, { opacity: 0, y: 56, scale: 0.96 });
          ScrollTrigger.batch(selector, {
            start: "top 90%",
            once: true,
            onEnter: (batch) =>
              gsap.to(batch, {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.95,
                ease: "power3.out",
                stagger: 0.12,
                overwrite: true,
              }),
          });
        }

        // Frase destacada: las palabras se encienden una a una con el scroll
        SplitText.create("[data-statement]", {
          type: "words",
          autoSplit: true,
          onSplit: (split) =>
            gsap.fromTo(
              split.words,
              { opacity: 0.16 },
              {
                opacity: 1,
                ease: "none",
                stagger: 0.12,
                scrollTrigger: {
                  trigger: "[data-statement]",
                  start: "top 78%",
                  end: "bottom 42%",
                  scrub: 0.5,
                },
              },
            ),
        });

        // Llamada final
        gsap.from("[data-cta]", {
          opacity: 0,
          y: 70,
          scale: 0.94,
          duration: 1.2,
          ease: "power4.out",
          scrollTrigger: { trigger: "[data-cta]", start: "top 88%", once: true },
        });

        return () => cleanups.forEach((fn) => fn());
      },
    );

    // La tipografía web cambia las alturas: recalcular los puntos de disparo.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => mm.revert();
  }, [root]);
}
