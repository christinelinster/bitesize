# Recipes from Backend API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve recipe data to the frontend from the Express + PostgreSQL backend API instead of the hardcoded `frontend/src/data/recipes.js`, keeping all styling and icons in the frontend.

**Architecture:** Backend owns recipe data (Postgres `recipes` table, seeded from `backend/data/recipes.js`); `GET /api/recipes` returns all rows. Frontend fetches once through a Vite dev proxy into a `RecipesProvider`, derives `maxCalories`, and reuses its existing client-side filters. Icons/accent become shared frontend constants; the category chip list becomes a fixed frontend constant.

**Tech Stack:** Node, Express 5, `pg`, React 19, Vite 8. No test framework — verification is lint, build, seed, curl, and manual browser check.

**Spec:** `docs/superpowers/specs/2026-08-12-recipes-backend-api-design.md`

**Preconditions for verification tasks:**
- Postgres is running and reachable via `DATABASE_URL` in `backend/.env`.
- MongoDB is reachable via `MONGODB_URI` in `backend/.env` (the server connects to it on boot — do not change this; it is pre-existing behavior).

---

### Task 1: Backend seed data file

**Files:**
- Create: `backend/data/recipes.js`

- [ ] **Step 1: Create `backend/data/recipes.js`**

The 10 existing recipes move from `frontend/src/data/recipes.js` with `icon` and `accent` removed. `veggie-stirfry` and `quinoa-bowl` change category from `Vegetarian` to `Lunch`. Two new `Snack` recipes are added.

