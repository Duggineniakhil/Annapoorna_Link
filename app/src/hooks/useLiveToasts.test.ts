import { describe, expect, it } from "vitest";
import { toastKeyFor } from "./useLiveToasts";

describe("toastKeyFor", () => {
  it("maps donor accepted, picked up and delivered", () => {
    expect(toastKeyFor("donor", "claimed")).toBe("toast.donor.accepted");
    expect(toastKeyFor("donor", "picked_up")).toBe("toast.donor.picked");
    expect(toastKeyFor("donor", "delivered")).toBe("toast.donor.delivered");
  });

  it("maps receiver offers and volunteer-on-the-way", () => {
    expect(toastKeyFor("receiver", "offered")).toBe("toast.receiver.offer");
    expect(toastKeyFor("receiver", "volunteer_assigned")).toBe("toast.receiver.volunteerOnWay");
  });

  it("maps volunteer claimed to a new task", () => {
    expect(toastKeyFor("volunteer", "claimed")).toBe("toast.volunteer.newTask");
  });

  it("returns null for unmapped role/status pairs", () => {
    expect(toastKeyFor("sponsor", "claimed")).toBeNull();
    expect(toastKeyFor("donor", "posted")).toBeNull();
    expect(toastKeyFor("volunteer", "delivered")).toBeNull();
    expect(toastKeyFor("receiver", "claimed")).toBeNull();
  });
});
