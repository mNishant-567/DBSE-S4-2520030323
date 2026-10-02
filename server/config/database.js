import pg from "pg";
import mongoose from "mongoose";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined
});

export async function connectDatabases() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters");
  }

  await pool.query("SELECT 1");
  await mongoose.connect(process.env.MONGODB_URI);
}

export async function closeDatabases() {
  await Promise.all([pool.end(), mongoose.disconnect()]);
}