```js
export const recipes = [
  {
    id: 'sunday-pancakes',
    name: 'Fluffy Sunday Pancakes',
    category: 'Breakfast',
    time: 25,
    servings: 4,
    calories: 380,
    protein: 11,
    fat: 12,
    carbs: 56,
    ingredients: [
      '1½ cups all-purpose flour',
      '2 tbsp sugar',
      '1 tbsp baking powder',
      '¼ tsp salt',
      '1¼ cups whole milk',
      '1 egg',
      '2 tbsp melted butter',
      '1 tsp vanilla',
    ],
    instructions: [
      'Whisk flour, sugar, baking powder, and salt in a large bowl.',
      'In another bowl, whisk milk, egg, butter, and vanilla.',
      'Pour wet into dry and stir until just combined (lumps are fine).',
      'Heat a griddle over medium, lightly buttered. Ladle batter into rounds.',
      'Cook until bubbles form and edges look set, then flip and cook 1–2 min.',
    ],
  },
  {
    id: 'shakshuka',
    name: 'Sunny Shakshuka',
    category: 'Breakfast',
    time: 30,
    servings: 2,
    calories: 320,
    protein: 17,
    fat: 18,
    carbs: 22,
    ingredients: [
      '2 tbsp olive oil',
      '1 onion, sliced',
      '1 red bell pepper, sliced',
      '3 cloves garlic, minced',
      '1 tsp smoked paprika',
      '1 tsp cumin',
      '1 (28 oz) can crushed tomatoes',
      '4 eggs',
      'Handful of fresh parsley',
    ],
    instructions: [
      'Heat oil in a skillet over medium. Soften onion and pepper, 8 min.',
      'Add garlic, paprika, and cumin; cook 1 min until fragrant.',
      'Pour in tomatoes, simmer 10 min until thickened. Season.',
      'Make wells and crack in eggs. Cover and cook 5–7 min until set.',
      'Scatter parsley and serve straight from the pan.',
    ],
  },
  {
    id: 'grilled-salmon',
    name: 'Honey-Glazed Salmon',
    category: 'Dinner',
    time: 20,
    servings: 2,
    calories: 420,
    protein: 34,
    fat: 24,
    carbs: 14,
    ingredients: [
      '2 salmon fillets',
      '2 tbsp honey',
      '1 tbsp soy sauce',
      '1 clove garlic, grated',
      '1 tsp lemon juice',
      'Salt and pepper',
    ],
    instructions: [
      'Mix honey, soy sauce, garlic, and lemon juice for the glaze.',
      'Season salmon and brush with half the glaze.',
      'Sear skin-side down in a hot pan, 4 min.',
      'Flip, brush with remaining glaze, and cook 3–4 min more.',
      'Rest 2 min and serve with the pan sauce.',
    ],
  },
  {
    id: 'veggie-stirfry',
    name: 'Rainbow Veggie Stir-Fry',
    category: 'Lunch',
    time: 15,
    servings: 2,
    calories: 260,
    protein: 9,
    fat: 12,
    carbs: 32,
    ingredients: [
      '1 tbsp sesame oil',
      '1 head of broccoli, florets',
      '1 red bell pepper, sliced',
      '1 carrot, ribbons',
      '1 cup snap peas',
      '2 tbsp soy sauce',
      '1 tsp ginger, grated',
      'Sesame seeds to serve',
    ],
    instructions: [
      'Heat sesame oil in a wok over high heat.',
      'Stir-fry broccoli and carrot 3 min, then add pepper and snap peas.',
      'Add soy sauce and ginger; toss 2 min until crisp-tender.',
      'Finish with sesame seeds and serve immediately.',
    ],
  },
  {
    id: 'quinoa-bowl',
    name: 'Chimichurri Quinoa Bowl',
    category: 'Lunch',
    time: 30,
    servings: 2,
    calories: 350,
    protein: 12,
    fat: 14,
    carbs: 44,
    ingredients: [
      '1 cup quinoa, rinsed',
      '2 cups vegetable broth',
      '1 can chickpeas, drained',
      '1 avocado, sliced',
      '½ cup cherry tomatoes',
      'Handful of cilantro',
      '2 tbsp olive oil',
      '1 tbsp red wine vinegar',
    ],
    instructions: [
      'Simmer quinoa in broth 15 min until fluffy. Rest 5 min.',
      'Blend cilantro, oil, vinegar, and a pinch of salt for chimichurri.',
      'Crisp chickpeas in a pan over medium heat, 5 min.',
      'Divide quinoa into bowls; top with chickpeas, avocado, tomatoes.',
      'Drizzle chimichurri over everything.',
    ],
  },
  {
    id: 'chicken-bowl',
    name: 'Harissa Chicken Rice Bowl',
    category: 'High Protein',
    time: 40,
    servings: 2,
    calories: 540,
    protein: 42,
    fat: 16,
    carbs: 52,
    ingredients: [
      '2 chicken thighs, diced',
      '2 tbsp harissa paste',
      '1 cup jasmine rice',
      '1 cup yogurt',
      '½ cucumber, diced',
      '1 tbsp lemon juice',
      'Mint leaves',
    ],
    instructions: [
      'Marinate chicken in harissa for at least 15 min.',
      'Cook rice according to package.',
      'Sear chicken in a hot pan until cooked through, 8–10 min.',
      'Mix yogurt, cucumber, and lemon for the drizzle.',
      'Build bowls with rice, chicken, and yogurt drizzle. Top with mint.',
    ],
  },
  {
    id: 'choc-banana-smoothie',
    name: 'Chocolate Banana Smoothie',
    category: 'High Protein',
    time: 5,
    servings: 1,
    calories: 280,
    protein: 22,
    fat: 8,
    carbs: 34,
    ingredients: [
      '1 frozen banana',
      '1 scoop chocolate protein',
      '1 cup almond milk',
      '1 tbsp peanut butter',
      '1 tsp cocoa powder',
      'Ice',
    ],
    instructions: [
      'Add everything to a blender.',
      'Blend on high until smooth, 45 seconds.',
      'Taste and add a splash more milk if too thick.',
    ],
  },
  {
    id: 'zucchini-noodles',
    name: 'Zucchini Noodle Pesto',
    category: 'Low Carb',
    time: 15,
    servings: 2,
    calories: 290,
    protein: 10,
    fat: 22,
    carbs: 12,
    ingredients: [
      '3 zucchinis, spiralized',
      '½ cup basil pesto',
      '1 cup cherry tomatoes, halved',
      '¼ cup pine nuts, toasted',
      'Parmesan to serve',
    ],
    instructions: [
      'Spiralize zucchinis into noodles.',
      'Heat a pan and toss noodles 2 min to warm through — do not overcook.',
      'Stir in pesto and tomatoes off the heat.',
      'Top with pine nuts and parmesan.',
    ],
  },
  {
    id: 'buddha-bowl',
    name: 'Golden Buddha Bowl',
    category: 'Low Carb',
    time: 35,
    servings: 2,
    calories: 410,
    protein: 15,
    fat: 18,
    carbs: 48,
    ingredients: [
      '1 sweet potato, cubed',
      '1 cup brussels sprouts, halved',
      '1 tsp smoked paprika',
      '2 tbsp tahini',
      '1 tbsp maple syrup',
      '1 tsp lemon juice',
      '1 cup quinoa, cooked',
    ],
    instructions: [
      'Roast sweet potato and sprouts with paprika at 425°F for 25 min.',
      'Whisk tahini, maple, and lemon with water to thin.',
      'Warm the quinoa and divide into bowls.',
      'Top with roasted veggies and drizzle with tahini sauce.',
    ],
  },
  {
    id: 'berry-chia',
    name: 'Berry Chia Pudding',
    category: 'Dessert',
    time: 10,
    servings: 2,
    calories: 230,
    protein: 7,
    fat: 11,
    carbs: 26,
    ingredients: [
      '¼ cup chia seeds',
      '1 cup oat milk',
      '1 tbsp maple syrup',
      '½ tsp vanilla',
      '1 cup mixed berries',
    ],
    instructions: [
      'Whisk chia, oat milk, maple, and vanilla.',
      'Let sit 5 min, then whisk again to break up clumps.',
      'Chill at least 2 hours or overnight.',
      'Top with berries before serving.',
    ],
  },
  {
    id: 'nutty-energy-bites',
    name: 'Nutty Energy Bites',
    category: 'Snack',
    time: 15,
    servings: 10,
    calories: 120,
    protein: 4,
    fat: 7,
    carbs: 12,
    ingredients: [
      '1 cup rolled oats',
      '½ cup peanut butter',
      '⅓ cup honey',
      '¼ cup chocolate chips',
      '¼ cup flax seeds',
      '1 tsp vanilla',
    ],
    instructions: [
      'Stir all ingredients in a bowl until well combined.',
      'Chill the mixture for 15 min so it holds together.',
      'Roll into 10 small balls.',
      'Store in the fridge or freezer.',
    ],
  },
  {
    id: 'spiced-chickpeas',
    name: 'Spiced Roasted Chickpeas',
    category: 'Snack',
    time: 40,
    servings: 4,
    calories: 180,
    protein: 8,
    fat: 6,
    carbs: 24,
    ingredients: [
      '2 cans chickpeas, drained',
      '2 tbsp olive oil',
      '1 tsp smoked paprika',
      '½ tsp cumin',
      '½ tsp chili powder',
      '½ tsp salt',
    ],
    instructions: [
      'Preheat oven to 400°F.',
      'Dry the chickpeas well and toss with oil and spices.',
      'Roast 30–40 min, shaking halfway, until crispy.',
      'Cool slightly before snacking.',
    ],
  },
]
```

