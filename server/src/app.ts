import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import type { Logger } from "pino";
import type { Config } from "./config.js";
import { toErrorBody } from "./errors.js";
import { DemoRepo } from "./data/repo.js";
import { checkDb } from "./db/health.js";
import type { Db } from "./db/client.js";
import type { Persister } from "./db/persist.js";
import { createErrorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { createRateLimiters, DEFAULT_RATE_LIMITS, type RateLimitOptions } from "./middleware/rateLimit.js";
import { requestId } from "./middleware/requestId.js";
import { Hub } from "./realtime.js";
import { createApiRouter } from "./routes/api.js";
import { createGuidanceRouter } from "./routes/guidance.js";
import { Flow } from "./services/flow.js";
import { AnthropicExtractor, GnaniTranscriber } from "./voice/providers.js";
import { VoiceService } from "./voice/service.js";

export interface AppOptions {
  config: Config;
  logger: Logger;
  repo?: DemoRepo;
  db?: Db | null;
  now?: () => Date;
  rateLimits?: RateLimitOptions;
  persister?: Persister;
  voice?: VoiceService; // defaults to Gnani + the model when both keys are set
}

function defaultVoice(c: Config): VoiceService | undefined {
  if (!c.GNANI_API_KEY || !c.AI_API_KEY) return undefined;
  return new VoiceService(new GnaniTranscriber(c.GNANI_API_KEY), new AnthropicExtractor(c.AI_API_KEY, c.AI_MODEL), {
    perDonorPerDay: c.VOICE_DAILY_PER_DONOR,
    globalPerDay: c.VOICE_DAILY_GLOBAL,
  });
}

export interface BuiltApp {
  app: Express;
  flow: Flow;
  hub: Hub;
}

// Working state lives in memory (DemoRepo). With a persister, every change is also written to Postgres
// and the repo is rebuilt from it on boot (see index.ts); without one, state resets on restart.
export function createApp(opts: AppOptions): BuiltApp {
  const { config } = opts;
  const repo = opts.repo ?? new DemoRepo();
  const hub = new Hub();
  const flow = new Flow(repo, hub, opts.now, opts.persister);
  const voice = opts.voice ?? defaultVoice(config);
  const limits = createRateLimiters(config.JWT_SECRET, opts.rateLimits ?? DEFAULT_RATE_LIMITS);

  const app = express();
  app.disable("x-powered-by");
  if (config.NODE_ENV === "production") app.set("trust proxy", 1); // behind Render/Railway: real client IP for rate limits
  app.use(requestId);
  app.use(helmet());
  app.use(cors({ origin: config.ALLOWED_ORIGIN }));
  app.use(express.json({ limit: "100kb" }));
  app.use("/api", (_req, res, next) => {
    if (config.USE_STUBS) res.setHeader("X-Stub", "true");
    next();
  });
  app.use("/api", limits.general);
  app.use(
    "/api",
    createGuidanceRouter({ jwtSecret: config.JWT_SECRET, rules: repo.guidance, now: opts.now }),
  );
  app.use(
    "/api",
    createApiRouter({
      flow,
      hub,
      jwtSecret: config.JWT_SECRET,
      demoMode: config.DEMO_MODE,
      voice,
      voiceLimiter: limits.voice,
      dbStatus: async () => (opts.db ? await checkDb(opts.db) : "memory"),
    }),
  );
  app.use((req, res, next) => (req.path.startsWith("/api") ? notFoundHandler(req, res) : next()));
  app.use((_req, res) => {
    res.status(404).json(toErrorBody("NOT_FOUND"));
  });
  app.use(createErrorHandler(opts.logger));
  return { app, flow, hub };
}
