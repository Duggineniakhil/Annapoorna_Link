import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Self-hosted Telugu + Latin font (font-display: swap). Only 400 and 700 are loaded to keep the
// first load small; the browser picks the nearest weight for medium/semibold.
import "@fontsource/noto-sans-telugu/400.css";
import "@fontsource/noto-sans-telugu/700.css";
import "./index.css";
import App from "./App";
import { LanguageProvider } from "./i18n";

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found");

createRoot(root).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
);
