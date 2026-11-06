import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const REACT_PKGS = new Set([
  "react",
  "react-dom",
  "scheduler",
  "@tanstack/react-query",
  "@tanstack/query-core",
]);

// Recharts y sus dependencias (solo las usa Recharts en este proyecto).
const RECHARTS_PKGS = new Set([
  "recharts",
  "recharts-scale",
  "react-smooth",
  "victory-vendor",
  "internmap",
  "decimal.js-light",
  "lodash",
  "clsx",
  "eventemitter3",
  "tiny-invariant",
  "fast-equals",
  "react-is",
  "prop-types",
  "react-transition-group",
  "dom-helpers",
]);

// En desarrollo, /api se redirige al backend FastAPI (puerto 8000).
// En producción (Docker + Nginx) el proxy lo hace Nginx.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ["motion/react", "@tsparticles/react", "@tsparticles/slim", "@tsparticles/engine"],
  },
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://127.0.0.1:8000", changeOrigin: true, ws: true },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Por paquete (función) y no con la forma de objeto: con esta última,
        // el envoltorio CommonJS de react-dom acababa dentro del chunk de
        // recharts, y como el entry lo necesita, index.html precargaba
        // Recharts entero aunque los paneles con gráficos sean diferidos.
        manualChunks(id) {
          const pkg = id.match(/.*[\\/]node_modules[\\/]((?:@[^\\/]+[\\/])?[^\\/]+)/)?.[1];
          if (!pkg) return undefined;
          if (REACT_PKGS.has(pkg)) return "react";
          if (pkg.startsWith("d3-") || RECHARTS_PKGS.has(pkg)) return "recharts";
          return undefined;
        },
      },
    },
  },
});
