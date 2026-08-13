import { MongoClient } from "mongodb";
import "dotenv/config";
console.log(process.env.MONGODB_URI);
const client = new MongoClient(process.env.MONGODB_URI);

let db;

export async function connectMongo() {
  await client.connect();
  db = client.db("bitesize");

  console.log("Connected to MongoDB");
}

export function getMongoDB() {
  return db;
}