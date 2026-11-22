import { Router, type Request, type Response } from "express";
import multer from "multer";
import { AppError } from "../errors.js";
import { authenticate, requireRole, signToken } from "../middleware/auth.js";
import {
  AvailabilityBody, CreateListingBody, DeliverBody, DemoLoginBody, ImpactQuery, PickupBody, ReceiverNeedsBody,
  ScenarioBody, StatusSchema, parseOrThrow, type ReceiverHistoryItem,
} from "../schemas.js";
import { computeImpact } from "../impact/calc.js";
import { haversineKm, volunteerLocation } from "../matching/index.js";
import type { Flow } from "../services/flow.js";
import type { Hub } from "../realtime.js";
import type { VoiceService } from "../voice/service.js";
import { runWeddingNight } from "../services/scenario.js";
import { isListingParty, publicOfferStatus, toListing, toOffer, toOrg, toTask, toTimeline, toUser } from "../views.js";

export interface ApiDeps {
  flow: Flow;
  hub: Hub;
  jwtSecret: string;
  demoMode: boolean;
  voice?: VoiceService;
  voiceLimiter: (req: Request, res: Response, next: (e?: unknown) => void) => void;
  dbStatus: () => Promise<string>;
}

const TASK_RADIUS_KM = 8;
const KEEPALIVE_MS = 20_000;

