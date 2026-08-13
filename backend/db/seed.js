import pool from "./postgres.js";
import { recipes } from "../data/recipes.js";

async function seed() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS recipes (
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
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO NOTHING`,
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
