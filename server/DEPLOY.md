# Deploying the Annapoorna Link backend

Host: **Render** (Web Service) + **Supabase** (Postgres). Region: Singapore or Mumbai for both if available.

## 1. Supabase (database)
1. Go to supabase.com, sign in, click **New project**. Name it `annapoorna-link`. Choose a region near India. Set a strong database password and save it in your password manager. Click **Create new project** and wait about 2 minutes.
2. Click **Connect** (top bar). Under **Connection string**, choose **Session pooler** (IPv4 friendly). Copy the URI. It looks like `postgresql://postgres.<project-ref>:[YOUR-PASSWORD]@aws-0-<region>.pooler.supabase.com:5432/postgres`. Replace `[YOUR-PASSWORD]` with your password. This value is `DATABASE_URL`. Never commit it.
3. Apply the schema from your machine (in the `server/` folder):
   - Windows PowerShell: `$env:DATABASE_URL="<the URI>"; npm run migrate`
   - Expected output: `applied 0001_init.sql`, `applied 0002_...sql`, then `migrations up to date` (re-runs only apply new files).
   - Load the demo data: `$env:DATABASE_URL="<the URI>"; npm run seed` (it resets the demo tables). The API refuses to start on an empty database, and restart it after re-seeding.
   - The API keeps its working state in memory and writes every change to Postgres, so it must run as a **single instance**.
4. In Supabase, open **Table Editor** and confirm tables: orgs, users, receiver_needs, listings, offers, pickups, events, guidance_rules, schema_migrations.

## 2. Render (API)
1. Go to render.com, sign in with GitHub, click **New +** → **Web Service**, and connect the repository.
2. Settings:
   - Name: `annapoorna-link-api`
   - Region: same as Supabase if possible
   - Branch: `main`
   - Root Directory: `server`
   - Runtime: Node
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm start`
   - Health Check Path: `/api/health`
   - Instance type: Free (note: free instances sleep after 15 minutes idle; the first request can take about 30–60 seconds)
3. Environment variables (Add Environment Variable):
   - `NODE_VERSION` = `20`
   - `NODE_ENV` = `production`
   - `ALLOWED_ORIGIN` = Member A's Vercel URL, for example `https://<app>.vercel.app` (no trailing slash; ask Member A for the exact URL)
   - `JWT_SECRET` = a random string of at least 32 characters (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `DATABASE_URL` = the Supabase URI from step 1.2
   - `USE_STUBS` = `true`
   - `GNANI_API_KEY` = leave empty for now
   - `AI_API_KEY` = leave empty for now
   Do not set PORT: Render provides it.
4. Click **Create Web Service**. Wait for the build to finish and the status to show **Live**.

## 3. Live checklist
- [ ] `https://<render-url>/api/health` returns HTTP 200 with JSON `{"ok":true,"db":"ok",...}`
- [ ] The same URL with a wrong path (e.g. `/nope`) returns 404 with `error_code` `NOT_FOUND` and no stack trace
- [ ] A request from a non-allowed origin gets no `Access-Control-Allow-Origin` header matching it
- [ ] Response includes `X-Request-Id`
- [ ] Render dashboard logs show no secrets (no `DATABASE_URL`, `JWT_SECRET`, or request bodies)
- [ ] Supabase Table Editor shows the tables
- [ ] Member A has the exact Render URL and can reach `/api/health` from the browser

## 4. Rotating secrets
If a secret is pasted in chat or a log, change it in Supabase (database password, then update DATABASE_URL) or regenerate JWT_SECRET in Render and redeploy. Existing tokens become invalid when JWT_SECRET changes.

## 5. Demo mode and resetting the demo
- `DEMO_MODE=true` lets any signed-in user start the wedding-night scenario (`POST /api/demo/scenario`). By default only the sponsor account can.
- `npm run demo:reset` restores the seeded demo data (same as `npm run seed`; set `ALLOW_DEMO_RESET=true` when `NODE_ENV=production`). **Restart the API afterwards**: it keeps its working state in memory and loads it from the database on boot.

## 6. Voice post (optional)
- Set `GNANI_API_KEY` (speech to text) and `AI_API_KEY` (model that turns the transcript into a draft). With either missing, `POST /api/voice-post` answers 503 and nothing else is affected. `AI_MODEL` picks the model.
- Gnani accepts WAV, MP3, OGG, FLAC, AAC and M4A, up to 30 seconds. **It does not accept WebM**, which Chrome records by default. Either record WAV/M4A in the app, or install `ffmpeg` on the server (it is used to convert WebM). Uploads are capped at 400 KB.
- Daily caps (India time, per server process): `VOICE_DAILY_PER_DONOR` (30) and `VOICE_DAILY_GLOBAL` (500). Audio is never stored and transcripts are never logged.
