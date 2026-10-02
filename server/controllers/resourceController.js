import Joi from "joi";
import { pool } from "../config/database.js";
import { assertPatientAccess } from "../services/access.js";

const uuid = Joi.string().guid({ version: ["uuidv4", "uuidv5"] });
const text = (max = 1000) => Joi.string().trim().max(max).allow(null, "");

export const resources = {
  patients: {
    table: "patients", key: "patient_id", scope: "patient",
    fields: { name: text(160), dob: Joi.date().iso().allow(null), gender: text(40), phone: text(40), address: text() },
    required: ["name"], createRoles: ["admin"], updateRoles: ["admin"], deleteRoles: ["admin"]
  },
  doctors: {
    table: "doctors", key: "doctor_id", scope: "global",
    fields: { name: text(160), specialization: text(160), phone: text(40) },
    required: ["name"], createRoles: ["admin"], updateRoles: ["admin"], deleteRoles: ["admin"]
  },
  diseases: {
    table: "diseases", key: "disease_id", scope: "global",
    fields: { disease_name: Joi.string().trim().min(1).max(160), description: text() },
    required: ["disease_name"], createRoles: ["admin"], updateRoles: ["admin"], deleteRoles: ["admin"]
  },
  diagnoses: {
    table: "diagnoses", key: "diagnosis_id", scope: "diagnosis",
    fields: { patient_id: uuid, disease_id: uuid, doctor_id: uuid, diagnosis_date: Joi.date().iso(), status: Joi.string().trim().max(40) },
    updateFields: ["disease_id", "diagnosis_date", "status"],
    required: ["patient_id", "disease_id", "doctor_id", "diagnosis_date"], createRoles: ["doctor", "admin"], updateRoles: ["doctor", "admin"], deleteRoles: ["doctor", "admin"]
  },
  "treatment-plans": {
    table: "treatment_plans", key: "plan_id", scope: "plan",
    fields: { diagnosis_id: uuid, start_date: Joi.date().iso(), end_date: Joi.date().iso().allow(null), status: Joi.string().trim().max(40) },
    updateFields: ["start_date", "end_date", "status"],
    required: ["diagnosis_id", "start_date"], createRoles: ["doctor", "admin"], updateRoles: ["doctor", "admin"], deleteRoles: ["doctor", "admin"]
  },
  medications: {
    table: "medications", key: "medication_id", scope: "global",
    fields: { med_name: Joi.string().trim().min(1).max(160), dosage_form: text(100) },
    required: ["med_name"], createRoles: ["admin"], updateRoles: ["admin"], deleteRoles: ["admin"]
  },
  prescriptions: {
    table: "prescriptions", key: ["plan_id", "medication_id"], scope: "prescription",
    fields: { plan_id: uuid, medication_id: uuid, dosage: Joi.string().trim().min(1).max(120), frequency: Joi.string().trim().min(1).max(120), duration: text(120) },
    updateFields: ["dosage", "frequency", "duration"],
    required: ["plan_id", "medication_id", "dosage", "frequency"], createRoles: ["doctor", "admin"], updateRoles: ["doctor", "admin"], deleteRoles: ["doctor", "admin"]
  },
  appointments: {
    table: "appointments", key: "appointment_id", scope: "appointment",
    fields: { patient_id: uuid, doctor_id: uuid, appt_datetime: Joi.date().iso(), status: Joi.string().trim().max(40) },
    updateFields: ["appt_datetime", "status"],
    required: ["doctor_id", "appt_datetime"], createRoles: ["patient", "doctor", "admin"], updateRoles: ["doctor", "admin"], deleteRoles: ["admin"]
  }
};

function scopeFor(resource, user, offset = 0) {
  if (user.role === "admin" || resource.scope === "global") return { sql: "TRUE", params: [] };
  const value = user.role === "patient" ? user.patientId : user.doctorId;
  const placeholder = `$${offset + 1}`;
  const conditions = {
    patient: user.role === "patient"
      ? `r.patient_id = ${placeholder}`
      : `EXISTS (SELECT 1 FROM diagnoses d WHERE d.patient_id = r.patient_id AND d.doctor_id = ${placeholder})`,
    diagnosis: `r.${user.role === "patient" ? "patient_id" : "doctor_id"} = ${placeholder}`,
    plan: `EXISTS (SELECT 1 FROM diagnoses d WHERE d.diagnosis_id = r.diagnosis_id AND d.${user.role === "patient" ? "patient_id" : "doctor_id"} = ${placeholder})`,
    prescription: `EXISTS (SELECT 1 FROM treatment_plans tp JOIN diagnoses d ON d.diagnosis_id = tp.diagnosis_id WHERE tp.plan_id = r.plan_id AND d.${user.role === "patient" ? "patient_id" : "doctor_id"} = ${placeholder})`,
    appointment: `r.${user.role === "patient" ? "patient_id" : "doctor_id"} = ${placeholder}`
  };
  return { sql: conditions[resource.scope] || "FALSE", params: [value] };
}

