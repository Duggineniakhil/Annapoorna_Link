// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Listing, Task } from "../types/api";

const tokenFor = (sub: string) => "mock." + btoa(JSON.stringify({ sub })) + ".mock";
const RAVI = tokenFor("user-ravi");
const SRI_SAI = tokenFor("user-sri-sai");
const ANNADANAM = tokenFor("user-annadanam");

// Each test gets fresh mock modules and empty storage, so the demo data starts from the seeds.
async function api() {
  const { handleMockRequest } = await import("./handlers");
  return (method: "GET" | "POST" | "PUT", path: string, body: unknown, token: string) =>
    handleMockRequest(method, path, body, token);
}

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
});

async function donorListing(call: Awaited<ReturnType<typeof api>>, id: string): Promise<Listing> {
  const res = await call("GET", `/api/listings/${id}`, undefined, SRI_SAI);
  return res.body as Listing;
}

async function receiverListing(call: Awaited<ReturnType<typeof api>>, id: string) {
  const res = await call("GET", "/api/listings", undefined, ANNADANAM);
  return (res.body as Listing[]).find((l) => l.id === id);
}

describe("volunteer tasks come from claimed listings", () => {
  it("shows Ravi's active task first, then open tasks, and never sends codes", async () => {
    const call = await api();
    const tasks = (await call("GET", "/api/tasks", undefined, RAVI)).body as Task[];
    expect(tasks[0]).toMatchObject({
      id: "tsk-lst-101",
      status: "accepted",
      volunteer_id: "user-ravi",
    });
    expect(tasks.slice(1).every((t) => t.status === "open")).toBe(true);
    for (const t of tasks) {
      expect(t.listing.pickup_code).toBeUndefined();
      expect(t.listing.delivery_code).toBeUndefined();
    }
  });

  it("refuses a second task while one is active", async () => {
    const call = await api();
    const res = await call("POST", "/api/tasks/tsk-lst-108/accept", undefined, RAVI);
    expect(res.status).toBe(409);
    expect((res.body as { error_code: string }).error_code).toBe("TASK_ALREADY_ACTIVE");
  });

  it("a wrong pickup code shows the tries left, and five wrong tries lock it", async () => {
    const call = await api();
    const first = await call("POST", "/api/tasks/tsk-lst-101/pickup", { code: "0000" }, RAVI);
    expect(first.status).toBe(422);
    expect(first.body).toMatchObject({ error_code: "WRONG_CODE", tries_left: 4 });
    for (let i = 0; i < 4; i += 1) {
      await call("POST", "/api/tasks/tsk-lst-101/pickup", { code: "0000" }, RAVI);
    }
    const locked = await call("POST", "/api/tasks/tsk-lst-101/pickup", { code: "0000" }, RAVI);
    expect(locked.status).toBe(423);
  });

  it("pickup and delivery use the donor's and the kitchen's codes and update the listing", async () => {
    const call = await api();
    const pickupCode = (await donorListing(call, "lst-101")).pickup_code!;
    const pickedUp = await call(
      "POST",
      "/api/tasks/tsk-lst-101/pickup",
      { code: pickupCode },
      RAVI,
    );
    expect(pickedUp.status).toBe(200);
    expect((pickedUp.body as Listing).status).toBe("picked_up");
    expect((await donorListing(call, "lst-101")).status).toBe("picked_up");
    expect((await donorListing(call, "lst-101")).pickup_code).toBeUndefined();

    const deliveryCode = (await receiverListing(call, "lst-101"))!.delivery_code!;
    const delivered = await call(
      "POST",
      "/api/tasks/tsk-lst-101/deliver",
      { code: deliveryCode, meals_delivered: 140 },
      RAVI,
    );
    expect(delivered.status).toBe(200);
    expect((delivered.body as Listing).status).toBe("delivered");
    expect((await donorListing(call, "lst-101")).status).toBe("delivered");

    const history = (await call("GET", "/api/volunteer/history", undefined, RAVI)).body as {
      id: string;
      meals: number;
    }[];
    expect(history[0]).toMatchObject({ id: "tsk-lst-101", meals: 140 });
  });

  it("a kitchen accepting an offer creates an open task for volunteers", async () => {
    const call = await api();
    await call("POST", "/api/offers/off-1/accept", undefined, ANNADANAM);
    const tasks = (await call("GET", "/api/tasks", undefined, RAVI)).body as Task[];
    expect(tasks.find((t) => t.id === "tsk-lst-102")?.status).toBe("open");
  });

  it("donors never see the kitchen's delivery code", async () => {
    const call = await api();
    expect((await donorListing(call, "lst-101")).delivery_code).toBeUndefined();
    const list = (await call("GET", "/api/listings", undefined, SRI_SAI)).body as Listing[];
    expect(list.every((l) => l.delivery_code === undefined)).toBe(true);
  });

  it("availability returns { ok } and an unavailable volunteer only sees their own task", async () => {
    const call = await api();
    const res = await call("PUT", "/api/volunteer/availability", { available: false }, RAVI);
    expect(res.body).toEqual({ ok: true });
    const tasks = (await call("GET", "/api/tasks", undefined, RAVI)).body as Task[];
    expect(tasks.map((t) => t.id)).toEqual(["tsk-lst-101"]);
  });
});
