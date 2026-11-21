import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// In dev, /api is proxied to the backend so the browser talks to one origin (no CORS setup needed).
// In production set VITE_API_BASE_URL to the deployed API.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Annapoorna Link",
        short_name: "Annapoorna",
        description: "Surplus food to people who need it, before it spoils.",
        theme_color: "#2B2F6B",
        background_color: "#F2F3F7",
        display: "standalone",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }],
      },
      workbox: { navigateFallbackDenylist: [/^\/api/] },
    }),
  ],
  server: {
    port: 5174,
    proxy: { "/api": { target: "http://localhost:8080", changeOrigin: true } },
  },
});