- [ ] **Step 2: Verify the seed data shape**

Run:

```bash
node -e "import('./backend/data/recipes.js').then(m => { const rs = m.recipes; console.log('count:', rs.length); console.log('lunch:', rs.filter(r => r.category === 'Lunch').length); console.log('snack:', rs.filter(r => r.category === 'Snack').length); console.log('hasIcon:', rs.some(r => 'icon' in r || 'accent' in r)); })"
```

Expected output:

```
count: 12
lunch: 2
snack: 2
hasIcon: false
```

- [ ] **Step 3: Commit**

```bash
git add backend/data/recipes.js
git commit -m "feat: add backend recipe seed data"
```

---

### Task 2: Backend seed script

**Files:**
- Create: `backend/db/seed.js`
- Modify: `backend/package.json` (add `seed` script)

- [ ] **Step 1: Create `backend/db/seed.js`**

```js
import pool from "./postgres.js";
import { recipes } from "../data/recipes.js";

async function seed() {
  await pool.query("DROP TABLE IF EXISTS recipes");

  await pool.query(`
    CREATE TABLE recipes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      time INTEGER NOT NULL,
      servings INTEGER NOT NULL,
      calories INTEGER NOT NULL,
      protein INTEGER NOT NULL,
      fat INTEGER NOT NULL,
      carbs INTEGER NOT NULL,
      ingredients TEXT[] NOT NULL,
      instructions TEXT[] NOT NULL
    )
  `);

  for (const r of recipes) {
    await pool.query(
      `INSERT INTO recipes
        (id, name, category, time, servings, calories, protein, fat, carbs, ingredients, instructions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        r.id,
        r.name,
        r.category,
        r.time,
        r.servings,
        r.calories,
        r.protein,
        r.fat,
        r.carbs,
        r.ingredients,
        r.instructions,
      ],
    );
  }

  console.log(`Seeded ${recipes.length} recipes`);
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Add the `seed` npm script to `backend/package.json`**

