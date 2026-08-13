import "dotenv/config";
import express from "express";
import pool from "./db/postgres.js";
import { connectMongo } from "./db/mongodb.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get("/api/health", async (req, res) => {
  res.json({
    status: "ok",
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