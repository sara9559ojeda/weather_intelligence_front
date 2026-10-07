import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

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
      "/api": { target: "http://127.0.0.1:8000", changeOrigin: true },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          recharts: ["recharts"],
          react: ["react", "react-dom", "@tanstack/react-query"],
        },
      },
    },
  },
});
