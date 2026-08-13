import { BrowserRouter, Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar'
import Home from './pages/Home'
import RecipeDetail from './pages/RecipeDetail'
import useFavourites from './hooks/useFavourites'

export default function App() {
  const { favouriteIds, isFavourite, toggleFavourite } = useFavourites()

  return (
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
  )
}
