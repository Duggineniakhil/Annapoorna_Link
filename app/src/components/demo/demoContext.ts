import { createContext, useContext } from "react";
import type { DemoState } from "./demoSteps";

export interface DemoValue {
  state: DemoState;
  /** Runs the wedding-night scenario and opens the donor's view to watch it. */
  start(): Promise<void>;
  close(): void;
}

export const DemoContext = createContext<DemoValue | null>(null);

export function useDemo(): DemoValue {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside <DemoProvider>");
  return ctx;
}
