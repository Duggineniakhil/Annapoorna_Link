// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { LanguageProvider } from "../../i18n";
import { AreaMap } from "./AreaMap";
import { distanceKm, roundKm } from "./geo";
import { routeBetweenOrgs } from "./route";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("geo", () => {
  it("measures Kukatpally to Begumpet at about 9 km", () => {
    const km = distanceKm({ lat: 17.4948, lng: 78.3996 }, { lat: 17.4447, lng: 78.4664 });
    expect(km).toBeGreaterThan(8);
    expect(km).toBeLessThan(10);
    expect(roundKm(0.01)).toBe(0.1);
  });

  it("builds a donor → receiver route from org ids, preferring the known distance", () => {
    const route = routeBetweenOrgs("org-sri-sai", "org-annadanam", 6.2)!;
    expect(route.points.map((p) => [p.kind, p.area])).toEqual([
      ["donor", "Kukatpally"],
      ["receiver", "Begumpet"],
    ]);
    expect(route.lines).toHaveLength(1);
    expect(route.distanceKm).toBe(6.2);
    expect(routeBetweenOrgs("org-sri-sai", undefined)).toBeUndefined();
  });
});

describe("AreaMap", () => {
  it("shows the text version with areas and distance when offline", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    const route = routeBetweenOrgs("org-sri-sai", "org-annadanam", 6.2)!;
    render(
      <LanguageProvider>
        <AreaMap points={route.points} lines={route.lines} distanceKm={6.2} label="Route map" />
      </LanguageProvider>,
    );
    const region = screen.getByRole("region", { name: "Route map" });
    expect(region.textContent).toContain("Kukatpally");
    expect(region.textContent).toContain("Begumpet");
    expect(region.textContent).toContain("6.2 km apart");
    expect(region.textContent).toContain("Map unavailable");
  });
});
