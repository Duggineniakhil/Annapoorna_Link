import { Router } from "express";
import { z } from "zod";
import { AppError } from "../errors.js";
import { authenticate } from "../middleware/auth.js";
import { CategorySchema, GuidanceResponseSchema, StorageSchema, type Category } from "../schemas.js";
import { computeSafety, type GuidanceRule } from "../guidance/computeSafety.js";

const QuerySchema = z.object({
  categories: z.string().min(1),
  storage: StorageSchema,
  cooked_at: z.string().datetime({ offset: true }),
  veg: z.enum(["true", "false"]).optional(),
});

export interface GuidanceRouterOptions {
  jwtSecret: string;
  rules: GuidanceRule[];
  now?: () => Date;
}

// GET /api/guidance?categories=a,b&storage=hot&cooked_at=ISO[&veg=true]
// Requires a signed-in user. Omitting veg (or veg=false) applies the stricter non-veg rule.
export function createGuidanceRouter(opts: GuidanceRouterOptions): Router {
  const router = Router();
  router.get("/guidance", authenticate(opts.jwtSecret), (req, res) => {
    const parsed = QuerySchema.safeParse(req.query);
    if (!parsed.success) throw new AppError("VALIDATION_FAILED");

    const parts = parsed.data.categories.split(",").map((c) => CategorySchema.safeParse(c.trim()));
    if (parts.some((p) => !p.success)) throw new AppError("VALIDATION_FAILED");
    const categories: Category[] = parts.flatMap((p) => (p.success ? [p.data] : []));

    const result = computeSafety({
      categories,
      storage: parsed.data.storage,
      cooked_at: new Date(parsed.data.cooked_at),
      veg: parsed.data.veg === "true",
      rules: opts.rules,
      now: opts.now?.(),
    });
    res.json(GuidanceResponseSchema.parse(result));
  });
  return router;
}
