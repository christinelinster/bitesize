import { useMemo, useState } from 'react'
import { recipes, categories, maxCalories } from '../data/recipes'
import Filters from '../components/Filters'
import RecipeCard from '../components/RecipeCard'

export default function Home({ favouriteIds, isFavourite, toggleFavourite }) {
  const [category, setCategory] = useState(categories[0])
  const [calorieLimit, setCalorieLimit] = useState(maxCalories)
  const [showFavourites, setShowFavourites] = useState(false)

  const visible = useMemo(
    () =>
      recipes.filter(
        (r) =>
          (category === 'All' || r.category === category) &&
          r.calories <= calorieLimit &&
          (!showFavourites || favouriteIds.includes(r.id)),
      ),
    [category, calorieLimit, showFavourites, favouriteIds],
  )

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
        calorieLimit={calorieLimit}
        setCalorieLimit={setCalorieLimit}
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
