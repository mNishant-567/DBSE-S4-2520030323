import { pool } from "../config/database.js";

function notFound() {
  const error = new Error("Record not found");
  error.status = 404;
  return error;
}

export async function getPlanPatient(planId) {
  const result = await pool.query(
    `SELECT tp.plan_id, d.patient_id, d.doctor_id
     FROM treatment_plans tp JOIN diagnoses d ON d.diagnosis_id = tp.diagnosis_id
     WHERE tp.plan_id = $1`,
    [planId]
  );
  return result.rows[0] || null;
}

export async function assertPlanAccess(planId, user) {
  const plan = await getPlanPatient(planId);
  if (!plan) throw notFound();
  if (user.role === "admin" ||
      (user.role === "patient" && user.patientId === plan.patient_id) ||
      (user.role === "doctor" && user.doctorId === plan.doctor_id)) return plan;
  throw notFound();
}

export async function assertPatientAccess(patientId, user) {
  if (user.role === "admin" || (user.role === "patient" && user.patientId === patientId)) return;
  if (user.role === "doctor") {
    const result = await pool.query(
      "SELECT 1 FROM diagnoses WHERE patient_id = $1 AND doctor_id = $2 LIMIT 1",
      [patientId, user.doctorId]
    );
    if (result.rowCount) return;
  }
  throw notFound();
}

export async function patientIdsForDoctor(doctorId) {
  const result = await pool.query(
    "SELECT DISTINCT patient_id FROM diagnoses WHERE doctor_id = $1",
    [doctorId]
  );
  return result.rows.map(row => row.patient_id);
}