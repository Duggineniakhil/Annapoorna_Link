import type { Category, Org, Storage, User } from "../types/api";
import { DEMO_ACCOUNTS } from "./demoData";
import {
  cancelListing,
  createListing,
  guidanceFor,
  listingDetail,
  listingStore,
  listingsForOrg,
} from "./listings";
import type { ListingInput } from "./listings";
import type { OfferActionResult } from "./receiver";
import {
  acceptOffer,
  declineOffer,
  isDeclineReason,
  isReceiverNeeds,
  offerForOrg,
  offersForOrg,
  receiverHistory,
  receiverNeeds,
  saveReceiverNeeds,
} from "./receiver";

export interface MockResponse {
  status: number;
  body: unknown;
}

interface MockSession {
  user: User;
  org: Org | undefined;
}

// token -> session, populated by POST /api/auth/demo-login and read by GET /api/me.
const sessions = new Map<string, MockSession>();

function encodeToken(user: User): string {
  const payload = JSON.stringify({ sub: user.id, role: user.role, org_id: user.org_id ?? null });
  return "mock." + btoa(payload) + ".mock";
}

/**
 * Session for a token. Sessions live in memory, so after a page refresh the map is empty;
 * the mock token carries the user id, so the session is rebuilt from the demo accounts
 * instead of logging the user out.
 */
function sessionFor(token: string | null): MockSession | undefined {
  if (!token) return undefined;
  const known = sessions.get(token);
  if (known) return known;
  const match = /^mock\.(.+)\.mock$/.exec(token);
  if (!match) return undefined;
  try {
    const payload = JSON.parse(atob(match[1])) as { sub?: unknown };
    const account = DEMO_ACCOUNTS.find((a) => a.user.id === payload.sub);
    if (!account) return undefined;
    const session = { user: account.user, org: account.org };
    sessions.set(token, session);
    return session;
  } catch {
    return undefined;
  }
}

function stripQuery(path: string): string {
  const q = path.indexOf("?");
  return q === -1 ? path : path.slice(0, q);
}

function readAccountId(body: unknown): string | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }
  const id = (body as Record<string, unknown>).account_id;
  return typeof id === "string" ? id : null;
}

const NOT_FOUND_DEMO = {
  error_code: "NOT_FOUND",
  message: "Demo account not found.",
  message_te: "డెమో ఖాతా కనుగొనబడలేదు.",
};

const UNAUTHORIZED = {
  error_code: "UNAUTHORIZED",
  message: "Please log in again.",
  message_te: "దయచేసి మళ్లీ లాగిన్ అవ్వండి.",
};

const NOT_FOUND_ROUTE = {
  error_code: "NOT_FOUND",
  message: "Not found.",
  message_te: "కనుగొనబడలేదు.",
};

const FORBIDDEN_LISTINGS = {
  error_code: "FORBIDDEN",
  message: "Only donors can see these listings.",
  message_te: "ఈ జాబితాలను దాతలు మాత్రమే చూడగలరు.",
};

const INVALID_LISTING_INPUT = {
  error_code: "VALIDATION_FAILED",
  message: "Check the listing details.",
  message_te: "జాబితా వివరాలను తనిఖీ చేయండి.",
};

const INVALID_GUIDANCE_INPUT = {
  error_code: "VALIDATION_FAILED",
  message: "Check the storage and cooked time.",
  message_te: "నిల్వ మరియు వండిన సమయాన్ని తనిఖీ చేయండి.",
};

const LISTING_NOT_FOUND = {
  error_code: "NOT_FOUND",
  message: "Listing not found.",
  message_te: "జాబితా కనుగొనబడలేదు.",
};

const LISTING_INVALID_STATE = {
  error_code: "INVALID_STATE",
  message: "This listing can no longer be cancelled.",
  message_te: "ఈ జాబితాను ఇప్పుడు రద్దు చేయలేరు.",
};

const FORBIDDEN_RECEIVER = {
  error_code: "FORBIDDEN",
  message: "Only receivers can see these pages.",
  message_te: "ఈ పేజీలను స్వీకర్తలు మాత్రమే చూడగలరు.",
};

const OFFER_NOT_FOUND = {
  error_code: "NOT_FOUND",
  message: "Offer not found.",
  message_te: "ఆఫర్ కనుగొనబడలేదు.",
};

const OFFER_EXPIRED = {
  error_code: "OFFER_EXPIRED",
  message: "This offer has expired.",
  message_te: "ఈ ఆఫర్ గడువు ముగిసింది.",
};

const OFFER_NOT_OPEN = {
  error_code: "OFFER_NOT_OPEN",
  message: "This offer is no longer open.",
  message_te: "ఈ ఆఫర్ ఇప్పుడు తెరిచి లేదు.",
};

const INVALID_DECLINE_REASON = {
  error_code: "VALIDATION_FAILED",
  message: "Choose a valid decline reason.",
  message_te: "సరైన తిరస్కరణ కారణాన్ని ఎంచుకోండి.",
};

