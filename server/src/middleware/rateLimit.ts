import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";
import { toErrorBody } from "../errors.js";
import { verifyToken } from "./auth.js";

export interface RateLimitOptions {
  generalMax: number;
  voiceMax: number;
  windowMs: number;
}

export const DEFAULT_RATE_LIMITS: RateLimitOptions = {
  generalMax: 120,
  voiceMax: 20,
  windowMs: 10 * 60 * 1000,
};

export function createRateLimiters(secret: string, opts: RateLimitOptions = DEFAULT_RATE_LIMITS) {
  const keyGenerator = (req: Request): string => {
    const match = /^Bearer (.+)$/.exec(req.header("authorization") ?? "");
    if (match) {
      try {
        return `user:${verifyToken(match[1], secret).userId}`;
      } catch {
        // invalid token: fall back to IP below
      }
    }
    return `ip:${req.ip ?? "unknown"}`;
  };

  const handler = (_req: Request, res: Response): void => {
    res.status(429).json(toErrorBody("RATE_LIMITED"));
  };

  const common = {
    windowMs: opts.windowMs,
    standardHeaders: "draft-7" as const,
    legacyHeaders: false,
    keyGenerator,
    handler,
  };

  return {
    general: rateLimit({ ...common, limit: opts.generalMax }),
    voice: rateLimit({ ...common, limit: opts.voiceMax }),
  };
}