Change the `scripts` block in `backend/package.json` from:

```json
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
```

to:

```json
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js",
    "seed": "node db/seed.js"
  },
```

- [ ] **Step 3: Run the seed script**

From `backend/`:

```bash
npm run seed
```

Expected output:

```
Seeded 12 recipes
```

- [ ] **Step 4: Verify idempotency — run the seed twice, then check the row count**

```bash
npm run seed
node -e "import('./db/postgres.js').then(async pool => { const res = await pool.query('SELECT count(*) FROM recipes'); console.log('rows:', res.rows[0].count); await pool.end(); })"
```

Expected output: `rows:` followed by `12` on the second run (running seed twice must not duplicate rows).

- [ ] **Step 5: Commit**

```bash
git add backend/db/seed.js backend/package.json
git commit -m "feat: add idempotent recipe seed script"
```

---

### Task 3: Formalize the `/api/recipes` route and fix its ESM import

**Files:**
- Modify: `backend/routes/recipes.js:2` (fix extensionless import)
- (These files already exist as uncommitted working-tree changes and belong to this feature: `backend/server.js`, `backend/routes/recipes.js`)

- [ ] **Step 1: Fix the extensionless import in `backend/routes/recipes.js`**

Line 2 currently reads:

```js
import pool from '../db/postgres'
```

Change it to:

```js
import pool from '../db/postgres.js'
```

- [ ] **Step 2: Start the backend and confirm the route returns seeded data**

From `backend/`:

```bash
npm run dev
```

In a second terminal:

```bash
curl http://localhost:3001/api/recipes
```

Expected: a JSON array of 12 recipe objects with fields `id, name, category, time, servings, calories, protein, fat, carbs, ingredients, instructions` and no `icon` / `accent` keys.

Stop the backend server (Ctrl+C) when done.

- [ ] **Step 3: Commit the route and server wiring**

```bash
git add backend/server.js backend/routes/recipes.js
git commit -m "feat: expose recipe list via /api/recipes"
```

---

### Task 4: Frontend fixed categories + shared style constants

**Files:**
- Create: `frontend/src/data/categories.js`

- [ ] **Step 1: Create `frontend/src/data/categories.js`**

```js
export const categories = [
  'All',
  'Breakfast',
  'Lunch',
  'Dinner',
  'Dessert',
  'Snack',
  'High Protein',
  'Low Carb',
]

export const RECIPE_ICON = 'bowl'
export const RECIPE_ACCENT = '#FFE0B8'
```

- [ ] **Step 2: Verify lint is clean**

From `frontend/`:

```bash
npm run lint
```

Expected: exit 0 with no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/data/categories.js
git commit -m "feat: add fixed categories and shared recipe style constants"
```

---

### Task 5: Frontend `useRecipes` hook and provider

**Files:**
- Create: `frontend/src/hooks/useRecipes.js`

- [ ] **Step 1: Create `frontend/src/hooks/useRecipes.js`**

Fetch once, cache at module scope (so Home ↔ Detail navigation never refetches), de-dupe concurrent fetches (StrictMode double-effect safe), and expose `recipes`, `maxCalories`, `loading`, `error`, `retry`.

```jsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const RecipesContext = createContext(null)

let cachedRecipes = null
let inFlight = null

function fetchRecipes() {
  if (cachedRecipes) return Promise.resolve(cachedRecipes)
  if (!inFlight) {
    inFlight = fetch('/api/recipes')
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
        return res.json()
      })
      .then((data) => {
        cachedRecipes = data
        return data
      })
      .finally(() => {
        inFlight = null
      })
  }
  return inFlight
}

