import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { pool } from "../config/database.js";

const migrationPath = new URL("../migrations/001_initial.sql", import.meta.url);

try {
  const sql = await readFile(fileURLToPath(migrationPath), "utf8");
  await pool.query(sql);
  console.log("PostgreSQL schema is up to date.");
} catch (error) {
  console.error("Database migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}