export function createApiRouter(d: ApiDeps): Router {
  const { flow, hub } = d;
  const { repo } = flow;
  const router = Router();
  const auth = authenticate(d.jwtSecret);
  const me = (req: Request) => {
    if (!req.auth) throw new AppError("UNAUTHORIZED");
    return req.auth;
  };
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 400 * 1024, files: 1 } });

  // ---- public ----
  router.get("/health", async (_req, res) => {
    res.json({ ok: true, db: await d.dbStatus(), version: "0.1.0" });
  });
  router.get("/demo/accounts", (_req, res) => {
    res.json(repo.accounts.map(({ account_id, role, label, area }) => ({ account_id, role, label, area })));
  });
  router.post("/auth/demo-login", (req, res) => {
    const { account_id } = parseOrThrow(DemoLoginBody, req.body);
    const account = repo.accountById(account_id);
    const user = account ? repo.userById(account.account_id) : undefined;
    if (!account || !user) throw new AppError("NOT_FOUND");
    const org = account.org_id ? repo.orgById(account.org_id) : undefined;
    const token = signToken({ userId: user.id, role: user.role, orgId: account.org_id }, d.jwtSecret);
    res.json({ token, user: toUser(user), ...(org ? { org: toOrg(org) } : {}) });
  });

  // ---- any signed-in user ----
  router.get("/me", auth, (req, res) => {
    const a = me(req);
    const user = repo.userById(a.userId);
    if (!user) throw new AppError("UNAUTHORIZED");
    const org = a.orgId ? repo.orgById(a.orgId) : undefined;
    res.json({ user: toUser(user), ...(org ? { org: toOrg(org) } : {}) });
  });

  // ---- donor: listings ----
  router.post("/listings", auth, requireRole("donor"), (req, res) => {
    const l = flow.createListing(me(req), parseOrThrow(CreateListingBody, req.body));
    res.status(201).json(toListing(repo, l, me(req)));
  });
  router.get("/listings", auth, requireRole("donor"), (req, res) => {
    const status = req.query.status === undefined ? undefined : parseOrThrow(StatusSchema, req.query.status);
    const a = me(req);
    const rows = repo
      .allListings()
      .filter((l) => l.donor_org_id === a.orgId && (!status || l.status === status))
      .sort((x, y) => Date.parse(y.created_at) - Date.parse(x.created_at));
    res.json(rows.map((l) => toListing(repo, l, a)));
  });
  router.get("/listings/:id", auth, (req, res) => {
    const a = me(req);
    const l = repo.listingById(String(req.params.id));
    if (!l || !isListingParty(repo, l, a)) throw new AppError("NOT_FOUND");
    res.json({ ...toListing(repo, l, a), timeline: toTimeline(repo, l.id) });
  });
  router.post("/listings/:id/cancel", auth, requireRole("donor"), (req, res) => {
    const l = flow.cancel(me(req), String(req.params.id));
    res.json(toListing(repo, l, me(req)));
  });

  // ---- receiver: offers, needs, history ----
  router.get("/offers", auth, requireRole("receiver"), (req, res) => {
    const a = me(req);
    const now = flow.now();
    const rows = repo.offers.filter((o) => o.receiver_org_id === a.orgId && o.status === "pending" && Date.parse(o.expires_at) > now.getTime());
    res.json(rows.map((o) => toOffer(repo, o, a, now)));
  });
  router.get("/offers/:id", auth, requireRole("receiver"), (req, res) => {
    const a = me(req);
    const o = repo.offerById(String(req.params.id));
    if (!o || o.receiver_org_id !== a.orgId) throw new AppError("NOT_FOUND");
    res.json(toOffer(repo, o, a, flow.now()));
  });
  router.post("/offers/:id/accept", auth, requireRole("receiver"), (req, res) => {
    const l = flow.acceptOffer(me(req), String(req.params.id));
    res.json(toListing(repo, l, me(req))); // includes delivery_code for the claiming receiver
  });
  router.post("/offers/:id/decline", auth, requireRole("receiver"), (req, res) => {
    flow.declineOffer(me(req), String(req.params.id));
    res.json({ ok: true });
  });
  router.get("/receiver/history", auth, requireRole("receiver"), (req, res) => {
    const a = me(req);
    const items: ReceiverHistoryItem[] = [];
    for (const o of repo.offers) {
      if (o.receiver_org_id !== a.orgId || o.status === "pending") continue;
      const l = repo.listingById(o.listing_id);
      if (!l) continue;
      const pickup = repo.pickupFor(l.id);
      const mine = pickup?.receiver_org_id === a.orgId;
      const claimedAt = repo.eventsFor(l.id).find((e) => e.type === "claimed")?.created_at;
      items.push({
        offer_id: o.id,
        offer_status: publicOfferStatus(o.status),
        listing: toListing(repo, l, a),
        meals_delivered: mine ? (pickup?.meals_delivered ?? null) : null,
        at: (o.status === "accepted" ? (pickup?.delivered_at ?? claimedAt) : undefined) ?? o.expires_at,
      });
    }
    items.sort((x, y) => Date.parse(y.at) - Date.parse(x.at));
    res.json(items.slice(0, 50));
  });
  const needsOf = (orgId: string | null) => {
    const org = orgId ? repo.orgById(orgId) : undefined;
    const need = orgId ? repo.needFor(orgId) : undefined;
    if (!org || !need) throw new AppError("NOT_FOUND");
    return { org, need };
  };
  router.get("/receiver/needs", auth, requireRole("receiver"), (req, res) => {
    const { org, need } = needsOf(me(req).orgId);
    res.json({ meals_needed: need.meals_needed, veg_only: org.veg_only, open_from: org.open_from ?? "00:00", open_to: org.open_to ?? "23:59" });
  });
  router.put("/receiver/needs", auth, requireRole("receiver"), (req, res) => {
    const body = parseOrThrow(ReceiverNeedsBody, req.body);
    if (body.open_from >= body.open_to) throw new AppError("VALIDATION_FAILED");
    const { org, need } = needsOf(me(req).orgId);
    need.meals_needed = body.meals_needed;
    org.veg_only = body.veg_only;
    org.open_from = body.open_from;
    org.open_to = body.open_to;
    flow.touchOrg(org.id);
    res.json(body);
  });

  // ---- volunteer ----
  router.get("/tasks", auth, requireRole("volunteer"), (req, res) => {
    const a = me(req);
    const vol = repo.userById(a.userId);
    if (!vol) throw new AppError("UNAUTHORIZED");
    const here = volunteerLocation(vol);
    const mine = repo.pickups
      .filter((p) => p.volunteer_user_id === vol.id && (p.status === "volunteer_assigned" || p.status === "picked_up"))
      .flatMap((p) => repo.listingById(p.listing_id) ?? []);
    const open = repo.allListings().filter((l) => {
      const donor = repo.orgById(l.donor_org_id);
      const p = repo.pickupFor(l.id);
      return l.status === "claimed" && !!p && !p.volunteer_user_id && !!donor
        && (vol.capacity_meals ?? 0) >= l.total_meals && haversineKm(here, donor) <= TASK_RADIUS_KM;
    });
    res.json([...mine, ...open].map((l) => toTask(repo, l, a)));
  });
  router.post("/tasks/:id/accept", auth, requireRole("volunteer"), (req, res) => {
    const l = flow.acceptTask(me(req), String(req.params.id));
    res.json(toTask(repo, l, me(req)));
  });
  router.post("/tasks/:id/pickup", auth, requireRole("volunteer"), (req, res) => {
    const { code } = parseOrThrow(PickupBody, req.body);
    res.json(toListing(repo, flow.pickup(me(req), String(req.params.id), code), me(req)));
  });
  router.post("/tasks/:id/deliver", auth, requireRole("volunteer"), (req, res) => {
    const body = parseOrThrow(DeliverBody, req.body);
    res.json(toListing(repo, flow.deliver(me(req), String(req.params.id), body.code, body.meals_delivered), me(req)));
  });
  // This volunteer's deliveries, newest first (max 50). Same item shape as the app's mock.
  router.get("/volunteer/history", auth, requireRole("volunteer"), (req, res) => {
    const a = me(req);
    const items = repo.pickups
      .filter((p) => p.volunteer_user_id === a.userId && p.status === "delivered")
      .flatMap((p) => {
        const l = repo.listingById(p.listing_id);
        const donor = l ? repo.orgById(l.donor_org_id) : undefined;
        const receiver = repo.orgById(p.receiver_org_id);
        if (!l || !donor || !receiver) return [];
        return [{
          id: l.id,
          items_title: (l.items as { name: string }[]).map((i) => i.name).join(", "),
          meals: p.meals_delivered ?? l.total_meals,
          delivered_at: p.delivered_at ?? l.created_at,
          donor_area: donor.area,
          receiver_area: receiver.area,
        }];
      })
      .sort((x, y) => Date.parse(y.delivered_at) - Date.parse(x.delivered_at))
      .slice(0, 50);
    res.json(items);
  });
  router.put("/volunteer/availability", auth, requireRole("volunteer"), (req, res) => {
    repo.setVolunteerAvailable(me(req).userId, parseOrThrow(AvailabilityBody, req.body).available);
    flow.touchUser(me(req).userId);
    res.json({ ok: true });
  });

  // ---- impact, map, demo ----
  router.get("/impact", auth, requireRole("donor", "sponsor"), (req, res) => {
    const q = parseOrThrow(ImpactQuery, req.query);
    const a = me(req);
    if ((q.scope === "me") !== (a.role === "donor")) throw new AppError("FORBIDDEN"); // donors see their own, sponsors the city
    res.json(computeImpact(repo, { donorOrgId: q.scope === "me" ? (a.orgId ?? undefined) : undefined, from: q.from, to: q.to }));
  });
  router.get("/map", auth, requireRole("sponsor"), (_req, res) => {
    const orgs = repo.allOrgs();
    const recent = repo
      .allListings()
      .filter((l) => l.status === "delivered")
      .sort((x, y) => Date.parse(y.created_at) - Date.parse(x.created_at))
      .slice(0, 10)
      .map((l) => ({ listing_id: l.id, area: repo.orgById(l.donor_org_id)?.area, meals: repo.pickupFor(l.id)?.meals_delivered ?? 0, at: repo.pickupFor(l.id)?.delivered_at ?? l.created_at }));
    res.json({ donors: orgs.filter((o) => o.type === "donor").map(toOrg), receivers: orgs.filter((o) => o.type === "receiver").map(toOrg), recent });
  });
  // Sponsor account, or anyone signed in when DEMO_MODE=true.
  router.post("/demo/scenario", auth, d.demoMode ? (_req, _res, next) => next() : requireRole("sponsor"), (req, res) => {
    parseOrThrow(ScenarioBody, req.body);
    if (!runWeddingNight(flow)) throw new AppError("INVALID_STATE"); // one scenario at a time
    res.status(202).json({ started: true });
  });

  // ---- voice post (P1): audio in, a draft listing out. Never posts, never stores audio ----
  router.post("/voice-post", d.voiceLimiter, auth, requireRole("donor"), upload.single("audio"), (req, res, next) => {
    void (async () => {
      if (!d.voice) throw new AppError("SERVER_BUSY"); // speech or model key not configured
      if (!req.file) throw new AppError("VALIDATION_FAILED");
      const a = me(req);
      const asked = typeof req.body?.lang === "string" ? req.body.lang : repo.userById(a.userId)?.lang;
      res.json(await d.voice.draft(a.userId, req.file.buffer, req.file.mimetype, asked === "te" ? "te-IN" : "en-IN"));
    })().catch(next);
  });

  // ---- realtime (SSE); token comes as ?token= because EventSource cannot set headers ----
  router.get("/events", authenticate(d.jwtSecret, true), (req, res) => {
    const a = me(req);
    res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" });
    res.flushHeaders();
    res.write(": connected\n\n");
    const remove = hub.add(a.userId, res);
    const timer = setInterval(() => res.write(": keep-alive\n\n"), KEEPALIVE_MS);
    req.on("close", () => {
      clearInterval(timer);
      remove();
    });
  });

  return router;
}
