import "dotenv/config";
import bcrypt from "bcryptjs";
import { pool } from "../config/database.js";

try {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 10) {
    throw new Error("Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 10 characters");
  }

  const existing = await pool.query("SELECT user_id, role FROM app_users WHERE email = $1", [email]);
  if (existing.rowCount && existing.rows[0].role !== "admin") {
    throw new Error("ADMIN_EMAIL is already assigned to a non-admin account");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  if (existing.rowCount) {
    await pool.query("UPDATE app_users SET password_hash = $1 WHERE user_id = $2", [passwordHash, existing.rows[0].user_id]);
  } else {
    await pool.query(
      "INSERT INTO app_users (email, password_hash, role) VALUES ($1, $2, 'admin')",
      [email, passwordHash]
    );
  }
  await pool.query(
    `INSERT INTO diseases (disease_name, description)
     VALUES ('Type 2 Diabetes', 'A chronic metabolic disease requiring ongoing treatment monitoring.')
     ON CONFLICT (disease_name) DO NOTHING`
  );
  console.log(`Seeded administrator account ${email} and baseline disease data.`);
} catch (error) {
  console.error("Database seed failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}