export function RecipesProvider({ children }) {
  const [recipes, setRecipes] = useState(cachedRecipes)
  const [loading, setLoading] = useState(!cachedRecipes)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (cachedRecipes) return
    let active = true
    fetchRecipes()
      .then((data) => {
        if (active) setRecipes(data)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const retry = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchRecipes()
      .then((data) => setRecipes(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const value = useMemo(
    () => {
      const maxCalories = recipes?.length
        ? Math.max(...recipes.map((r) => r.calories))
        : 0
      return { recipes, maxCalories, loading, error, retry }
    },
    [recipes, loading, error, retry],
  )

  return <RecipesContext.Provider value={value}>{children}</RecipesContext.Provider>
}

export default function useRecipes() {
  return useContext(RecipesContext)
}
```

- [ ] **Step 2: Verify lint**

From `frontend/`:

```bash
npm run lint
```

Expected: exit 0. A `react/only-export-components` *warning* for exporting both a component and a hook from this file is acceptable — it is a warning, not an error, and lint still passes.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/useRecipes.js
git commit -m "feat: add useRecipes hook and provider with module cache"
```

---

### Task 6: Wire the provider, Home, Filters, and RecipeCard

**Files:**
- Modify: `frontend/src/App.jsx` (wrap routes in `RecipesProvider`)
- Modify: `frontend/src/pages/Home.jsx`
- Modify: `frontend/src/components/Filters.jsx`
- Modify: `frontend/src/components/RecipeCard.jsx`

- [ ] **Step 1: Wrap routes in `RecipesProvider` in `frontend/src/App.jsx`**

Replace the entire file:

```jsx
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar'
import Home from './pages/Home'
import RecipeDetail from './pages/RecipeDetail'
import useFavourites from './hooks/useFavourites'
import { RecipesProvider } from './hooks/useRecipes'

export default function App() {
  const { favouriteIds, isFavourite, toggleFavourite } = useFavourites()

  return (
    <RecipesProvider>
      <BrowserRouter>
        <NavBar favouriteCount={favouriteIds.length} />
        <Routes>
          <Route
            path="/"
            element={
              <Home
                favouriteIds={favouriteIds}
                isFavourite={isFavourite}
                toggleFavourite={toggleFavourite}
              />
            }
          />
          <Route
            path="/recipe/:id"
            element={
              <RecipeDetail
                isFavourite={isFavourite}
                toggleFavourite={toggleFavourite}
              />
            }
          />
        </Routes>
      </BrowserRouter>
    </RecipesProvider>
  )
}
```

- [ ] **Step 2: Update `frontend/src/pages/Home.jsx`**

Replace the entire file:

```jsx
import { useMemo, useState } from 'react'
import { categories } from '../data/categories'
import useRecipes from '../hooks/useRecipes'
import Filters from '../components/Filters'
import RecipeCard from '../components/RecipeCard'

export default function Home({ favouriteIds, isFavourite, toggleFavourite }) {
  const { recipes, maxCalories, loading, error, retry } = useRecipes()
  const [category, setCategory] = useState(categories[0])
  const [calorieLimit, setCalorieLimit] = useState(null)
  const [showFavourites, setShowFavourites] = useState(false)

  const effectiveLimit = calorieLimit ?? maxCalories

  const visible = useMemo(
    () =>
      (recipes ?? []).filter(
        (r) =>
          (category === 'All' || r.category === category) &&
          r.calories <= effectiveLimit &&
          (!showFavourites || favouriteIds.includes(r.id)),
      ),
    [recipes, category, effectiveLimit, showFavourites, favouriteIds],
  )

  if (loading && !recipes) {
    return (
      <main className="page">
        <div className="empty">
          <span className="empty-emoji" aria-hidden="true">
            ⏳
          </span>
          <p className="empty-title">Loading recipes…</p>
        </div>
      </main>
    )
  }

  if (error && !recipes) {
    return (
      <main className="page">
        <div className="empty">
          <span className="empty-emoji" aria-hidden="true">
            ⚠️
          </span>
          <p className="empty-title">Couldn't load recipes</p>
          <p className="empty-sub">{error}</p>
          <button type="button" className="btn" onClick={retry}>
            Try again
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="page">
      <section className="hero">
        <p className="hero-eyebrow">Considered Cooking</p>
        <h1 className="hero-title">
          recipes with <span className="accent">intention</span>
        </h1>
        <p className="hero-sub">
          Macro-friendly recipes that still satisfy your taste buds.
        </p>
      </section>

      <Filters
        category={category}
        setCategory={setCategory}
        calorieLimit={effectiveLimit}
        setCalorieLimit={setCalorieLimit}
        maxCalories={maxCalories}
        showFavourites={showFavourites}
        setShowFavourites={setShowFavourites}
        favouriteCount={favouriteIds.length}
      />

      {visible.length > 0 ? (
        <div className="grid">
          {visible.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isFavourite={isFavourite}
              toggleFavourite={toggleFavourite}
            />
          ))}
        </div>
      ) : (
        <div className="empty">
          <span className="empty-emoji" aria-hidden="true">
            {showFavourites ? '💛' : '🍽️'}
          </span>
          <p className="empty-title">
            {showFavourites ? 'No favourites yet' : 'Nothing to be found'}
          </p>
          <p className="empty-sub">
            {showFavourites
              ? 'Tap the heart on any recipe to save it here.'
              : 'Adjust the calorie limit or choose another type.'}
          </p>
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 3: Update `frontend/src/components/Filters.jsx`**

Replace the entire file:

```jsx
import { categories } from '../data/categories'

export default function Filters({
  category,
  setCategory,
  calorieLimit,
  setCalorieLimit,
  maxCalories,
  showFavourites,
  setShowFavourites,
  favouriteCount,
}) {
  return (
    <div className="filters">
      <div className="filter-group">
        <span className="filter-label">Type</span>
        <div className="chips" role="group" aria-label="Filter by category">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip ${category === c && !showFavourites ? 'chip--active' : ''}`}
              onClick={() => {
                setShowFavourites(false)
                setCategory(c)
              }}
            >
              {c}
            </button>
          ))}
          <button
            type="button"
            className={`chip chip--fav ${showFavourites ? 'chip--active' : ''}`}
            aria-pressed={showFavourites}
            onClick={() => setShowFavourites((v) => !v)}
          >
            ♥ Favourites{favouriteCount > 0 ? ` (${favouriteCount})` : ''}
          </button>
        </div>
      </div>
      <div className="filter-group filter-group--slider">
        <label className="filter-label" htmlFor="calorie-slider">
          Max calories <span className="slider-value">{calorieLimit} kcal</span>
        </label>
        <input
          id="calorie-slider"
          className="slider"
          type="range"
          min="100"
          max={maxCalories}
          step="10"
          value={calorieLimit}
          onChange={(e) => setCalorieLimit(Number(e.target.value))}
        />
      </div>
    </div>
  )
}
```

Note: `maxCalories` now arrives as a prop instead of an import — the slider `max` stays in effect only after data loads, which the Home loading gate guarantees.

- [ ] **Step 4: Update `frontend/src/components/RecipeCard.jsx` to use the shared constants**

Replace the import and the two usages:

At the top, after the existing imports, add:

```jsx
import { RECIPE_ACCENT, RECIPE_ICON } from '../data/categories'
```

Change line 9:

```jsx
<div className="card" style={{ '--accent': recipe.accent }}>
```

to:

```jsx
<div className="card" style={{ '--accent': RECIPE_ACCENT }}>
```

Change line 17:

```jsx
<RecipeIcon name={recipe.icon} className="dish-icon" />
```

to:

```jsx
<RecipeIcon name={RECIPE_ICON} className="dish-icon" />
```

- [ ] **Step 5: Verify lint and build**

From `frontend/`:

```bash
npm run lint
npm run build
```

Expected: lint exit 0; build succeeds (no `data/recipes.js` import errors remain in these files).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/App.jsx frontend/src/pages/Home.jsx frontend/src/components/Filters.jsx frontend/src/components/RecipeCard.jsx
git commit -m "feat: fetch recipes via provider and filter client-side"
```

---

### Task 7: Update RecipeDetail to consume the API and add async states

**Files:**
- Modify: `frontend/src/pages/RecipeDetail.jsx`

- [ ] **Step 1: Update `frontend/src/pages/RecipeDetail.jsx`**

Replace the entire file:

```jsx
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import useRecipes from '../hooks/useRecipes'
import { RECIPE_ACCENT, RECIPE_ICON } from '../data/categories'
import { matchedIngredientIndexes, stepSegments } from '../utils/ingredients'
import FavButton from '../components/FavButton'
import RecipeIcon from '../components/RecipeIcon'

export default function RecipeDetail({ isFavourite, toggleFavourite }) {
  const { id } = useParams()
  const { recipes, loading, error, retry } = useRecipes()
  const recipe = (recipes ?? []).find((r) => r.id === id)
  const [hoveredStep, setHoveredStep] = useState(null)

  const stepMatches = useMemo(
    () =>
      recipe
        ? recipe.instructions.map((step) => matchedIngredientIndexes(recipe.ingredients, step))
        : [],
    [recipe],
  )

  if (loading && !recipes) {
    return (
      <main className="page">
        <div className="empty">
          <span className="empty-emoji" aria-hidden="true">
            ⏳
          </span>
          <p className="empty-title">Loading recipe…</p>
        </div>
      </main>
    )
  }

  if (error && !recipes) {
    return (
      <main className="page">
        <div className="empty">
          <span className="empty-emoji" aria-hidden="true">
            ⚠️
          </span>
          <p className="empty-title">Couldn't load recipes</p>
          <p className="empty-sub">{error}</p>
          <button type="button" className="btn" onClick={retry}>
            Try again
          </button>
        </div>
      </main>
    )
  }

  if (!recipe) {
    return (
      <main className="page">
        <div className="empty">
          <span className="empty-emoji" aria-hidden="true">🤔</span>
          <p className="empty-title">Not in the archive</p>
          <Link to="/" className="btn">
            Back to All Recipes
          </Link>
        </div>
      </main>
    )
  }

  const activeIngredients = hoveredStep !== null ? stepMatches[hoveredStep] : []

  return (
    <main className="page">
      <Link to="/" className="back-link">← All Recipes</Link>

      <article className="detail" style={{ '--accent': RECIPE_ACCENT }}>
        <div className="detail-hero">
          <div className="detail-emoji" aria-hidden="true">
            <RecipeIcon name={RECIPE_ICON} className="dish-icon" />
          </div>
          <div className="detail-head">
            <div className="detail-head-top">
              <div className="card-tags">
                <span className="chip chip--static">{recipe.category}</span>
                <span className="chip chip--static chip--time">⏱ {recipe.time} min</span>
                <span className="chip chip--static">👥 {recipe.servings} servings</span>
              </div>
              <FavButton
                isFavourite={isFavourite(recipe.id)}
                onToggle={() => toggleFavourite(recipe.id)}
                label={isFavourite(recipe.id) ? `Remove ${recipe.name} from favourites` : `Add ${recipe.name} to favourites`}
              />
            </div>
            <h1 className="detail-title">{recipe.name}</h1>
          </div>
        </div>

        <div className="macro-bar">
          <div className="macro">
            <strong>{recipe.calories}</strong>
            <span>kcal</span>
          </div>
          <div className="macro">
            <strong>{recipe.protein}g</strong>
            <span>protein</span>
          </div>
          <div className="macro">
            <strong>{recipe.fat}g</strong>
            <span>fat</span>
          </div>
          <div className="macro">
            <strong>{recipe.carbs}g</strong>
            <span>carbs</span>
          </div>
        </div>

        <div className="detail-grid">
          <section className="panel">
            <h2 className="panel-title">Ingredients</h2>
            <p className="panel-hint">Hover a step to see what it uses.</p>
            <ul className="ingredients">
              {recipe.ingredients.map((item, i) => (
                <li
                  key={item}
                  className={activeIngredients.includes(i) ? 'is-active' : ''}
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <h2 className="panel-title">Instructions</h2>
            <ol className="steps">
              {recipe.instructions.map((step, i) => (
                <li
                  key={step}
                  className={hoveredStep === i ? 'is-hovered' : ''}
                  onMouseEnter={() => setHoveredStep(i)}
                  onMouseLeave={() => setHoveredStep(null)}
                >
                  <span className="step-num">{i + 1}</span>
                  <p>
                    {stepSegments(step, stepMatches[i], recipe.ingredients).map((seg, j) =>
                      seg.ingredient ? (
                        <mark key={j} className="step-ingredient">{seg.text}</mark>
                      ) : (
                        <span key={j}>{seg.text}</span>
                      ),
                    )}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </article>
    </main>
  )
}
```

- [ ] **Step 2: Verify lint**

From `frontend/`:

```bash
npm run lint
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/RecipeDetail.jsx
git commit -m "feat: load recipe detail from API with async states"
```

---

### Task 8: Vite dev proxy and delete the dead data module

**Files:**
- Modify: `frontend/vite.config.js`
- Delete: `frontend/src/data/recipes.js`

- [ ] **Step 1: Add the `/api` dev proxy to `frontend/vite.config.js`**

Replace the entire file:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
```

- [ ] **Step 2: Confirm no remaining imports of `data/recipes`**

Run from `frontend/src`:

```bash
grep -rn "data/recipes'" . || echo "no references"
```

Expected output: `no references` (Home, Filters, RecipeDetail now import from `data/categories` or `hooks/useRecipes`).

- [ ] **Step 3: Delete `frontend/src/data/recipes.js`**

```bash
rm frontend/src/data/recipes.js
```

- [ ] **Step 4: Verify lint and build**

From `frontend/`:

```bash
npm run lint
npm run build
```

Expected: lint exit 0, build succeeds.

- [ ] **Step 5: Commit**

```bash
git add frontend/vite.config.js
git rm frontend/src/data/recipes.js
git commit -m "feat: proxy /api to backend and remove hardcoded recipe data"
```

---

### Task 9: End-to-end verification

**Files:** none

- [ ] **Step 1: Seed and start the backend**

From `backend/`:

```bash
npm run seed
npm run dev
```

Expected: `Seeded 12 recipes`, then `Connected to PostgreSQL`, `Connected to MongoDB`, and `Bitesize backend listening on port 3001`.

- [ ] **Step 2: Exercise the API**

```bash
curl http://localhost:3001/api/recipes | node -e "let d=''; process.stdin.on('data',c=>d+=c).on('end',()=>{const r=JSON.parse(d); console.log('count:',r.length); console.log('keys:', Object.keys(r[0]).join(','));})"
```

Expected:

```
count: 12
keys: id,name,category,time,servings,calories,protein,fat,carbs,ingredients,instructions
```

- [ ] **Step 3: Run the frontend against the API**

From `frontend/` (keep the backend running):

```bash
npm run dev
```

Open http://localhost:5173 and check:

- Home shows 12 recipe cards (all using the same `bowl` icon and `#FFE0B8` accent).
- Category chips read `All, Breakfast, Lunch, Dinner, Dessert, Snack, High Protein, Low Carb`.
- Clicking `Lunch` shows the two reassigned bowls; `Snack` shows Nutty Energy Bites + Spiced Roasted Chickpeas.
- Clicking a recipe opens `/recipe/<id>` (e.g. `/recipe/sunday-pancakes`), renders detail with styling intact, and the ingredient/instruction hover highlighting still works.
- Navigating back to Home does **not** trigger a second network fetch of `/api/recipes` (check the Network tab — only one request).
- A recipe card heart toggle persists across reloads (favourites still in localStorage).
- Calorie slider max equals the highest-calorie recipe (540 kcal — the Harissa Chicken Rice Bowl).

- [ ] **Step 4: Verify error handling**

Stop the backend, then refresh the frontend. Expected: Home shows the "Couldn't load recipes" message with a "Try again" button. Start the backend again, click "Try again", recipes load.

---

## Self-Review Notes

**Spec coverage:**

| Spec requirement | Task |
| --- | --- |
| Seed data moved to `backend/data/recipes.js`, icon/accent stripped | Task 1 |
| Reassign Veg → Lunch; add 2 Snack recipes; 12 total | Task 1 |
| Idempotent seed script + `npm run seed` | Task 2 |
| `GET /api/recipes` returns all rows, no params | Task 3 |
| Delete `frontend/src/data/recipes.js` | Task 8 |
| Fixed categories file (exact order) | Task 4 |
| Shared single icon + accent constants | Task 4, 6, 7 |
| `RecipesProvider` + `useRecipes`, module cache | Task 5 |
| App wraps routes; Home/Filters/Detail consume hook | Task 6, 7 |
| `maxCalories` derived client-side | Task 5 |
| Vite `/api` proxy | Task 8 |
| Loading + error-with-retry states | Task 6, 7 |
| Verification: lint, build, seed, curl, manual browser | Task 3, 9 |
| No test framework | all tasks |

**Placeholder scan:** Every code block contains complete runnable code; verification commands include exact expected output. The only soft spots are Steps 2 of Task 1 and 9 verification, which depend on previously-seeded data.

**Type consistency:** `useRecipes()` exposes `{ recipes, maxCalories, loading, error, retry }` exactly once (Task 5); all consumers (Tasks 6, 7) destructure the same names. `Filter` props match what Home passes: `category, setCategory, calorieLimit, setCalorieLimit, maxCalories, showFavourites, setShowFavourites, favouriteCount`. `categories`, `RECIPE_ICON`, `RECIPE_ACCENT` are defined in Task 4 and imported in Tasks 6–7 with identical names.