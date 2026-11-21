import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// PWA plugin is added in step A1b.
export default defineConfig({
  plugins: [react()],
});
