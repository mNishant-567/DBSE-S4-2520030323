import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/database.js";

function publicUser(user) {
  return {
    id: user.user_id,
    email: user.email,
    role: user.role,
    patientId: user.patient_id,
    doctorId: user.doctor_id
  };
}

function issueToken(user) {
  return jwt.sign({
    role: user.role,
    patientId: user.patient_id,
    doctorId: user.doctor_id
  }, process.env.JWT_SECRET, {
    subject: user.user_id,
    expiresIn: process.env.JWT_EXPIRES_IN || "8h"
  });
}

export async function registerPatient(req, res) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const patient = await client.query(
      `INSERT INTO patients (name, dob, gender, phone, address)
       VALUES ($1, $2, $3, $4, $5) RETURNING patient_id`,
      [req.body.name, req.body.dob || null, req.body.gender || null,
        req.body.phone || null, req.body.address || null]
    );
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const result = await client.query(
      `INSERT INTO app_users (email, password_hash, role, patient_id)
       VALUES (lower($1), $2, 'patient', $3)
       RETURNING user_id, email, role, patient_id, doctor_id`,
      [req.body.email, passwordHash, patient.rows[0].patient_id]
    );
    await client.query("COMMIT");
    res.status(201).json({ user: publicUser(result.rows[0]), token: issueToken(result.rows[0]) });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function login(req, res) {
  const result = await pool.query(
    `SELECT user_id, email, password_hash, role, patient_id, doctor_id
     FROM app_users WHERE email = lower($1)`,
    [req.body.email]
  );
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(req.body.password, user.password_hash))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  return res.json({ user: publicUser(user), token: issueToken(user) });
}

export async function me(req, res) {
  const result = await pool.query(
    `SELECT user_id, email, role, patient_id, doctor_id
     FROM app_users WHERE user_id = $1`,
    [req.user.id]
  );
  if (!result.rowCount) return res.status(401).json({ error: "User account no longer exists" });
  return res.json({ user: publicUser(result.rows[0]) });
}

export async function createStaffUser(req, res) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const doctor = await client.query(
      `INSERT INTO doctors (name, specialization, phone)
       VALUES ($1, $2, $3) RETURNING doctor_id`,
      [req.body.name, req.body.specialization || null, req.body.phone || null]
    );
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const result = await client.query(
      `INSERT INTO app_users (email, password_hash, role, doctor_id)
       VALUES (lower($1), $2, 'doctor', $3)
       RETURNING user_id, email, role, patient_id, doctor_id`,
      [req.body.email, passwordHash, doctor.rows[0].doctor_id]
    );
    await client.query("COMMIT");
    return res.status(201).json({ user: publicUser(result.rows[0]) });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}