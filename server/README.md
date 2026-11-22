# Annapoorna Link: backend (`server/`)

Express + TypeScript API for donors, receivers, volunteers and sponsors. The API contract is
`docs/12-team-split.md` section 2; deployment steps are in [DEPLOY.md](DEPLOY.md).

## Run
```bash
npm install
cp .env.example .env          # set ALLOWED_ORIGIN and JWT_SECRET at least
npm run dev                   # http://localhost:8080, in memory on the seeded demo data
```
With `DATABASE_URL` set, run `npm run migrate` and `npm run seed` once; the API then loads its state from
Postgres on boot and writes every change back. Run it as a single instance.

| Script | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Develop, compile to `dist/`, run the build |
| `npm test` | Vitest + supertest, no database needed |
| `npm run test:db` | Postgres round trip (restart keeps state, codes and events); needs `TEST_DATABASE_URL` pointing at a throwaway database, because it truncates the demo tables |
| `npm run lint` | ESLint |
| `npm run migrate` | Apply new `migrations/*.sql` files (tracked in `schema_migrations`) |
| `npm run seed` / `demo:reset` | Reset the demo tables to the seeded data, then restart the API |
| `npm run metrics` | Pitch metrics table from the database (`-- --seed-only` needs no database) |

## How it fits together
| Path | Role |
|---|---|
| `src/index.ts`, `src/app.ts` | Boot, security middleware (helmet, one CORS origin, 100 KB bodies, per-user rate limits), routes, 30 s scheduler |
| `src/services/flow.ts` | The only place state changes: post, cancel, offer cascade, accept/decline, tasks, handover codes, expiry |
| `src/data/repo.ts` | In-memory working set (seed + database rows) |
| `src/db/` | Postgres client, loader, write-through persister, migrations runner |
| `src/matching/` | Pure ranking of receivers and choice of volunteer, with EN/TE reasons |
| `src/guidance/` | Latest pickup-by and serve-by from the food-handling rules (docs/10) |
| `src/impact/`, `src/metrics/` | Impact numbers with their assumptions (docs/11), pitch metrics |
| `src/voice/` | Voice post: Gnani speech-to-text, model extraction, draft validation, daily caps |
| `src/realtime.ts` | Server-sent events per user; events carry ids and status only |
| `src/views.ts` | Response shapes; handover codes only reach the right party |

## Endpoints
All under `/api`; every route except health, demo accounts and login needs `Authorization: Bearer <token>`.
Errors are always `{ error_code, message, message_te }`.

| Method and path | Who | Notes |
|---|---|---|
| `GET /health` | anyone | `{ ok, db, version }` |
| `GET /demo/accounts`, `POST /auth/demo-login` | anyone | Demo sign-in (JWT, 12 h) |
| `GET /me` | signed in | |
| `GET /guidance` | signed in | `?categories=&storage=&cooked_at=&veg=` |
| `POST /listings`, `GET /listings`, `POST /listings/:id/cancel` | donor | Late pickup-by gives `PICKUP_BY_TOO_LATE` |
| `GET /listings/:id` | party to the listing | Includes `timeline` |
| `GET /offers`, `GET /offers/:id`, `POST /offers/:id/accept` · `/decline` | receiver | Accept returns the listing with the delivery code |
| `GET /receiver/needs`, `PUT /receiver/needs`, `GET /receiver/history` | receiver | |
| `GET /tasks`, `POST /tasks/:id/accept` · `/pickup` · `/deliver`, `PUT /volunteer/availability` | volunteer | 5 wrong codes lock the handover |
| `GET /impact?scope=me` | donor | `scope=city` for sponsors, with breakdowns |
| `GET /map`, `POST /demo/scenario` | sponsor (scenario: anyone with `DEMO_MODE=true`) | |
| `POST /voice-post` | donor | Multipart `audio` (WAV/MP3/OGG/AAC/M4A, 400 KB); `lang=en|te` |
| `GET /events?token=` | signed in | Server-sent events |
