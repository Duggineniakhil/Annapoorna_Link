import { Component, type ErrorInfo, type ReactNode } from "react";
import { useRouteError } from "react-router-dom";
import { en } from "../i18n/en";
import { te } from "../i18n/te";
import { currentLang } from "../services/api";
import { LogoMark } from "./TopBar";

// Friendly full-screen error (A13). It reads the dictionaries directly instead of the language
// context, so it still works when the error came from a provider.

function text(key: "error.title" | "error.body" | "error.retry" | "error.home"): string {
  return currentLang() === "te" ? te[key] : en[key];
}

export function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <main
      role="alert"
      className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <LogoMark className="h-14 w-14" />
      <h1 className="text-2xl font-bold text-ink">{text("error.title")}</h1>
      <p className="text-ink/70">{text("error.body")}</p>
      <div className="flex w-full flex-col gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="min-h-12 rounded-full bg-leaf-800 px-6 font-bold text-white"
        >
          {text("error.retry")}
        </button>
        <a
          href="/"
          className="flex min-h-12 items-center justify-center rounded-full font-bold text-leaf-800 ring-1 ring-inset ring-leaf-800/30"
        >
          {text("error.home")}
        </a>
      </div>
    </main>
  );
}

/** Catches render errors anywhere in the app. "Try again" re-renders; it reloads if that fails. */
export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  private retried = false;

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Kept for debugging; users only see the friendly screen.
    console.error("App error", error, info.componentStack);
  }

  retry = () => {
    if (this.retried) {
      window.location.reload();
      return;
    }
    this.retried = true;
    this.setState({ failed: false });
  };

  render() {
    return this.state.failed ? <ErrorScreen onRetry={this.retry} /> : this.props.children;
  }
}

/** Router errorElement: a screen that failed to load or render (for example offline). */
export function RouteError() {
  const error = useRouteError();
  console.error("Route error", error);
  return <ErrorScreen onRetry={() => window.location.reload()} />;
}
