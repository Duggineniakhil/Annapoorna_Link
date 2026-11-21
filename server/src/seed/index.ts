import "dotenv/config";
import { buildSeed, fingerprint, type SeedData } from "./generate.js";
import { createDb } from "../db/client.js";

// Every foreign key the database enforces, checked before anything is written.
function checkIntegrity(d: SeedData): void {
  const orgIds = new Set(d.orgs.map((o) => o.id));
  const userIds = new Set(d.users.map((u) => u.id));
  const listingIds = new Set(d.listings.map((l) => l.id));
  const problems: string[] = [];
  for (const u of d.users) if (u.org_id && !orgIds.has(u.org_id)) problems.push(`user ${u.id} -> org ${u.org_id}`);
  for (const l of d.listings) if (!orgIds.has(l.donor_org_id)) problems.push(`listing ${l.id} -> donor ${l.donor_org_id}`);
  for (const n of d.receiver_needs) if (!orgIds.has(n.org_id)) problems.push(`need ${n.org_id}`);
  for (const o of d.offers) {
    if (!listingIds.has(o.listing_id)) problems.push(`offer ${o.id} -> listing`);
    if (!orgIds.has(o.receiver_org_id)) problems.push(`offer ${o.id} -> receiver`);
  }
  for (const p of d.pickups) {
    if (!listingIds.has(p.listing_id)) problems.push(`pickup ${p.id} -> listing`);
    if (!orgIds.has(p.receiver_org_id)) problems.push(`pickup ${p.id} -> receiver`);
    if (!userIds.has(p.volunteer_user_id)) problems.push(`pickup ${p.id} -> volunteer`);
  }
  for (const e of d.events) {
    if (!listingIds.has(e.listing_id)) problems.push(`event -> listing ${e.listing_id}`);
    if (e.actor_user_id && !userIds.has(e.actor_user_id)) problems.push(`event ${e.listing_id} ${e.type} -> actor ${e.actor_user_id}`);
  }
  if (problems.length > 0) {
    throw new Error(`Seed integrity failed (${problems.length}): ${problems.slice(0, 5).join("; ")}`);
  }
}

function summarise(d: SeedData) {
  return {
    orgs: d.orgs.length,
    users: d.users.length,
    guidance_rules: d.guidance.length,
    receiver_needs: d.receiver_needs.length,
    listings: d.listings.length,
    offers: d.offers.length,
    pickups: d.pickups.length,
    events: d.events.length,
    capacity_exceptions: d.capacity_exceptions,
    fingerprint: fingerprint(d),
  };
}

async function main(): Promise<void> {
  const data = buildSeed();
  checkIntegrity(data);
  const dryRun = process.argv.includes("--dry-run");
  if (dryRun) {
    console.log(JSON.stringify({ dry_run: true, ...summarise(data) }));
    return;
  }
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_RESET !== "true") {
    throw new Error("Refusing to reset demo data when NODE_ENV=production. Set ALLOW_DEMO_RESET=true only on a demo database.");
  }
  const db = createDb(process.env.DATABASE_URL ?? "");
  try {
    await db.begin(async (tx) => {
      await tx.unsafe(
        "TRUNCATE events, pickups, offers, listings, receiver_needs, users, orgs, guidance_rules RESTART IDENTITY CASCADE",
      );
      await tx`INSERT INTO guidance_rules ${tx(data.guidance)}`;
      await tx`INSERT INTO orgs ${tx(data.orgs)}`;
      await tx`INSERT INTO users ${tx(data.users)}`;
      await tx`INSERT INTO receiver_needs ${tx(data.receiver_needs)}`;
      await tx`INSERT INTO listings ${tx(data.listings.map((l) => ({ ...l, items: tx.json(l.items as never) })))}`;
      await tx`INSERT INTO offers ${tx(data.offers.map((o) => ({ ...o, reasons: tx.json(o.reasons) })))}`;
      await tx`INSERT INTO pickups ${tx(data.pickups)}`;
      await tx`INSERT INTO events ${tx(data.events.map((e) => ({ ...e, data: tx.json(e.data as never) })))}`;
    });
    console.log(JSON.stringify({ seeded: true, ...summarise(data) }));
  } finally {
    await db.end({ timeout: 5 });
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : "unknown error";
  console.error(`seed failed: ${message}`);
  process.exitCode = 1;
});
