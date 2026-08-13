# Design: Backend serves the built frontend

Date: 2026-08-13

## Problem

The frontend is built to `frontend/dist` but served on the VPS by nginx from
`/var/www`, requiring a manual copy of `dist` after every build. We want the
Express backend (already running under pm2) to serve the built frontend so
deploys are just `git pull` + `npm run build`, with no copy step and no
`/var/www` dependency.

## Goal

- `GET /` and all non-API GET routes serve the built SPA (`frontend/dist`).
- API routes (`/api/recipes`, `/api/health`) keep priority and unchanged behavior.
- The whole app runs from a single Express process on port 3001.
- Local development is unaffected (Vite dev server on 5173 still proxies `/api` → 3001).

## Architecture

Single Express process on port 3001 handles both API and static SPA delivery:

```
browser ──> nginx (reverse proxy only) ──> Express :3001
                                            ├── /api/*        (recipes, health)
                                            └── /             (static dist + SPA fallback)
```

## Changes

### `backend/server.js` (only file changed)

1. After mounting `/api/recipes` and `/api/health`:
   - Serve `express.static` on `frontend/dist`, resolved from the module's own
     location via `fileURLToPath(new URL(...))` so it works regardless of CWD
     (pm2-safe).
   - Add an SPA fallback middleware: for GET requests that accept HTML, do not
     match `/api/*`, and do not match a real static file, respond with
     `dist/index.html`.
     - Express 5 requires a plain `app.use` fallback, not `app.get('*')`
       (wildcard without a name throws in Express 5).
2. If `dist/index.html` is missing when the static mount is configured, the
   server still boots; requests that would hit the SPA fallback respond
   `503` with a clear "frontend not built" message.
3. Unknown `/api/*` routes continue to return a JSON 404.
4. Port remains `process.env.PORT || 3001`.
5. No new dependencies; no new npm scripts.

### VPS nginx (not in this repo)

Server block becomes a pure reverse proxy; `/var/www` static serving is removed:

```nginx
server {
  listen 80;
  server_name your-domain.com;
  location / { proxy_pass http://127.0.0.1:3001; }
}
```

## Error handling

- Missing `dist/index.html` (backend started before first frontend build):
  SPA fallback responds `503` with `{ error: "frontend not built" }`.
- Unknown API route: existing JSON 404.
- Static file not found (non-SPA asset): falls through to the SPA fallback for
  HTML requests; other requests get Express's default 404.

## Testing / verification

No test framework in the repo (per project decision). Verification is manual:

1. `npm run lint` in `frontend/` (exit 0, expected `only-export-components`
   warning at `useRecipes.jsx:72`).
2. `npm run build` in `frontend/`.
3. Start backend; then curl checks:
   - `curl /` → serves `index.html` (200, HTML).
   - `curl /recipe/sunday-pancakes` → serves `index.html` (SPA fallback, 200).
   - `curl /api/recipes` → 12 items (unchanged).
   - `curl /api/nope` → JSON 404.
4. Before-build case: with `dist/index.html` absent, `curl /` → `503`
   `{ "error": "frontend not built" }`; server still boots and `/api/recipes`
   still works.
