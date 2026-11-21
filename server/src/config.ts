import { z } from "zod";

const originSchema = z
  .string()
  .refine((v) => /^https?:\/\/[^\s/*]+$/.test(v), "ALLOWED_ORIGIN must be a single http(s) origin");

const baseSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  ALLOWED_ORIGIN: originSchema,
  JWT_SECRET: z.string().min(16),
  DATABASE_URL: z.string().default(""),
  GNANI_API_KEY: z.string().default(""),
  AI_API_KEY: z.string().default(""),
  USE_STUBS: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  // true: any signed-in user may start the demo scenario (not only the sponsor account).
  DEMO_MODE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

// DEPLOY.md asks for 32+ characters; enforce it where it matters.
const envSchema = baseSchema.superRefine((v, ctx) => {
  if (v.NODE_ENV === "production" && v.JWT_SECRET.length < 32) {
    ctx.addIssue({ code: "custom", path: ["JWT_SECRET"], message: "JWT_SECRET must be at least 32 characters in production" });
  }
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((i) => String(i.path[0])))];
    throw new Error(`Invalid environment configuration. Check these variables: ${names.join(", ")}`);
  }
  return result.data;
}