export function bodySchema(resource, partial = false) {
  const fields = partial && resource.updateFields
    ? Object.fromEntries(resource.updateFields.map(name => [name, resource.fields[name]]))
    : resource.fields;
  const schema = Joi.object(fields).unknown(false);
  return partial ? schema.min(1) : schema;
}

function assignIdentity(resourceName, user, values) {
  const result = { ...values };
  if (resourceName === "diagnoses" && user.role === "doctor") result.doctor_id = user.doctorId;
  if (resourceName === "appointments") {
    if (user.role === "patient") result.patient_id = user.patientId;
    if (user.role === "doctor") result.doctor_id = user.doctorId;
  }
  return result;
}

function accessibleWhere(resource, user, initialOffset = 0) {
  return scopeFor(resource, user, initialOffset);
}

export function createResourceHandlers(resourceName) {
  const resource = resources[resourceName];
  const { table, key } = resource;

  async function list(req, res) {
    const { sql, params } = accessibleWhere(resource, req.user);
    const result = await pool.query(
      `SELECT r.* FROM ${table} r WHERE ${sql} ORDER BY r.created_at DESC LIMIT 200`, params
    );
    return res.json(result.rows);
  }

  async function get(req, res) {
    const values = Array.isArray(key) ? [req.params.planId, req.params.medicationId] : [req.params.id];
    const predicates = (Array.isArray(key) ? key : [key]).map((field, index) => `r.${field} = $${index + 1}`);
    const { sql, params } = accessibleWhere(resource, req.user, values.length);
    const result = await pool.query(
      `SELECT r.* FROM ${table} r WHERE ${[...predicates, sql].join(" AND ")}`,
      [...values, ...params]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Record not found" });
    return res.json(result.rows[0]);
  }

  async function create(req, res) {
    const values = assignIdentity(resourceName, req.user, req.body);
    const missing = resource.required.filter(field => values[field] === undefined || values[field] === null);
    if (missing.length) return res.status(400).json({ error: `Required fields: ${missing.join(", ")}` });
    if (resourceName === "appointments" && !values.patient_id) {
      return res.status(400).json({ error: "patient_id is required" });
    }
    if (resourceName === "appointments" && req.user.role === "doctor") {
      await assertPatientAccess(values.patient_id, req.user);
    }
    if (resourceName === "treatment-plans" && req.user.role === "doctor") {
      const access = await pool.query(
        "SELECT 1 FROM diagnoses WHERE diagnosis_id = $1 AND doctor_id = $2",
        [values.diagnosis_id, req.user.doctorId]
      );
      if (!access.rowCount) return res.status(404).json({ error: "Diagnosis not found" });
    }
    if (resourceName === "prescriptions" && req.user.role === "doctor") {
      const access = await pool.query(
        `SELECT 1 FROM treatment_plans tp JOIN diagnoses d ON d.diagnosis_id = tp.diagnosis_id
         WHERE tp.plan_id = $1 AND d.doctor_id = $2`,
        [values.plan_id, req.user.doctorId]
      );
      if (!access.rowCount) return res.status(404).json({ error: "Treatment plan not found" });
    }
    const fields = Object.keys(values);
    const result = await pool.query(
      `INSERT INTO ${table} (${fields.join(", ")}) VALUES (${fields.map((_, index) => `$${index + 1}`).join(", ")}) RETURNING *`,
      fields.map(field => values[field])
    );
    return res.status(201).json(result.rows[0]);
  }

  async function update(req, res) {
    const values = assignIdentity(resourceName, req.user, req.body);
    const fields = Object.keys(values);
    const ids = Array.isArray(key) ? [req.params.planId, req.params.medicationId] : [req.params.id];
    const idPredicates = (Array.isArray(key) ? key : [key]).map((field, index) => `r.${field} = $${index + 1}`);
    const setClauses = fields.map((field, index) => `${field} = $${ids.length + index + 1}`);
    setClauses.push("updated_at = now()");
    const { sql, params } = accessibleWhere(resource, req.user, ids.length + fields.length);
    const result = await pool.query(
      `UPDATE ${table} r SET ${setClauses.join(", ")} WHERE ${[...idPredicates, sql].join(" AND ")} RETURNING r.*`,
      [...ids, ...fields.map(field => values[field]), ...params]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Record not found" });
    return res.json(result.rows[0]);
  }

  async function remove(req, res) {
    const ids = Array.isArray(key) ? [req.params.planId, req.params.medicationId] : [req.params.id];
    const idPredicates = (Array.isArray(key) ? key : [key]).map((field, index) => `r.${field} = $${index + 1}`);
    const { sql, params } = accessibleWhere(resource, req.user, ids.length);
    const result = await pool.query(
      `DELETE FROM ${table} r WHERE ${[...idPredicates, sql].join(" AND ")} RETURNING r.*`,
      [...ids, ...params]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Record not found" });
    return res.json(result.rows[0]);
  }

  return { list, get, create, update, remove };
}