const INVALID_NEEDS_INPUT = {
  error_code: "VALIDATION_FAILED",
  message: "Check the meals number and the times (HH:MM).",
  message_te: "భోజనాల సంఖ్య, సమయాలను (HH:MM) తనిఖీ చేయండి.",
};

function offerActionResponse<T>(result: OfferActionResult<T>): MockResponse {
  if (result.ok) {
    return { status: 200, body: result.value };
  }
  if (result.reason === "not_found") {
    return { status: 404, body: { ...OFFER_NOT_FOUND } };
  }
  if (result.reason === "expired") {
    return { status: 409, body: { ...OFFER_EXPIRED } };
  }
  return { status: 409, body: { ...OFFER_NOT_OPEN } };
}

function parseQuery(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  const q = path.indexOf("?");
  if (q === -1) {
    return out;
  }
  for (const pair of path.slice(q + 1).split("&")) {
    if (pair === "") {
      continue;
    }
    const eq = pair.indexOf("=");
    const key = eq === -1 ? pair : pair.slice(0, eq);
    const value = eq === -1 ? "" : pair.slice(eq + 1);
    out[decodeURIComponent(key)] = decodeURIComponent(value);
  }
  return out;
}

function isStorage(value: unknown): value is Storage {
  return value === "hot" || value === "room" || value === "chilled";
}

function isListingBody(body: unknown): body is ListingInput {
  if (typeof body !== "object" || body === null) {
    return false;
  }
  const b = body as Record<string, unknown>;
  return (
    Array.isArray(b.items) &&
    typeof b.storage === "string" &&
    typeof b.cooked_at === "string" &&
    typeof b.pickup_by === "string" &&
    typeof b.veg === "boolean" &&
    Array.isArray(b.allergens) &&
    typeof b.posted_in_ms === "number"
  );
}

function orgIdOf(session: MockSession): string {
  return session.org?.id ?? session.user.org_id ?? "";
}

