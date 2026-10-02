import { Router } from "express";
import Joi from "joi";
import asyncHandler from "../middleware/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  bookAppointment, bookFollowUp, cancelAppointment, cancelFollowUp,
  listFollowUps, patientClinicalReports, patientSchedule,
  submitSymptom, upsertTreatmentPlan
} from "../controllers/workflowController.js";

const router = Router();
const uuid = Joi.string().guid({ version: ["uuidv4", "uuidv5"] });
const prescription = Joi.object({
  medication_id: uuid.required(),
  dosage: Joi.string().trim().min(1).max(120).required(),
  frequency: Joi.string().trim().min(1).max(120).required(),
  duration: Joi.string().max(120).allow(null, "")
}).unknown(false);

router.get("/me/schedule", authenticate, authorize("patient"), asyncHandler(patientSchedule));
router.put("/patients/:patientId/treatment-plan", authenticate, authorize("doctor", "admin"), validate(Joi.object({
  patient_id: uuid.required(),
  diagnosis_id: uuid,
  doctor_id: uuid,
  disease_id: uuid.required(),
  diagnosis_date: Joi.date().iso().required(),
  diagnosis_status: Joi.string().max(40),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().allow(null),
  status: Joi.string().max(40),
  prescriptions: Joi.array().items(prescription).max(50)
}).required()), asyncHandler((req, res) => {
  if (req.body.patient_id !== req.params.patientId) {
    const error = new Error("patient_id must match the route patientId");
    error.status = 400;
    throw error;
  }
  return upsertTreatmentPlan(req, res);
}));
router.get("/patients/:patientId/clinical-reports", authenticate, authorize("doctor", "admin"), asyncHandler(patientClinicalReports));
router.post("/appointments", authenticate, authorize("patient", "doctor", "admin"), validate(Joi.object({
  patient_id: uuid,
  doctor_id: uuid,
  appt_datetime: Joi.date().iso().greater("now").required()
}).required()), asyncHandler(bookAppointment));
router.patch("/appointments/:appointmentId/cancel", authenticate, authorize("patient", "doctor", "admin"), asyncHandler(cancelAppointment));
router.post("/symptom-reports", authenticate, authorize("patient"), validate(Joi.object({
  plan_id: uuid.required(),
  description: Joi.string().trim().min(1).max(2000).required(),
  severity: Joi.number().integer().min(1).max(5).required(),
  reported_date: Joi.date().iso(),
  is_side_effect: Joi.boolean().default(false)
}).required()), asyncHandler(submitSymptom));
router.get("/treatment-plans/:planId/follow-ups", authenticate, asyncHandler(listFollowUps));
router.post("/treatment-plans/:planId/follow-ups", authenticate, validate(Joi.object({
  followup_date: Joi.date().iso().greater("now").required(),
  notes: Joi.string().max(3000).allow("")
}).required()), asyncHandler(bookFollowUp));
router.patch("/follow-ups/:followUpId/cancel", authenticate, asyncHandler(cancelFollowUp));

export default router;