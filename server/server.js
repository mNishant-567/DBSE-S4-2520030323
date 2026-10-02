import "dotenv/config";
import express from "express";
import cors from "cors";
import { db, initDatabase, resetDatabase } from "./db.js";
import { closeDatabases, connectDatabases } from "./config/database.js";
import apiRoutes from "./routes/apiRoutes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/v1", apiRoutes);

// Initialize database schema and seeds
initDatabase();

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", service: "CareSync API", timestamp: new Date().toISOString() });
});

// Database Re-sync / Reset
app.post("/api/reset-database", (req, res) => {
  try {
    resetDatabase();
    res.json({ success: true, message: "Database synchronized and reset to clean clinical seeds." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Patients API
app.get("/api/patients", (req, res) => {
  try {
    const patients = db.prepare("SELECT * FROM patients ORDER BY name ASC").all();
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/patients/:id", (req, res) => {
  try {
    const patient = db.prepare("SELECT * FROM patients WHERE id = ?").get(req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    // Recent vital
    const latestVital = db.prepare("SELECT * FROM vitals WHERE patient_id = ? ORDER BY date DESC, id DESC LIMIT 1").get(req.params.id);
    // Adherence metric
    const meds = db.prepare("SELECT * FROM medications WHERE patient_id = ? AND is_active = 1").all(req.params.id);
    const today = new Date().toISOString().split("T")[0];
    const logs = db.prepare("SELECT * FROM medication_logs WHERE patient_id = ? AND date = ?").all(req.params.id, today);

    res.json({
      ...patient,
      latestVital,
      activeMedsCount: meds.length,
      todayDosesTaken: logs.filter(l => l.status === "taken").length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/patients/:id/settings", (req, res) => {
  try {
    const settings = db.prepare(`
      SELECT p.name, p.email, p.phone, p.emergency_contact, p.doctor_name,
        COALESCE(pref.reminders_med, 1) AS reminders_med,
        COALESCE(pref.reminders_vitals, 1) AS reminders_vitals,
        COALESCE(pref.reminders_appts, 1) AS reminders_appts,
        COALESCE(pref.telehealth_optin, 1) AS telehealth_optin
      FROM patients p
      LEFT JOIN patient_preferences pref ON pref.patient_id = p.id
      WHERE p.id = ?
    `).get(req.params.id);
    if (!settings) return res.status(404).json({ error: "Patient not found" });

    res.json({
      ...settings,
      reminders_med: Boolean(settings.reminders_med),
      reminders_vitals: Boolean(settings.reminders_vitals),
      reminders_appts: Boolean(settings.reminders_appts),
      telehealth_optin: Boolean(settings.telehealth_optin)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/patients/:id/settings", (req, res) => {
  try {
    const { name, email, phone, emergency_contact, doctor_name } = req.body;
    const patient = db.prepare("SELECT id FROM patients WHERE id = ?").get(req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    if (name !== undefined && !String(name).trim()) {
      return res.status(400).json({ error: "Patient name cannot be empty" });
    }

    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare(`
        UPDATE patients
        SET name = COALESCE(?, name),
            email = COALESCE(?, email),
            phone = COALESCE(?, phone),
            emergency_contact = COALESCE(?, emergency_contact),
            doctor_name = COALESCE(?, doctor_name)
        WHERE id = ?
      `).run(name ?? null, email ?? null, phone ?? null, emergency_contact ?? null, doctor_name ?? null, req.params.id);

      db.prepare(`
        INSERT INTO patient_preferences (patient_id, reminders_med, reminders_vitals, reminders_appts, telehealth_optin)
        VALUES (?, COALESCE(?, 1), COALESCE(?, 1), COALESCE(?, 1), COALESCE(?, 1))
        ON CONFLICT(patient_id) DO UPDATE SET
          reminders_med = COALESCE(excluded.reminders_med, patient_preferences.reminders_med),
          reminders_vitals = COALESCE(excluded.reminders_vitals, patient_preferences.reminders_vitals),
          reminders_appts = COALESCE(excluded.reminders_appts, patient_preferences.reminders_appts),
          telehealth_optin = COALESCE(excluded.telehealth_optin, patient_preferences.telehealth_optin)
      `).run(
        req.params.id,
        typeof req.body.reminders_med === "boolean" ? Number(req.body.reminders_med) : null,
        typeof req.body.reminders_vitals === "boolean" ? Number(req.body.reminders_vitals) : null,
        typeof req.body.reminders_appts === "boolean" ? Number(req.body.reminders_appts) : null,
        typeof req.body.telehealth_optin === "boolean" ? Number(req.body.telehealth_optin) : null
      );
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }

    const settings = db.prepare(`
      SELECT p.name, p.email, p.phone, p.emergency_contact, p.doctor_name,
        pref.reminders_med, pref.reminders_vitals, pref.reminders_appts, pref.telehealth_optin
      FROM patients p
      JOIN patient_preferences pref ON pref.patient_id = p.id
      WHERE p.id = ?
    `).get(req.params.id);
    res.json({
      ...settings,
      reminders_med: Boolean(settings.reminders_med),
      reminders_vitals: Boolean(settings.reminders_vitals),
      reminders_appts: Boolean(settings.reminders_appts),
      telehealth_optin: Boolean(settings.telehealth_optin)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/patients/:id/daily-tasks", (req, res) => {
  try {
    const patient = db.prepare("SELECT id FROM patients WHERE id = ?").get(req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    const date = req.query.date || new Date().toISOString().split("T")[0];
    const tasks = db.prepare(`
      SELECT task_key, done FROM daily_task_logs
      WHERE patient_id = ? AND task_date = ?
    `).all(req.params.id, date);
    res.json(tasks.map(task => ({ ...task, done: Boolean(task.done) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/patients/:id/daily-tasks/:taskKey", (req, res) => {
  try {
    const patient = db.prepare("SELECT id FROM patients WHERE id = ?").get(req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    if (typeof req.body.done !== "boolean") {
      return res.status(400).json({ error: "Task completion status must be a boolean" });
    }

    const date = req.body.date || new Date().toISOString().split("T")[0];
    db.prepare(`
      INSERT INTO daily_task_logs (patient_id, task_key, task_date, done)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(patient_id, task_key, task_date) DO UPDATE SET done = excluded.done
    `).run(req.params.id, req.params.taskKey, date, Number(req.body.done));
    res.json({ task_key: req.params.taskKey, date, done: req.body.done });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/patients", (req, res) => {
  try {
    const { name, age, gender, blood_group, condition, risk, phone, email, doctor_name } = req.body;
    if (!name || !condition) return res.status(400).json({ error: "Name and condition are required" });

    // Generate unique ID
    const nextId = "PT-" + (1050 + Math.floor(Math.random() * 900));
    const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

    const stmt = db.prepare(`
      INSERT INTO patients (id, name, age, gender, blood_group, condition, status, risk, phone, email, doctor_name, care_coordinator, avatar_initials)
      VALUES (?, ?, ?, ?, ?, ?, 'Review', ?, ?, ?, ?, 'Care Coordinator Team', ?)
    `);

    stmt.run(nextId, name, age || 50, gender || "Unspecified", blood_group || "O+", condition, risk || "Medium", phone || "", email || "", doctor_name || "Dr. Priya Menon", initials);

    const created = db.prepare("SELECT * FROM patients WHERE id = ?").get(nextId);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/patients/:id", (req, res) => {
  try {
    const { name, age, gender, blood_group, condition, status, risk, phone, email, emergency_contact, doctor_name } = req.body;
    const current = db.prepare("SELECT * FROM patients WHERE id = ?").get(req.params.id);
    if (!current) return res.status(404).json({ error: "Patient not found" });

    db.prepare(`
      UPDATE patients
      SET name = COALESCE(?, name),
          age = COALESCE(?, age),
          gender = COALESCE(?, gender),
          blood_group = COALESCE(?, blood_group),
          condition = COALESCE(?, condition),
          status = COALESCE(?, status),
          risk = COALESCE(?, risk),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          emergency_contact = COALESCE(?, emergency_contact),
          doctor_name = COALESCE(?, doctor_name)
      WHERE id = ?
    `).run(name, age, gender, blood_group, condition, status, risk, phone, email, emergency_contact, doctor_name, req.params.id);

    const updated = db.prepare("SELECT * FROM patients WHERE id = ?").get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/patients/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM patients WHERE id = ?").run(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vitals API
app.get("/api/patients/:id/vitals", (req, res) => {
  try {
    const vitals = db.prepare("SELECT * FROM vitals WHERE patient_id = ? ORDER BY date ASC, id ASC").all(req.params.id);
    res.json(vitals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/patients/:id/vitals", (req, res) => {
  try {
    const { systolic, diastolic, glucose, heart_rate, weight, notes, date } = req.body;
    const entryDate = date || new Date().toISOString().split("T")[0];

    const stmt = db.prepare(`
      INSERT INTO vitals (patient_id, date, systolic, diastolic, glucose, heart_rate, weight, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      req.params.id,
      entryDate,
      systolic ? parseInt(systolic) : null,
      diastolic ? parseInt(diastolic) : null,
      glucose ? parseInt(glucose) : null,
      heart_rate ? parseInt(heart_rate) : null,
      weight ? parseFloat(weight) : null,
      notes || "Routine patient self-log"
    );

    // Automated Clinical Threshold Checking
    if (systolic && parseInt(systolic) > 140) {
      db.prepare(`
        INSERT INTO alerts (patient_id, priority, type, title, details, time_ago)
        VALUES (?, 'High', 'Abnormal BP', ?, 'Systolic BP logged at ' || ? || ' mmHg. Clinician follow-up recommended.', 'Just now')
      `).run(req.params.id, `Elevated BP for patient ${req.params.id}`, systolic);
    } else if (glucose && parseInt(glucose) > 180) {
      db.prepare(`
        INSERT INTO alerts (patient_id, priority, type, title, details, time_ago)
        VALUES (?, 'Medium', 'Hyperglycemia', ?, 'Blood glucose recorded at ' || ? || ' mg/dL.', 'Just now')
      `).run(req.params.id, `Elevated Glucose for patient ${req.params.id}`, glucose);
    }

    const created = db.prepare("SELECT * FROM vitals WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/vitals/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM vitals WHERE id = ?").run(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Medications API
app.get("/api/patients/:id/medications", (req, res) => {
  try {
    const meds = db.prepare("SELECT * FROM medications WHERE patient_id = ? AND is_active = 1").all(req.params.id);
    const today = new Date().toISOString().split("T")[0];
    const logs = db.prepare("SELECT * FROM medication_logs WHERE patient_id = ? AND date = ?").all(req.params.id, today);

    const logMap = {};
    for (const log of logs) {
      logMap[log.medication_id] = log;
    }

    const medsWithStatus = meds.map(m => ({
      ...m,
      taken: logMap[m.id]?.status === "taken",
      logStatus: logMap[m.id]?.status || "pending",
      takenAt: logMap[m.id]?.taken_at || null
    }));

    // Weekly adherence calculation
    const allWeekLogs = db.prepare(`
      SELECT status, count(*) as count FROM medication_logs
      WHERE patient_id = ? AND date >= date('now', '-7 days')
      GROUP BY status
    `).all(req.params.id);

    const takenCount = allWeekLogs.find(l => l.status === "taken")?.count || 0;
    const totalLogs = allWeekLogs.reduce((acc, l) => acc + l.count, 0) || 1;
    const weeklyAdherence = Math.min(100, Math.round((takenCount / Math.max(totalLogs, 1)) * 100));

    res.json({
      medications: medsWithStatus,
      weeklyAdherence: weeklyAdherence > 0 ? weeklyAdherence : 92,
      todaySummary: {
        total: meds.length,
        taken: medsWithStatus.filter(m => m.taken).length
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/patients/:id/medications", (req, res) => {
  try {
    const { name, dosage, frequency, scheduled_time, instructions, category } = req.body;
    if (!name || !dosage) return res.status(400).json({ error: "Medication name and dosage are required" });

    const stmt = db.prepare(`
      INSERT INTO medications (patient_id, name, dosage, frequency, scheduled_time, instructions, category)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      req.params.id,
      name,
      dosage,
      frequency || "Daily",
      scheduled_time || "08:00 AM",
      instructions || "Take as directed by doctor",
      category || "Routine"
    );

    const created = db.prepare("SELECT * FROM medications WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/patients/:id/medications/:medId/log", (req, res) => {
  try {
    const { status, date } = req.body; // status: 'taken' or 'skipped' or 'pending'
    const logDate = date || new Date().toISOString().split("T")[0];
    const takenTime = status === "taken" ? new Date().toISOString().replace("T", " ").substring(0, 19) : null;

    if (status === "pending") {
      db.prepare("DELETE FROM medication_logs WHERE patient_id = ? AND medication_id = ? AND date = ?")
        .run(req.params.id, req.params.medId, logDate);
      return res.json({ success: true, status: "pending" });
    }

    db.prepare(`
      INSERT INTO medication_logs (patient_id, medication_id, date, status, taken_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(patient_id, medication_id, date) DO UPDATE SET
        status = excluded.status,
        taken_at = excluded.taken_at
    `).run(req.params.id, req.params.medId, logDate, status || "taken", takenTime);

    res.json({ success: true, status, taken_at: takenTime });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/medications/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM medications WHERE id = ?").run(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Appointments API
app.get("/api/patients/:id/appointments", (req, res) => {
  try {
    const appts = db.prepare("SELECT * FROM appointments WHERE patient_id = ? ORDER BY date ASC, time ASC").all(req.params.id);
    res.json(appts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/patients/:id/appointments", (req, res) => {
  try {
    const { title, clinician_name, type, date, time, location, notes, color } = req.body;
    if (!title || !date || !time) return res.status(400).json({ error: "Title, date, and time are required" });

    const stmt = db.prepare(`
      INSERT INTO appointments (patient_id, title, clinician_name, type, date, time, location, status, notes, color)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Scheduled', ?, ?)
    `);

    const result = stmt.run(
      req.params.id,
      title,
      clinician_name || "Dr. Priya Menon",
      type || "Consultation",
      date,
      time,
      location || "CareSync Clinical Center",
      notes || "",
      color || "blue"
    );

    const created = db.prepare("SELECT * FROM appointments WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/appointments/:id", (req, res) => {
  try {
    const { status, date, time, notes } = req.body;
    const current = db.prepare("SELECT * FROM appointments WHERE id = ?").get(req.params.id);
    if (!current) return res.status(404).json({ error: "Appointment not found" });

    db.prepare(`
      UPDATE appointments
      SET status = COALESCE(?, status),
          date = COALESCE(?, date),
          time = COALESCE(?, time),
          notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(status, date, time, notes, req.params.id);

    const updated = db.prepare("SELECT * FROM appointments WHERE id = ?").get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/appointments/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM appointments WHERE id = ?").run(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Symptoms API
app.get("/api/patients/:id/symptoms", (req, res) => {
  try {
    const symptoms = db.prepare("SELECT * FROM symptoms WHERE patient_id = ? ORDER BY onset_date DESC, id DESC").all(req.params.id);
    res.json(symptoms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/patients/:id/symptoms", (req, res) => {
  try {
    const { symptom_name, severity, onset_date, duration, notes } = req.body;
    if (!symptom_name || !severity) return res.status(400).json({ error: "Symptom name and severity are required" });

    const stmt = db.prepare(`
      INSERT INTO symptoms (patient_id, symptom_name, severity, onset_date, duration, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Logged')
    `);

    const dateVal = onset_date || new Date().toISOString().split("T")[0];
    const result = stmt.run(
      req.params.id,
      symptom_name,
      parseInt(severity),
      dateVal,
      duration || "Recent",
      notes || ""
    );

    // If severity is severe (4 or 5), trigger high-priority alert for clinician
    if (parseInt(severity) >= 4) {
      db.prepare(`
        INSERT INTO alerts (patient_id, priority, type, title, details, time_ago)
        VALUES (?, 'High', 'Severe Symptom Flag', ?, ?, 'Just now')
      `).run(
        req.params.id,
        `Severe Symptom (${severity}/5): ${symptom_name}`,
        `Patient reported: "${notes || symptom_name}". Urgent triage indicated.`
      );
    }

    const created = db.prepare("SELECT * FROM symptoms WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/symptoms/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM symptoms WHERE id = ?").run(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lab Tests API
app.get("/api/patients/:id/lab-tests", (req, res) => {
  try {
    const labs = db.prepare("SELECT * FROM lab_tests WHERE patient_id = ? ORDER BY date DESC, id DESC").all(req.params.id);
    res.json(labs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/patients/:id/lab-tests", (req, res) => {
  try {
    const { test_name, category, date, result_value, unit, reference_range, status, clinician_notes, technician } = req.body;
    if (!test_name || !result_value) return res.status(400).json({ error: "Test name and result value required" });

    const stmt = db.prepare(`
      INSERT INTO lab_tests (patient_id, test_name, category, date, result_value, unit, reference_range, status, clinician_notes, technician)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      req.params.id,
      test_name,
      category || "General Chemistry",
      date || new Date().toISOString().split("T")[0],
      result_value,
      unit || "",
      reference_range || "See clinical guidelines",
      status || "Normal",
      clinician_notes || "",
      technician || "CareSync Clinical Lab"
    );

    const created = db.prepare("SELECT * FROM lab_tests WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/lab-tests/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM lab_tests WHERE id = ?").run(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Care Plans API
app.get("/api/patients/:id/care-plan", (req, res) => {
  try {
    const plan = db.prepare("SELECT * FROM care_plans WHERE patient_id = ?").get(req.params.id);
    if (!plan) return res.status(404).json({ error: "Care plan not found" });

    res.json({
      ...plan,
      goals: JSON.parse(plan.goals_json || "[]"),
      instructions: JSON.parse(plan.instructions_json || "[]")
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/patients/:id/care-plan/goal/:goalIndex", (req, res) => {
  try {
    const plan = db.prepare("SELECT * FROM care_plans WHERE patient_id = ?").get(req.params.id);
    if (!plan) return res.status(404).json({ error: "Care plan not found" });

    const goals = JSON.parse(plan.goals_json || "[]");
    const idx = parseInt(req.params.goalIndex);
    if (idx >= 0 && idx < goals.length) {
      goals[idx].progress = req.body.progress ?? goals[idx].progress;
      goals[idx].status = req.body.status ?? goals[idx].status;

      db.prepare("UPDATE care_plans SET goals_json = ? WHERE patient_id = ?").run(JSON.stringify(goals), req.params.id);
    }

    res.json({ success: true, goals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Messages API
app.get("/api/patients/:id/messages", (req, res) => {
  try {
    const messages = db.prepare("SELECT * FROM messages WHERE patient_id = ? ORDER BY sent_at ASC").all(req.params.id);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/patients/:id/messages", (req, res) => {
  try {
    const { text, sender_role, sender_name } = req.body;
    if (!text) return res.status(400).json({ error: "Message text is required" });

    const role = sender_role || "patient";
    const name = sender_name || (role === "patient" ? "Ananya Rao" : "Dr. Priya Menon");
    const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    const recipient = role === "patient" ? "Dr. Priya Menon" : "Ananya Rao";

    const stmt = db.prepare(`
      INSERT INTO messages (patient_id, sender_role, sender_name, sender_initials, recipient_name, text, sent_at, is_read)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), 1)
    `);

    const result = stmt.run(req.params.id, role, name, initials, recipient, text);
    const created = db.prepare("SELECT * FROM messages WHERE id = ?").get(result.lastInsertRowid);

    // If sent by patient, simulate helpful automated doctor / coordinator response after 1.5s
    if (role === "patient") {
      setTimeout(() => {
        try {
          const autoReplies = [
            "Thank you for the update. I have noted this in your care chart. Continue monitoring your morning vitals.",
            "Received. Your adherence has been excellent this week. Keep up the consistent schedule!",
            "Thank you for reaching out. Please make sure to log any unusual symptoms, and feel free to call our emergency line if symptoms intensify."
          ];
          const replyText = autoReplies[Math.floor(Math.random() * autoReplies.length)];

          db.prepare(`
            INSERT INTO messages (patient_id, sender_role, sender_name, sender_initials, recipient_name, text, sent_at, is_read)
            VALUES (?, 'clinician', 'Dr. Priya Menon', 'DP', 'Ananya Rao', ?, datetime('now', 'localtime'), 0)
          `).run(req.params.id, replyText);
        } catch (e) {
          console.error("Auto-reply error:", e);
        }
      }, 1200);
    }

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Alerts API
app.get("/api/alerts", (req, res) => {
  try {
    const alerts = db.prepare(`
      SELECT a.*, p.name as patient_name, p.condition as patient_condition, p.avatar_initials
      FROM alerts a
      JOIN patients p ON a.patient_id = p.id
      ORDER BY 
        CASE a.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END,
        a.id DESC
    `).all();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/alerts/:id", (req, res) => {
  try {
    const { status } = req.body;
    db.prepare("UPDATE alerts SET status = ? WHERE id = ?").run(status || "Resolved", req.params.id);
    const updated = db.prepare("SELECT * FROM alerts WHERE id = ?").get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cohort & Analytics API
app.get("/api/analytics/summary", (req, res) => {
  try {
    const totalPatients = db.prepare("SELECT COUNT(*) as count FROM patients").get().count;
    const highRisk = db.prepare("SELECT COUNT(*) as count FROM patients WHERE risk = 'High'").get().count;
    const mediumRisk = db.prepare("SELECT COUNT(*) as count FROM patients WHERE risk = 'Medium'").get().count;
    const lowRisk = db.prepare("SELECT COUNT(*) as count FROM patients WHERE risk = 'Low'").get().count;
    const openAlerts = db.prepare("SELECT COUNT(*) as count FROM alerts WHERE status != 'Resolved'").get().count;
    const todayAppointments = db.prepare("SELECT COUNT(*) as count FROM appointments WHERE status = 'Scheduled'").get().count;

    res.json({
      totalPatients,
      highRisk,
      mediumRisk,
      lowRisk,
      openAlerts,
      todayAppointments,
      averageAdherence: 91
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use(errorHandler);

async function startServer() {
  await connectDatabases();
  const server = app.listen(PORT, () => {
    console.log(`CareSync REST API server listening at http://localhost:${PORT}`);
    console.log(`Versioned PostgreSQL/Mongo API available at http://localhost:${PORT}/api/v1`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await closeDatabases();
      db.close();
      process.exit(0);
    });
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

startServer().catch(error => {
  console.error("CareSync API startup failed:", error.message);
  closeDatabases().catch(() => {});
  db.close();
  process.exitCode = 1;
});
