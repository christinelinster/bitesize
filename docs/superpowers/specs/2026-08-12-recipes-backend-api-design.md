# Recipes from Backend API — Design

Date: 2026-08-12

## Goal

Replace the frontend's hardcoded recipe data (`frontend/src/data/recipes.js`) with
data served by the existing Express backend from PostgreSQL. The backend API returns
raw recipe data only; all styling and icons remain in the frontend.

## Architecture

Mono-repo with two independent processes:

- **Backend** (`backend/`): Express + PostgreSQL. Single source of truth for recipe data.
- **Frontend** (`frontend/`): React + Vite. Fetches recipes once via a dev proxy and
  renders them. Existing client-side filters (category, calorie limit, favourites)
  are unchanged.

No shared code between the two.

## Backend

### Database

Postgres `recipes` table with the columns below. `id` is a text primary key so
existing slugs (`sunday-pancakes`, etc.) keep URLs like `/recipe/sunday-pancakes` working.

| column        | type          | notes                          |
| ------------- | ------------- | ------------------------------ |
| `id`          | text PK       | slug, e.g. `sunday-pancakes`   |
| `name`        | text          |                                |
| `category`    | text          | one of the frontend categories |
| `time`        | integer       | minutes                        |
| `servings`    | integer       |                                |
| `calories`    | integer       |                                |
| `protein`     | integer       | grams                          |
| `fat`         | integer       | grams                          |
| `carbs`       | integer       | grams                          |
| `ingredients` | text[]        |                                |
| `instructions`| text[]        |                                |

No `icon` column, no `accent` column — those are frontend-only concerns.

### Seed data

Recipe data moves from `frontend/src/data/recipes.js` into a new
`backend/data/recipes.js`, with `icon` and `accent` stripped from every record.

Category changes to fit the fixed frontend category list:

- `veggie-stirfry` and `quinoa-bowl` are reassigned from `Vegetarian` to `Lunch`.
- Two new `Snack` recipes are added: "Nutty Energy Bites" and "Spiced Roasted Chickpeas"
  (placeholders — final names/ingredients may vary during implementation).

Result: 12 recipes total, covering Breakfast (2), Lunch (2), Dinner (1), Dessert (1),
Snack (2), High Protein (2), Low Carb (2).

`backend/db/seed.js` is idempotent and runnable via `npm run seed` in `backend/`:
`DROP TABLE IF EXISTS recipes` → create table → insert all seeded recipes.

### API

`GET /api/recipes` (route already exists at `backend/routes/recipes.js`) returns all
rows from the `recipes` table as JSON. No query parameters, no filtering. No other
endpoints are added.

Responses are plain data only — no categories list, no maxCalories, no icons/accent.

## Frontend

### Data modules

- `frontend/src/data/recipes.js` is **deleted**.
- New `frontend/src/data/categories.js` exports the fixed category list, in order:
  `['All', 'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'High Protein', 'Low Carb']`.

### Icons and accent

`icon` and `accent` are no longer per-recipe. Every recipe uses a single constant:
one shared icon name (e.g. `bowl`) and one shared accent color. The `RecipeIcon`
component and all recipe styling logic stay exactly where they are in the frontend.

### Data fetching

New `RecipesProvider` + `useRecipes` hook in `frontend/src/hooks/useRecipes.js`:

- Fetches `/api/recipes` once on mount.
- Exposes `{ recipes, maxCalories, loading, error, retry }`.
- `maxCalories` is derived client-side as the max of `calories` across fetched recipes.
- Caches the result at module scope so navigating between Home and Recipe Detail does
  not trigger a second fetch.

### Integration

- `App.jsx` wraps the routes in `RecipesProvider`.
- `Home`, `Filters`, and `RecipeDetail` consume `useRecipes` instead of importing
  `data/recipes.js`.
- `Filters` renders the fixed category chips and the calorie slider with the derived
  `maxCalories`.
- `RecipeDetail` looks up its recipe by `id` from the fetched list and renders existing
  loading / not-found / error states.

### Dev proxy

`frontend/vite.config.js` adds a dev server proxy: `/api → http://localhost:3001`.
Requests stay same-origin in the browser, so no CORS package is required on the backend.

## Data flow

1. App mounts, `RecipesProvider` fires `fetch('/api/recipes')`.
2. Vite proxies the request to the Express server on port 3001.
3. Express queries Postgres and returns all recipe rows.
4. Frontend derives `maxCalories`, renders hero, filters, and recipe grid.
5. Existing client-side category / calorie / favourites filtering is untouched.

## Error handling

- **Backend**: existing `try/catch` in the recipes route returns `500 { error }`.
- **Frontend**: the provider surfaces `error`; Home and Recipe Detail render a friendly
  error message with a Retry button that re-triggers the fetch.
- Favourites (localStorage, `useFavourites`) are unaffected.

## Verification

- `cd frontend && npm run lint` passes.
- `cd frontend && npm run build` succeeds.
- With Postgres running and seeded (`npm run seed`):
  - `backend` starts and connects (`npm run dev`).
  - `frontend` starts (`npm run dev`); Home renders recipes from the API; navigation to
    a detail page and back does not refetch; filters and favourites work.
- No test framework is introduced.