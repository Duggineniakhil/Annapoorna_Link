# Annapoorna Link: UI version 2 (`app-v2/`)

An alternative to `app/` (v1), built so the team can compare the two and keep the better one.
It talks to the real backend in `server/`, not mocks.

**Look:** tile-based, visually rich, one consistent type scale and corner-radius hierarchy.
Indigo night brand, marigold for the one action on each screen, banana-leaf for veg and done, kumkum for urgent.
Light and dark follow the device. The signature element is the time-left ring on every listing, offer and task.

**Stack:** React 18, Vite 5, TypeScript (strict), Tailwind 3 with CSS-variable tokens, TanStack Query
(live events invalidate queries; 15 s polling fallback), React Router 6, Lucide icons, vite-plugin-pwa,
Bricolage Grotesque + Noto Sans Telugu (self-hosted).

## Run
1. Backend: in `server/`, set `ALLOWED_ORIGIN=http://localhost:5174` and a `JWT_SECRET`, then `npm run dev` (port 8080).
2. Frontend: in `app-v2/`, `npm install` then `npm run dev` (http://localhost:5174). `/api` is proxied to 8080.
3. Production: set `VITE_API_BASE_URL` to the deployed API and `npm run build`.

Receivers only get offers during their open hours (seed: 18:00 to 23:00 IST). To demo at other times,
sign in as a kitchen and widen the hours in "Today's needs".

## Checks
`npm run typecheck`, `npm test`, `npm run build`.
