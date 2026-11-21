import type { AuthContext } from "../middleware/auth.js";
import type { Flow } from "./flow.js";

let running = false;

// Wedding-night demo (doc 04 section 7): the same Flow methods real users trigger, driven by timers.
// Returns false when a scenario is already running.
export function runWeddingNight(flow: Flow, delaysMs: [number, number, number] = [20_000, 40_000, 60_000]): boolean {
  if (running) return false;
  running = true;
  const { repo } = flow;
  const donor: AuthContext = { userId: "demo-donor-sri-sai", role: "donor", orgId: "org-caterer-1" };
  const now = flow.now();
  const listing = flow.createListing(donor, {
    items: [
      { name: "Veg biryani", category: "rice_dish", qty_meals: 100 },
      { name: "Dal", category: "curry", qty_meals: 50 },
    ],
    veg: true,
    allergens: [],
    storage: "hot",
    cooked_at: new Date(now.getTime() - 30 * 60_000).toISOString(),
    pickup_by: new Date(now.getTime() + 2 * 3_600_000).toISOString(),
    posted_in_ms: 42_000,
  });

  const step = (ms: number, fn: () => void) => {
    const t = setTimeout(() => {
      try {
        fn();
      } catch {
        running = false; // a real user got there first (cancelled, taken); stop quietly
      }
    }, ms);
    t.unref();
  };

  step(delaysMs[0], () => {
    // Annadanam if it holds the offer, otherwise whichever receiver does.
    const pending = repo.offersFor(listing.id).filter((o) => o.status === "pending");
    const offer = pending.find((o) => o.receiver_org_id === "org-kitchen-1") ?? pending[0];
    const user = offer && repo.usersOfOrg(offer.receiver_org_id)[0];
    if (!offer || !user) throw new Error("no offer");
    flow.acceptOffer({ userId: user.id, role: "receiver", orgId: offer.receiver_org_id }, offer.id);
    // Ravi is a two-wheeler (40 meals), so a car volunteer takes the 150-meal run.
    const vol = repo.volunteers().find((v) => (v.capacity_meals ?? 0) >= listing.total_meals);
    if (!vol) throw new Error("no volunteer");
    const v: AuthContext = { userId: vol.id, role: "volunteer", orgId: null };
    flow.acceptTask(v, listing.id);
    step(delaysMs[1] - delaysMs[0], () => {
      flow.pickup(v, listing.id, repo.codeFor(listing.id, "pickup"));
      step(delaysMs[2] - delaysMs[1], () => {
        flow.deliver(v, listing.id, repo.codeFor(listing.id, "delivery"), listing.total_meals);
        running = false;
      });
    });
  });
  return true;
}
