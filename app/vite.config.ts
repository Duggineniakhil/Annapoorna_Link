import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const THEME = "#7a3e00";
const BACKGROUND = "#fffdf7";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // A new service worker waits until the user accepts it (the refresh banner comes in A2),
      // so an update never interrupts a half-filled form.
      registerType: "prompt",
      injectRegister: "auto",
      manifest: {
        name: "Annapoorna Link",
        short_name: "Annapoorna",
        description:
          "Surplus food from caterers, wedding halls, messes and restaurants, matched to shelters in Hyderabad.",
        lang: "en",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        theme_color: THEME,
        background_color: BACKGROUND,
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // App shell: every JS/CSS chunk, the HTML, icons and the woff2 fonts (woff is a fallback
        // for very old browsers and is not precached).
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
        navigateFallback: "/index.html",
        // Never answer API calls with the app shell.
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
      },
      // public/*.png are already matched by globPatterns, so do not add the manifest icons twice.
      includeManifestIcons: false,
      devOptions: { enabled: false },
    }),
  ],
});