export async function handleMockRequest(
  method: "GET" | "POST" | "PUT",
  path: string,
  body: unknown,
  token: string | null,
): Promise<MockResponse> {
  const pathname = stripQuery(path);

  if (method === "GET" && pathname === "/api/demo/accounts") {
    return {
      status: 200,
      body: DEMO_ACCOUNTS.map((a) => ({
        account_id: a.account_id,
        role: a.role,
        label: a.label,
        area: a.area,
      })),
    };
  }

  if (method === "POST" && pathname === "/api/auth/demo-login") {
    const accountId = readAccountId(body);
    const account = DEMO_ACCOUNTS.find((a) => a.account_id === accountId);
    if (!account) {
      return { status: 404, body: { ...NOT_FOUND_DEMO } };
    }
    const newToken = encodeToken(account.user);
    sessions.set(newToken, { user: account.user, org: account.org });
    const responseBody = account.org
      ? { token: newToken, user: account.user, org: account.org }
      : { token: newToken, user: account.user };
    return { status: 200, body: responseBody };
  }

  if (method === "GET" && pathname === "/api/me") {
    const session = sessionFor(token);
    if (!session) {
      return { status: 401, body: { ...UNAUTHORIZED } };
    }
    const responseBody = session.org
      ? { user: session.user, org: session.org }
      : { user: session.user };
    return { status: 200, body: responseBody };
  }

  if (method === "GET" && pathname === "/api/guidance") {
    const session = sessionFor(token);
    if (!session) {
      return { status: 401, body: { ...UNAUTHORIZED } };
    }
    const params = parseQuery(path);
    const storage = params.storage;
    const cookedAt = new Date(params.cooked_at ?? "");
    if (!isStorage(storage) || Number.isNaN(cookedAt.getTime())) {
      return { status: 400, body: { ...INVALID_GUIDANCE_INPUT } };
    }
    const categories = (params.categories ?? "")
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0) as Category[];
    const itemCategories: Category[] = categories.length > 0 ? categories : ["rice_dish"];
    const nonVeg = params.nonveg === "true";
    const items = itemCategories.map((category) => ({ category, veg: !nonVeg }));
    return { status: 200, body: guidanceFor({ items, storage, cooked_at: cookedAt }) };
  }

  if (method === "GET" && pathname === "/api/listings") {
    const session = sessionFor(token);
    if (!session) {
      return { status: 401, body: { ...UNAUTHORIZED } };
    }
    if (session.user.role !== "donor") {
      return { status: 403, body: { ...FORBIDDEN_LISTINGS } };
    }
    return { status: 200, body: listingsForOrg(orgIdOf(session)) };
  }

  if (method === "POST" && pathname === "/api/listings") {
    const session = sessionFor(token);
    if (!session) {
      return { status: 401, body: { ...UNAUTHORIZED } };
    }
    if (session.user.role !== "donor") {
      return { status: 403, body: { ...FORBIDDEN_LISTINGS } };
    }
    if (!isListingBody(body)) {
      return { status: 400, body: { ...INVALID_LISTING_INPUT } };
    }
    const result = createListing(orgIdOf(session), body, Date.now());
    if (!result.ok) {
      return {
        status: result.status,
        body: {
          error_code: result.error_code,
          message: result.message,
          message_te: result.message_te,
        },
      };
    }
    return { status: 201, body: result.listing };
  }

  const listingIdMatch = /^\/api\/listings\/([^/]+)$/.exec(pathname);
  if (method === "GET" && listingIdMatch) {
    const session = sessionFor(token);
    if (!session) {
      return { status: 401, body: { ...UNAUTHORIZED } };
    }
    const listing = listingStore.find((l) => l.id === listingIdMatch[1]);
    if (!listing || listing.donor_org !== orgIdOf(session)) {
      return { status: 404, body: { ...LISTING_NOT_FOUND } };
    }
    return { status: 200, body: listingDetail(listing) };
  }

  const cancelMatch = /^\/api\/listings\/([^/]+)\/cancel$/.exec(pathname);
  if (method === "POST" && cancelMatch) {
    const session = sessionFor(token);
    if (!session) {
      return { status: 401, body: { ...UNAUTHORIZED } };
    }
    if (session.user.role !== "donor") {
      return { status: 403, body: { ...FORBIDDEN_LISTINGS } };
    }
    const result = cancelListing(orgIdOf(session), cancelMatch[1], Date.now());
    if (!result.ok) {
      if (result.reason === "not_found") {
        return { status: 404, body: { ...LISTING_NOT_FOUND } };
      }
      return { status: 409, body: { ...LISTING_INVALID_STATE } };
    }
    return { status: 200, body: listingDetail(result.listing) };
  }

  if (method === "GET" && pathname === "/api/offers") {
    const session = sessionFor(token);
    if (!session) {
      return { status: 401, body: { ...UNAUTHORIZED } };
    }
    if (session.user.role !== "receiver") {
      return { status: 403, body: { ...FORBIDDEN_RECEIVER } };
    }
    return { status: 200, body: offersForOrg(orgIdOf(session)) };
  }

  const offerIdMatch = /^\/api\/offers\/([^/]+)$/.exec(pathname);
  if (method === "GET" && offerIdMatch) {
    const session = sessionFor(token);
    if (!session) {
      return { status: 401, body: { ...UNAUTHORIZED } };
    }
    if (session.user.role !== "receiver") {
      return { status: 403, body: { ...FORBIDDEN_RECEIVER } };
    }
    const offer = offerForOrg(orgIdOf(session), offerIdMatch[1]);
    if (!offer) {
      return { status: 404, body: { ...OFFER_NOT_FOUND } };
    }
    return { status: 200, body: offer };
  }

  const acceptMatch = /^\/api\/offers\/([^/]+)\/accept$/.exec(pathname);
  if (method === "POST" && acceptMatch) {
    const session = sessionFor(token);
    if (!session) {
      return { status: 401, body: { ...UNAUTHORIZED } };
    }
    if (session.user.role !== "receiver") {
      return { status: 403, body: { ...FORBIDDEN_RECEIVER } };
    }
    return offerActionResponse(acceptOffer(orgIdOf(session), acceptMatch[1], Date.now()));
  }

  const declineMatch = /^\/api\/offers\/([^/]+)\/decline$/.exec(pathname);
  if (method === "POST" && declineMatch) {
    const session = sessionFor(token);
    if (!session) {
      return { status: 401, body: { ...UNAUTHORIZED } };
    }
    if (session.user.role !== "receiver") {
      return { status: 403, body: { ...FORBIDDEN_RECEIVER } };
    }
    const rawReason =
      typeof body === "object" && body !== null
        ? (body as Record<string, unknown>).reason
        : undefined;
    if (rawReason !== undefined && !isDeclineReason(rawReason)) {
      return { status: 400, body: { ...INVALID_DECLINE_REASON } };
    }
    const reason = isDeclineReason(rawReason) ? rawReason : undefined;
    return offerActionResponse(declineOffer(orgIdOf(session), declineMatch[1], reason, Date.now()));
  }

  if (pathname === "/api/receiver/needs" && (method === "GET" || method === "PUT")) {
    const session = sessionFor(token);
    if (!session) {
      return { status: 401, body: { ...UNAUTHORIZED } };
    }
    if (session.user.role !== "receiver") {
      return { status: 403, body: { ...FORBIDDEN_RECEIVER } };
    }
    if (method === "GET") {
      return { status: 200, body: receiverNeeds(orgIdOf(session)) };
    }
    if (!isReceiverNeeds(body)) {
      return { status: 400, body: { ...INVALID_NEEDS_INPUT } };
    }
    return { status: 200, body: saveReceiverNeeds(orgIdOf(session), body) };
  }

  if (method === "GET" && pathname === "/api/receiver/history") {
    const session = sessionFor(token);
    if (!session) {
      return { status: 401, body: { ...UNAUTHORIZED } };
    }
    if (session.user.role !== "receiver") {
      return { status: 403, body: { ...FORBIDDEN_RECEIVER } };
    }
    return { status: 200, body: receiverHistory(orgIdOf(session)) };
  }

  return { status: 404, body: { ...NOT_FOUND_ROUTE } };
}
