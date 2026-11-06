import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";

/**
 * Animaciones de la pantalla de acceso: la misma coreografía que la portada
 * (entrada de la barra y del panel, discos que suben, flotación, manchas y
 * parallax con el cursor) pero sin scroll. Con `prefers-reduced-motion` no se
 * anima nada: el contenido ya está en su estado final.
 */
export function useAuthAnimations(root: RefObject<HTMLElement | null>): void {
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

        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from("[data-nav]", { yPercent: -140, opacity: 0, duration: 0.9 })
          .from("[data-auth-panel]", { opacity: 0, y: 48, scale: 0.97, duration: 1.1 }, "-=0.55")
          .from("[data-auth-in]", { opacity: 0, y: 18, duration: 0.7, stagger: 0.07 }, "-=0.7")
          .from(
            "[data-disc-in]",
            {
              opacity: 0,
              y: 140,
              scale: 0.9,
              transformOrigin: "50% 50%",
              duration: 1.5,
              ease: "expo.out",
              stagger: { each: 0.16, from: "start" },
            },
            "-=1.1",
          )
          .from("[data-auth-card]", { opacity: 0, y: 26, duration: 0.8, stagger: 0.1 }, "-=0.9");

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

        return () => cleanups.forEach((fn) => fn());
      },
    );

    return () => mm.revert();
  }, [root]);
}
