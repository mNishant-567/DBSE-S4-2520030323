import { pool } from "../config/database.js";
import MedicalTest from "../models/MedicalTest.js";
import Symptom from "../models/Symptom.js";
import FollowUp from "../models/FollowUp.js";
import { assertPatientAccess, assertPlanAccess } from "../services/access.js";

export async function upsertTreatmentPlan(req, res) {
  const { patient_id, diagnosis_id, disease_id, diagnosis_date, diagnosis_status, start_date, end_date, status, prescriptions = [] } = req.body;
  const doctorId = req.user.role === "doctor" ? req.user.doctorId : req.body.doctor_id;
  if (!doctorId) {
    const error = new Error("doctor_id is required for an administrator");
    error.status = 400;
    throw error;
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let resolvedDiagnosisId = diagnosis_id;

    if (resolvedDiagnosisId) {
      const current = await client.query(
        "SELECT diagnosis_id, patient_id, doctor_id FROM diagnoses WHERE diagnosis_id = $1 FOR UPDATE",
        [resolvedDiagnosisId]
      );
      if (!current.rowCount || current.rows[0].patient_id !== patient_id ||
          (req.user.role === "doctor" && current.rows[0].doctor_id !== req.user.doctorId)) {
        const error = new Error("Diagnosis not found for this patient");
        error.status = 404;
        throw error;
      }
      await client.query(
        `UPDATE diagnoses SET disease_id = $1, diagnosis_date = $2, status = $3, updated_at = now()
         WHERE diagnosis_id = $4`,
        [disease_id, diagnosis_date, diagnosis_status || "active", resolvedDiagnosisId]
      );
    } else {
      const diagnosis = await client.query(
        `INSERT INTO diagnoses (patient_id, disease_id, doctor_id, diagnosis_date, status)
         VALUES ($1, $2, $3, $4, $5) RETURNING diagnosis_id`,
        [patient_id, disease_id, doctorId, diagnosis_date, diagnosis_status || "active"]
      );
      resolvedDiagnosisId = diagnosis.rows[0].diagnosis_id;
    }

    const plan = await client.query(
      `INSERT INTO treatment_plans (diagnosis_id, start_date, end_date, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (diagnosis_id) DO UPDATE SET
         start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date,
         status = EXCLUDED.status, updated_at = now()
       RETURNING *`,
      [resolvedDiagnosisId, start_date, end_date || null, status || "active"]
    );

    if (Object.hasOwn(req.body, "prescriptions")) {
      await client.query("DELETE FROM prescriptions WHERE plan_id = $1", [plan.rows[0].plan_id]);
      for (const prescription of prescriptions) {
        await client.query(
          `INSERT INTO prescriptions (plan_id, medication_id, dosage, frequency, duration)
           VALUES ($1, $2, $3, $4, $5)`,
          [plan.rows[0].plan_id, prescription.medication_id, prescription.dosage,
            prescription.frequency, prescription.duration || null]
        );
      }
    }
    await client.query("COMMIT");

    const details = await pool.query(
      `SELECT tp.*, d.patient_id, d.disease_id, d.doctor_id, d.diagnosis_date,
              COALESCE(json_agg(json_build_object(
                'medication_id', pr.medication_id, 'med_name', m.med_name,
                'dosage', pr.dosage, 'frequency', pr.frequency, 'duration', pr.duration
              )) FILTER (WHERE pr.plan_id IS NOT NULL), '[]') AS prescriptions
       FROM treatment_plans tp
       JOIN diagnoses d ON d.diagnosis_id = tp.diagnosis_id
       LEFT JOIN prescriptions pr ON pr.plan_id = tp.plan_id
       LEFT JOIN medications m ON m.medication_id = pr.medication_id
       WHERE tp.plan_id = $1
       GROUP BY tp.plan_id, d.patient_id, d.disease_id, d.doctor_id, d.diagnosis_date`,
      [plan.rows[0].plan_id]
    );
    return res.status(diagnosis_id ? 200 : 201).json(details.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function patientSchedule(req, res) {
  const patientId = req.user.patientId;
  const [appointments, plans] = await Promise.all([
    pool.query(
      `SELECT a.*, d.name AS doctor_name, d.specialization
       FROM appointments a JOIN doctors d ON d.doctor_id = a.doctor_id
       WHERE a.patient_id = $1 AND a.status <> 'cancelled'
       ORDER BY a.appt_datetime ASC`, [patientId]
    ),
    pool.query(
      `SELECT tp.*, dg.disease_id, ds.disease_name, dg.doctor_id
       FROM treatment_plans tp JOIN diagnoses dg ON dg.diagnosis_id = tp.diagnosis_id
       JOIN diseases ds ON ds.disease_id = dg.disease_id
       WHERE dg.patient_id = $1 ORDER BY tp.start_date DESC`, [patientId]
    )
  ]);
  const planIds = plans.rows.map(plan => plan.plan_id);
  const prescriptions = planIds.length
    ? await pool.query(
      `SELECT pr.*, m.med_name, m.dosage_form FROM prescriptions pr
       JOIN medications m ON m.medication_id = pr.medication_id
       WHERE pr.plan_id = ANY($1::uuid[])`, [planIds]
    )
    : { rows: [] };
  return res.json({
    appointments: appointments.rows,
    treatment_plans: plans.rows.map(plan => ({
      ...plan,
      prescriptions: prescriptions.rows.filter(item => item.plan_id === plan.plan_id)
    }))
  });
}

export async function submitSymptom(req, res) {
  const plan = await assertPlanAccess(req.body.plan_id, req.user);
  if (req.user.role === "patient" && plan.patient_id !== req.user.patientId) {
    return res.status(404).json({ error: "Treatment plan not found" });
  }
  const symptom = await Symptom.create({
    ...req.body,
    patient_id: req.user.patientId,
    reported_date: req.body.reported_date || new Date()
  });
  return res.status(201).json(symptom);
}

export async function patientClinicalReports(req, res) {
  await assertPatientAccess(req.params.patientId, req.user);
  const [symptoms, medicalTests] = await Promise.all([
    Symptom.find({ patient_id: req.params.patientId }).sort({ reported_date: -1 }).lean(),
    MedicalTest.find({ patient_id: req.params.patientId }).sort({ test_date: -1 }).lean()
  ]);
  return res.json({ symptoms, medical_tests: medicalTests });
}

export async function bookAppointment(req, res) {
  const patientId = req.user.role === "patient" ? req.user.patientId : req.body.patient_id;
  const doctorId = req.user.role === "doctor" ? req.user.doctorId : req.body.doctor_id;
  if (!doctorId) {
    const error = new Error("doctor_id is required for an administrator");
    error.status = 400;
    throw error;
  }
  if (!patientId || !doctorId) {
    return res.status(400).json({ error: "patient_id and doctor_id are required" });
  }
  if (req.user.role === "doctor") await assertPatientAccess(patientId, req.user);
  const result = await pool.query(
    `INSERT INTO appointments (patient_id, doctor_id, appt_datetime, status)
     VALUES ($1, $2, $3, 'scheduled') RETURNING *`,
    [patientId, doctorId, req.body.appt_datetime]
  );
  return res.status(201).json(result.rows[0]);
}

export async function cancelAppointment(req, res) {
  const values = [req.params.appointmentId];
  let scope = "TRUE";
  if (req.user.role === "patient") {
    values.push(req.user.patientId);
    scope = `patient_id = $${values.length}`;
  } else if (req.user.role === "doctor") {
    values.push(req.user.doctorId);
    scope = `doctor_id = $${values.length}`;
  }
  const result = await pool.query(
    `UPDATE appointments SET status = 'cancelled', updated_at = now()
     WHERE appointment_id = $1 AND ${scope} AND status = 'scheduled' RETURNING *`, values
  );
  if (!result.rowCount) return res.status(404).json({ error: "Scheduled appointment not found" });
  return res.json(result.rows[0]);
}

export async function bookFollowUp(req, res) {
  const plan = await assertPlanAccess(req.params.planId, req.user);
  const followUp = await FollowUp.create({
    plan_id: plan.plan_id,
    patient_id: plan.patient_id,
    followup_date: req.body.followup_date,
    notes: req.body.notes || "",
    status: "scheduled"
  });
  return res.status(201).json(followUp);
}

export async function listFollowUps(req, res) {
  await assertPlanAccess(req.params.planId, req.user);
  const records = await FollowUp.find({ plan_id: req.params.planId }).sort({ followup_date: 1 }).lean();
  return res.json(records);
}

export async function cancelFollowUp(req, res) {
  const followUp = await FollowUp.findById(req.params.followUpId);
  if (!followUp) return res.status(404).json({ error: "Follow-up not found" });
  await assertPlanAccess(followUp.plan_id, req.user);
  if (followUp.status !== "scheduled") return res.status(409).json({ error: "Only scheduled follow-ups can be cancelled" });
  followUp.status = "cancelled";
  await followUp.save();
  return res.json(followUp);
}