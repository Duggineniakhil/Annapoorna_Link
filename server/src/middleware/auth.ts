import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../errors.js";
import type { Role } from "../schemas.js";

export interface AuthContext {
  userId: string;
  role: Role;
  orgId: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export const TOKEN_TTL = "12h";

export function signToken(ctx: AuthContext, secret: string): string {
  return jwt.sign({ sub: ctx.userId, role: ctx.role, org_id: ctx.orgId }, secret, {
    algorithm: "HS256",
    expiresIn: TOKEN_TTL,
  });
}

export function verifyToken(token: string, secret: string): AuthContext {
  try {
    const payload = jwt.verify(token, secret, { algorithms: ["HS256"] }) as jwt.JwtPayload;
    if (typeof payload.sub !== "string" || typeof payload.role !== "string") {
      throw new Error("bad payload");
    }
    return {
      userId: payload.sub,
      role: payload.role as Role,
      orgId: (payload.org_id as string | null | undefined) ?? null,
    };
  } catch {
    throw new AppError("UNAUTHORIZED");
  }
}

export function authenticate(secret: string, allowQueryToken = false) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const header = /^Bearer (.+)$/.exec(req.header("authorization") ?? "");
    const queryToken = allowQueryToken && typeof req.query.token === "string" ? req.query.token : null;
    const raw = header ? header[1] : queryToken;
    if (!raw) {
      next(new AppError("UNAUTHORIZED"));
      return;
    }
    try {
      req.auth = verifyToken(raw, secret);
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(new AppError("UNAUTHORIZED"));
      return;
    }
    if (!roles.includes(req.auth.role)) {
      next(new AppError("FORBIDDEN"));
      return;
    }
    next();
  };
}

export function assertOrg(req: Request, orgId: string | null | undefined): void {
  if (!req.auth || !orgId || req.auth.orgId !== orgId) {
    throw new AppError("FORBIDDEN");
  }
}
