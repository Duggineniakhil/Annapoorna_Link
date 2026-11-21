import { describe, expect, it } from "vitest";
import { handleMockRequest } from "./handlers";

const tokenFor = (sub: string) => "mock." + btoa(JSON.stringify({ sub })) + ".mock";

describe("mock sessions after a page refresh", () => {
  it("rebuilds the session from a demo token the handler has not seen", async () => {
    const res = await handleMockRequest("GET", "/api/me", undefined, tokenFor("user-sri-sai"));
    expect(res.status).toBe(200);
    expect((res.body as { user: { id: string } }).user.id).toBe("user-sri-sai");
  });

  it("still rejects unknown users and malformed tokens", async () => {
    expect((await handleMockRequest("GET", "/api/me", undefined, tokenFor("nobody"))).status).toBe(
      401,
    );
    expect((await handleMockRequest("GET", "/api/me", undefined, "not-a-token")).status).toBe(401);
    expect((await handleMockRequest("GET", "/api/me", undefined, null)).status).toBe(401);
  });
});
