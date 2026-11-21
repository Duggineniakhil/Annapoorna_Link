import { describe, expect, it } from "vitest";
import { dictionaries } from "./i18n";

describe("dictionaries", () => {
  it("has every English key in Telugu, with the same placeholders, and none empty", () => {
    const { en, te } = dictionaries;
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(te[key], key).toBeTruthy();
      const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
      expect(vars(te[key]), key).toEqual(vars(en[key]));
    }
  });

  it("never claims food is safe, certified or approved, and makes no tax or legal claims", () => {
    const text = Object.values(dictionaries.en).join("\n");
    expect(text).not.toMatch(/\bsafe\b|\bcertified\b|\bapproved\b|\btax\b|\blegal\b/i);
  });
});
