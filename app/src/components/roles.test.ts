import { describe, it, expect } from "vitest";
import type { Role } from "../types/api";
import { ROLE_HOME, resolveRedirect } from "./roles";

describe("resolveRedirect", () => {
  it("logged out: role-section path redirects to /login", () => {
    expect(resolveRedirect(null, "/donor")).toBe("/login");
  });

  it("logged out: /login stays put", () => {
    expect(resolveRedirect(null, "/login")).toBeNull();
  });

  it("logged out: /about stays put", () => {
    expect(resolveRedirect(null, "/about")).toBeNull();
  });

  it("logged in donor: other role's section redirects to donor home", () => {
    expect(resolveRedirect("donor", "/receiver")).toBe("/donor");
  });

  it("logged in volunteer: sponsor section redirects to volunteer home", () => {
    expect(resolveRedirect("volunteer", "/sponsor/map")).toBe("/volunteer");
  });

  it("logged in donor: own section stays put", () => {
    expect(resolveRedirect("donor", "/donor/post")).toBeNull();
  });

  it("logged in donor: / redirects to donor home", () => {
    expect(resolveRedirect("donor", "/")).toBe("/donor");
  });

  it("logged in sponsor: /login redirects to sponsor home", () => {
    expect(resolveRedirect("sponsor", "/login")).toBe("/sponsor");
  });

  it("logged in receiver: /about stays put", () => {
    expect(resolveRedirect("receiver", "/about")).toBeNull();
  });

  it.each<Role>(["donor", "receiver", "volunteer", "sponsor"])(
    "%s home is reachable for its own role",
    (role) => {
      expect(resolveRedirect(role, ROLE_HOME[role])).toBeNull();
    },
  );
});
