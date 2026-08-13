import express from 'express'
import pool from '../db/postgres.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM recipes')
    res.json(result.rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
})

export default router;
