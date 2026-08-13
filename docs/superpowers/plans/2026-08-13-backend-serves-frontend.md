# Backend Serves Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Express backend serve the built SPA (`frontend/dist`) with an SPA fallback so the whole app runs from one pm2 process on port 3001.

**Architecture:** Mount `express.static` on `frontend/dist` after the API routes; add an `/api` JSON-404 catch-all and an SPA fallback that serves `index.html` for HTML GET requests, returning `503` if the build is missing.

**Tech Stack:** Node.js (ESM), Express 5, existing `backend/server.js`. No new dependencies, no new npm scripts.

Spec: `docs/superpowers/specs/2026-08-13-backend-serves-frontend-design.md`

---

### Task 1: Serve static frontend with SPA fallback in `backend/server.js`

**Files:**
- Modify: `backend/server.js`

This is a single-file change; the task verifies the 503 (unbuilt) path first, then the normal serving path, then commits once.

- [ ] **Step 1: Build the frontend (precondition for serving)**

Run:
```bash
cd frontend && npm run build
```
Expected: `✓ built` output; `frontend/dist/index.html` exists.

- [ ] **Step 2: Move the build aside to simulate an unbuilt deployment**

Run:
```bash
mv frontend/dist frontend/dist.bak
```
Expected: `frontend/dist` no longer exists.

- [ ] **Step 3: Implement the change in `backend/server.js`**

Replace the entire file content with:

```js
import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pool from "./db/postgres.js";
import { connectMongo } from "./db/mongodb.js";

import recipesRouter from './routes/recipes.js'

const app = express();
const PORT = process.env.PORT || 3001;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "../frontend/dist");

app.use(express.json());
app.use('/api/recipes', recipesRouter)

app.get("/api/health", async (req, res) => {
  res.json({
    status: "ok",
  });
});

app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(express.static(distDir));

app.use((req, res, next) => {
  if (req.method !== "GET" || !req.accepts("html")) {
    return next();
  }
  res.sendFile(path.join(distDir, "index.html"), (err) => {
    if (err) {
      res.status(503).json({ error: "frontend not built" });
    }
  });
});

async function startServer() {
  await pool.query("SELECT 1");
  console.log("Connected to PostgreSQL");

  await connectMongo();

  app.listen(PORT, () => {
    console.log(`Bitesize backend listening on port ${PORT}`);
  });
}

startServer();
```

- [ ] **Step 4: Start the backend**

Ensure nothing else is on port 3001, then run from the repo root:
```bash
node backend/server.js
```
Expected: `Connected to PostgreSQL`, `Bitesize backend listening on port 3001`. Leave it running.

- [ ] **Step 5: Verify the 503 unbuilt path**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/
curl -s http://localhost:3001/ | grep -o "frontend not built"
curl -s http://localhost:3001/api/recipes | grep -o '"count":[0-9]*' | head -1
```
Expected:
- First: `503`
- Second: `frontend not built`
- Third: `"count":12` (API still works while the build is missing)

- [ ] **Step 6: Restore the build**

Stop the server (Ctrl-C). Then:
```bash
mv frontend/dist.bak frontend/dist
```

- [ ] **Step 7: Restart and verify normal serving**

Run again from the repo root:
```bash
node backend/server.js
```
Then, in a second terminal:
```bash
curl -s -o /dev/null -w "root: %{http_code}\n" http://localhost:3001/
curl -s -o /dev/null -w "spa: %{http_code}\n" http://localhost:3001/recipe/sunday-pancakes
curl -s -o /dev/null -w "api-404: %{http_code}\n" http://localhost:3001/api/nope
curl -s http://localhost:3001/ | grep -o "<div id=\"root\"></div>" | head -1
curl -s http://localhost:3001/api/recipes | grep -o '"count":[0-9]*' | head -1
```
Expected:
- `root: 200`
- `spa: 200`
- `api-404: 404`
- the `<div id="root">` grep matches (index.html body served)
- `"count":12`

Stop the server (Ctrl-C).

- [ ] **Step 8: Commit**

```bash
git add backend/server.js
git commit -m "feat: serve built frontend from Express with SPA fallback"
```
