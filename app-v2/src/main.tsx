import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource/noto-sans-telugu/400.css";
import "@fontsource/noto-sans-telugu/600.css";
import "@fontsource/noto-sans-telugu/700.css";
import "./index.css";
import { App } from "./App";
import { LangProvider } from "./lib/i18n";
import { SessionProvider } from "./lib/session";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: true, staleTime: 5_000 } },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LangProvider>
        <SessionProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </SessionProvider>
      </LangProvider>
    </QueryClientProvider>
  </StrictMode>,
);
