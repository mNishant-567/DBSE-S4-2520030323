import Joi from "joi";
import MedicalTest from "../models/MedicalTest.js";
import Symptom from "../models/Symptom.js";
import FollowUp from "../models/FollowUp.js";
import Notification from "../models/Notification.js";
import { assertPlanAccess, patientIdsForDoctor } from "../services/access.js";
import { pool } from "../config/database.js";

const uuid = Joi.string().guid({ version: ["uuidv4", "uuidv5"] });
const shortText = max => Joi.string().trim().min(1).max(max);
const shared = { plan_id: uuid, patient_id: uuid };

export const documentResources = {
  "medical-tests": {
    model: MedicalTest,
    fields: { ...shared, test_name: shortText(160), test_date: Joi.date().iso(), result: Joi.any().required() },
    required: ["plan_id", "patient_id", "test_name", "test_date", "result"],
    createRoles: ["doctor", "admin"], updateRoles: ["doctor", "admin"], deleteRoles: ["doctor", "admin"]
  },
  symptoms: {
    model: Symptom,
    fields: { ...shared, description: shortText(2000), severity: Joi.number().integer().min(1).max(5), reported_date: Joi.date().iso(), is_side_effect: Joi.boolean() },
    required: ["plan_id", "patient_id", "description", "severity"],
    createRoles: ["patient", "doctor", "admin"], updateRoles: ["doctor", "admin"], deleteRoles: ["patient", "doctor", "admin"]
  },
  "follow-ups": {
    model: FollowUp,
    fields: { ...shared, followup_date: Joi.date().iso(), notes: Joi.string().max(3000).allow(""), status: Joi.string().valid("scheduled", "completed", "cancelled") },
    required: ["plan_id", "patient_id", "followup_date"],
    createRoles: ["patient", "doctor", "admin"], updateRoles: ["patient", "doctor", "admin"], deleteRoles: ["patient", "doctor", "admin"]
  },
  notifications: {
    model: Notification,
    fields: { recipient_id: uuid, recipient_role: Joi.string().valid("patient", "doctor", "admin"), type: shortText(80), title: shortText(200), message: shortText(2000), metadata: Joi.object().unknown(true), read_at: Joi.date().iso().allow(null) },
    required: ["recipient_id", "recipient_role", "type", "title", "message"],
    createRoles: ["doctor", "admin"], updateRoles: ["patient", "doctor", "admin"], deleteRoles: ["admin"]
  }
};

export function documentSchema(resource, partial = false) {
  const fields = partial
    ? Object.fromEntries(Object.entries(resource.fields).filter(([name]) => !["plan_id", "patient_id", "recipient_id", "recipient_role"].includes(name)))
    : resource.fields;
  const schema = Joi.object(fields).unknown(false);
  if (partial) return schema.min(1);
  return schema.fork(resource.required.filter(field => field !== "patient_id"), item => item.required());
}

async function queryForUser(user) {
  if (user.role === "admin") return {};
  if (user.role === "patient") return { patient_id: user.patientId };
  return { patient_id: { $in: await patientIdsForDoctor(user.doctorId) } };
}

export function createDocumentHandlers(name) {
  const resource = documentResources[name];
  const { model } = resource;

  async function list(req, res) {
    const query = name === "notifications" && req.user.role !== "admin"
      ? { recipient_id: req.user.id }
      : await queryForUser(req.user);
    if (name !== "notifications" && req.query.patient_id && req.user.role === "admin") {
      query.patient_id = req.query.patient_id;
    }
    if (req.query.plan_id && name !== "notifications") query.plan_id = req.query.plan_id;
    const records = await model.find(query).sort({ created_at: -1 }).limit(200).lean();
    return res.json(records);
  }

  async function get(req, res) {
    const query = name === "notifications" && req.user.role !== "admin"
      ? { recipient_id: req.user.id }
      : await queryForUser(req.user);
    const record = await model.findOne({ _id: req.params.id, ...query }).lean();
    if (!record) return res.status(404).json({ error: "Record not found" });
    return res.json(record);
  }

  async function create(req, res) {
    const values = { ...req.body };
    if (name === "symptoms" && req.user.role === "patient") values.patient_id = req.user.patientId;
    if (name === "notifications" && req.user.role === "doctor") {
      const recipient = await pool.query(
        `SELECT 1 FROM app_users u JOIN diagnoses d ON d.patient_id = u.patient_id
         WHERE u.user_id = $1 AND u.role = 'patient' AND d.doctor_id = $2 LIMIT 1`,
        [values.recipient_id, req.user.doctorId]
      );
      if (!recipient.rowCount) return res.status(404).json({ error: "Patient account not found" });
      values.recipient_role = "patient";
    }
    if (values.plan_id) {
      const plan = await assertPlanAccess(values.plan_id, req.user);
      if (values.patient_id && values.patient_id !== plan.patient_id) {
        return res.status(400).json({ error: "patient_id does not match the treatment plan" });
      }
      values.patient_id = plan.patient_id;
    }
    const record = await model.create(values);
    return res.status(201).json(record);
  }

  async function update(req, res) {
    const query = name === "notifications" && req.user.role !== "admin"
      ? { recipient_id: req.user.id }
      : await queryForUser(req.user);
    const record = await model.findOneAndUpdate(
      { _id: req.params.id, ...query }, req.body,
      { new: true, runValidators: true, context: "query" }
    );
    if (!record) return res.status(404).json({ error: "Record not found" });
    return res.json(record);
  }

  async function remove(req, res) {
    const query = name === "notifications" && req.user.role !== "admin"
      ? { recipient_id: req.user.id }
      : await queryForUser(req.user);
    const record = await model.findOneAndDelete({ _id: req.params.id, ...query });
    if (!record) return res.status(404).json({ error: "Record not found" });
    return res.json({ deleted: true, id: record._id });
  }

  return { list, get, create, update, remove };
}