import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, "caresync.sqlite");

export const db = new DatabaseSync(DB_PATH);

// Enable foreign keys
db.exec("PRAGMA foreign_keys = ON;");

// Initialize Schema
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      blood_group TEXT,
      condition TEXT NOT NULL,
      status TEXT DEFAULT 'Stable',
      risk TEXT DEFAULT 'Low',
      phone TEXT,
      email TEXT,
      doctor_name TEXT,
      care_coordinator TEXT,
      avatar_initials TEXT,
      emergency_contact TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vitals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      systolic INTEGER,
      diastolic INTEGER,
      glucose INTEGER,
      heart_rate INTEGER,
      weight REAL,
      notes TEXT,
      recorded_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      frequency TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      instructions TEXT,
      category TEXT DEFAULT 'Routine',
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS medication_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      medication_id INTEGER NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      status TEXT NOT NULL, -- 'taken', 'skipped', 'missed'
      taken_at TEXT,
      UNIQUE(patient_id, medication_id, date)
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      clinician_name TEXT NOT NULL,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      location TEXT,
      status TEXT DEFAULT 'Scheduled',
      notes TEXT,
      color TEXT DEFAULT 'blue'
    );

    CREATE TABLE IF NOT EXISTS symptoms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      symptom_name TEXT NOT NULL,
      severity INTEGER NOT NULL, -- 1 to 5
      onset_date TEXT NOT NULL,
      duration TEXT,
      notes TEXT,
      status TEXT DEFAULT 'Logged',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lab_tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      test_name TEXT NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      result_value TEXT NOT NULL,
      unit TEXT NOT NULL,
      reference_range TEXT NOT NULL,
      status TEXT NOT NULL, -- 'Normal', 'Borderline', 'Abnormal'
      clinician_notes TEXT,
      technician TEXT
    );

    CREATE TABLE IF NOT EXISTS care_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id TEXT NOT NULL UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      stage TEXT NOT NULL,
      start_date TEXT NOT NULL,
      next_review TEXT NOT NULL,
      target_hba1c TEXT,
      target_bp TEXT,
      target_weight TEXT,
      goals_json TEXT NOT NULL,
      lifestyle_guidelines TEXT,
      instructions_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      sender_role TEXT NOT NULL, -- 'patient', 'clinician', 'coordinator'
      sender_name TEXT NOT NULL,
      sender_initials TEXT NOT NULL,
      recipient_name TEXT NOT NULL,
      text TEXT NOT NULL,
      sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
      is_read INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      priority TEXT NOT NULL, -- 'High', 'Medium', 'Low'
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      details TEXT NOT NULL,
      status TEXT DEFAULT 'Open', -- 'Open', 'Acknowledged', 'Resolved'
      time_ago TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS patient_preferences (
      patient_id TEXT PRIMARY KEY REFERENCES patients(id) ON DELETE CASCADE,
      reminders_med INTEGER NOT NULL DEFAULT 1,
      reminders_vitals INTEGER NOT NULL DEFAULT 1,
      reminders_appts INTEGER NOT NULL DEFAULT 1,
      telehealth_optin INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS daily_task_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      task_key TEXT NOT NULL,
      task_date TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      UNIQUE(patient_id, task_key, task_date)
    );
  `);

  // Seed sample data if empty
  const countRow = db.prepare("SELECT COUNT(*) as count FROM patients").get();
  if (countRow.count === 0) {
    seedDatabase();
  }
}

function seedDatabase() {
  const insertPatient = db.prepare(`
    INSERT INTO patients (id, name, age, gender, blood_group, condition, status, risk, phone, email, doctor_name, care_coordinator, avatar_initials, emergency_contact)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPatient.run(
    "PT-1042", "Ananya Rao", 54, "Female", "B+", "Type 2 Diabetes & Hypertension", "Stable", "Low",
    "+91 98765 43210", "ananya.rao@example.com", "Dr. Priya Menon", "Ramesh Kumar, RN", "AR", "+91 98765 43219 (Spouse)"
  );
  insertPatient.run(
    "PT-1038", "Rahul Mehta", 61, "Male", "O+", "Stage 2 Hypertension & Dyslipidemia", "Review", "Medium",
    "+91 98451 12345", "rahul.mehta@example.com", "Dr. Priya Menon", "Ramesh Kumar, RN", "RM", "+91 98451 98765 (Son)"
  );
  insertPatient.run(
    "PT-1027", "Meera Nair", 48, "Female", "A+", "Chronic Kidney Disease (Stage 3a)", "Stable", "Low",
    "+91 94471 22334", "meera.nair@example.com", "Dr. Arvind Roy", "Sneha Patel, RN", "MN", "+91 94471 55667 (Sister)"
  );
  insertPatient.run(
    "PT-1019", "Vikram Singh", 67, "Male", "AB+", "Heart Failure (NYHA Class II) & CAD", "Attention", "High",
    "+91 98110 33445", "vikram.singh@example.com", "Dr. Priya Menon", "Ramesh Kumar, RN", "VS", "+91 98110 77889 (Daughter)"
  );
  insertPatient.run(
    "PT-1055", "Sunita Sharma", 52, "Female", "O-", "Asthma & Allergic Bronchitis", "Stable", "Medium",
    "+91 98220 55667", "sunita.sharma@example.com", "Dr. Arvind Roy", "Sneha Patel, RN", "SS", "+91 98220 99881 (Husband)"
  );

  // Vitals for Ananya Rao
  const insertVital = db.prepare(`
    INSERT INTO vitals (patient_id, date, systolic, diastolic, glucose, heart_rate, weight, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialVitals = [
    ["PT-1042", "2026-09-24", 126, 80, 112, 72, 68.6, "Fasting reading before morning walk"],
    ["PT-1042", "2026-09-25", 129, 82, 118, 74, 68.5, "Mild fatigue post-exercise"],
    ["PT-1042", "2026-09-26", 124, 79, 109, 70, 68.4, "Optimal control day"],
    ["PT-1042", "2026-09-27", 131, 84, 121, 76, 68.5, "Slight spike after family dinner"],
    ["PT-1042", "2026-09-28", 127, 81, 115, 71, 68.3, "Well hydrated, regular breakfast"],
    ["PT-1042", "2026-09-29", 125, 80, 110, 70, 68.2, "Restful sleep, vitals within goal"],
    ["PT-1042", "2026-09-30", 128, 81, 114, 72, 68.2, "Today morning reading"]
  ];

  for (const v of initialVitals) {
    insertVital.run(v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7]);
  }

  // Medications for Ananya Rao
  const insertMed = db.prepare(`
    INSERT INTO medications (patient_id, name, dosage, frequency, scheduled_time, instructions, category)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertMed.run("PT-1042", "Metformin HCL", "500 mg", "Twice daily", "08:00 AM", "Take immediately with or after morning meal", "Antidiabetic");
  insertMed.run("PT-1042", "Amlodipine Besylate", "5 mg", "Once daily", "01:00 PM", "Take around lunchtime with water", "Antihypertensive");
  insertMed.run("PT-1042", "Atorvastatin Calcium", "10 mg", "Once daily", "09:00 PM", "Take at bedtime for cholesterol management", "Lipid-lowering");
  insertMed.run("PT-1042", "Metformin HCL (Evening)", "500 mg", "Twice daily", "08:00 PM", "Take with dinner", "Antidiabetic");

  // Medication logs for today
  const insertMedLog = db.prepare(`
    INSERT INTO medication_logs (patient_id, medication_id, date, status, taken_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertMedLog.run("PT-1042", 1, "2026-09-30", "taken", "2026-09-30 08:14:00");
  insertMedLog.run("PT-1042", 2, "2026-09-30", "taken", "2026-09-30 13:05:00");

  // Appointments
  const insertAppt = db.prepare(`
    INSERT INTO appointments (patient_id, title, clinician_name, type, date, time, location, status, notes, color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertAppt.run(
    "PT-1042", "Care Review & Treatment Optimization", "Dr. Priya Menon", "Consultation",
    "2026-10-04", "10:30 AM", "Endocrinology OPD - Room 302", "Scheduled", "Review quarterly blood glucose trends and medication tolerance", "blue"
  );
  insertAppt.run(
    "PT-1042", "Comprehensive HbA1c & Lipid Panel", "CareSync Central Lab", "Medical test",
    "2026-10-10", "08:00 AM", "Central Clinical Diagnostic Center", "Scheduled", "12 hours fasting required before blood draw", "purple"
  );
  insertAppt.run(
    "PT-1042", "Diabetic Foot & Neuropathy Screening", "Dr. Priya Menon", "Follow-up",
    "2026-10-18", "11:15 AM", "Wellness Clinic Suite A", "Scheduled", "Annual sensory neuropathy and microvascular exam", "green"
  );
  insertAppt.run(
    "PT-1042", "Previous Care Strategy Consultation", "Dr. Priya Menon", "Consultation",
    "2026-08-12", "09:30 AM", "Endocrinology OPD - Room 302", "Completed", "Metformin dose stabilized; BP goal set to < 130/80 mmHg", "blue"
  );

  // Symptoms
  const insertSymptom = db.prepare(`
    INSERT INTO symptoms (patient_id, symptom_name, severity, onset_date, duration, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertSymptom.run("PT-1042", "Mild morning dizziness upon standing", 2, "2026-09-29", "15 minutes", "Occurred right after getting out of bed. Passed after sipping water.", "Logged");
  insertSymptom.run("PT-1042", "Afternoon lethargy & fatigue", 2, "2026-09-25", "1-2 hours", "Felt drowsy around 3 PM following lunch; blood sugar was 118.", "Under Review");
  insertSymptom.run("PT-1042", "Intermittent toe numbness", 3, "2026-09-18", "Intermittent", "Slight tingling in left foot toes at night. Care team alerted.", "Logged");

  // Lab Tests
  const insertLab = db.prepare(`
    INSERT INTO lab_tests (patient_id, test_name, category, date, result_value, unit, reference_range, status, clinician_notes, technician)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertLab.run(
    "PT-1042", "Glycated Hemoglobin (HbA1c)", "Diabetes Profile", "2026-08-15",
    "6.8", "%", "< 5.7% Normal | 5.7-6.4% Prediabetes | >= 6.5% Diabetes", "Borderline",
    "Improvement noted from previous 7.3%. Target remains < 6.5%.", "Dr. Anita Desai, MD Path"
  );
  insertLab.run(
    "PT-1042", "Fasting Blood Glucose", "Diabetes Profile", "2026-08-15",
    "114", "mg/dL", "70 - 99 mg/dL Normal | 100 - 125 Impaired", "Borderline",
    "Well regulated on current Metformin 500mg BID regimen.", "Dr. Anita Desai, MD Path"
  );
  insertLab.run(
    "PT-1042", "Estimated Glomerular Filtration Rate (eGFR)", "Renal Function", "2026-08-15",
    "88", "mL/min/1.73m²", "> 60 mL/min/1.73m² Normal", "Normal",
    "Kidney filtration rate intact; no renal impairment detected.", "Dr. Anita Desai, MD Path"
  );
  insertLab.run(
    "PT-1042", "Serum Creatinine", "Renal Function", "2026-08-15",
    "0.88", "mg/dL", "0.60 - 1.10 mg/dL Normal", "Normal",
    "Electrolytes and renal values in safe physiological zone.", "Dr. Anita Desai, MD Path"
  );
  insertLab.run(
    "PT-1042", "Total Cholesterol", "Lipid Profile", "2026-08-15",
    "182", "mg/dL", "< 200 mg/dL Desirable", "Normal",
    "Statins showing positive cardiovascular risk reduction.", "Dr. Anita Desai, MD Path"
  );
  insertLab.run(
    "PT-1042", "Low-Density Lipoprotein (LDL-C)", "Lipid Profile", "2026-08-15",
    "94", "mg/dL", "< 100 mg/dL Optimal for Diabetics", "Normal",
    "Maintained under 100 target threshold.", "Dr. Anita Desai, MD Path"
  );
  insertLab.run(
    "PT-1042", "High-Density Lipoprotein (HDL-C)", "Lipid Profile", "2026-08-15",
    "46", "mg/dL", "> 50 mg/dL Recommended for Females", "Borderline",
    "Encourage continued aerobic walks and healthy omega fats.", "Dr. Anita Desai, MD Path"
  );

  // Care Plan for Ananya Rao
  const insertCarePlan = db.prepare(`
    INSERT INTO care_plans (patient_id, title, stage, start_date, next_review, target_hba1c, target_bp, target_weight, goals_json, lifestyle_guidelines, instructions_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const goals = [
    { title: "Maintain Glycemic Control", target: "Fasting glucose 90-120 mg/dL, HbA1c < 6.5%", progress: 85, status: "On Track" },
    { title: "Blood Pressure Regulation", target: "Systolic < 130 mmHg, Diastolic < 80 mmHg", progress: 90, status: "Optimal" },
    { title: "Medication Adherence", target: ">= 95% doses taken on schedule", progress: 92, status: "High" },
    { title: "Physical Activity Target", target: "150 minutes of moderate aerobic walking per week", progress: 78, status: "Progressing" },
    { title: "Dietary Sodium & Carbs", target: "< 2,000 mg daily sodium, balanced low-GI meals", progress: 80, status: "Maintained" }
  ];

  const instructions = [
    { title: "Daily Vitals Routine", text: "Record fasting blood glucose and morning resting blood pressure before breakfast.", icon: "Activity" },
    { title: "Medication Timing", text: "Take Metformin immediately after morning and evening meals to minimize GI sensitivity.", icon: "Pill" },
    { title: "Hypoglycemia Preparedness", text: "Keep 15g fast-acting glucose tablets or fruit juice available in case reading drops below 70 mg/dL.", icon: "ShieldCheck" },
    { title: "Hydration & Activity", text: "Drink at least 2 liters of water daily and take a 20-minute gentle walk post-dinner.", icon: "HeartPulse" }
  ];

  insertCarePlan.run(
    "PT-1042",
    "Type 2 Diabetes & Cardiovascular Risk Management Plan",
    "Active Maintenance",
    "2026-08-12",
    "2026-10-04",
    "< 6.5%",
    "< 130/80 mmHg",
    "66.0 kg",
    JSON.stringify(goals),
    "Follow Mediterranean-style low glycemic meal pattern. Avoid sweetened beverages and processed snacks.",
    JSON.stringify(instructions)
  );

  // Messages
  const insertMessage = db.prepare(`
    INSERT INTO messages (patient_id, sender_role, sender_name, sender_initials, recipient_name, text, sent_at, is_read)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertMessage.run(
    "PT-1042", "clinician", "Dr. Priya Menon", "DP", "Ananya Rao",
    "Good morning Ananya, I reviewed your vitals from this week. Your blood pressure has remained consistently below 130/82 mmHg, which is great progress.",
    "2026-09-30 09:12:00", 1
  );
  insertMessage.run(
    "PT-1042", "patient", "Ananya Rao", "AR", "Dr. Priya Menon",
    "Thank you Dr. Priya! I have been taking the morning Amlodipine regularly. I also logged today's glucose which was 114 mg/dL.",
    "2026-09-30 09:20:00", 1
  );
  insertMessage.run(
    "PT-1042", "coordinator", "Ramesh Kumar, RN", "RK", "Ananya Rao",
    "Hello Ananya, just a quick reminder that your next quarterly review is coming up on October 4 at 10:30 AM. Please remember to complete your fasting test beforehand.",
    "2026-09-30 09:45:00", 0
  );

  // Alerts
  const insertAlert = db.prepare(`
    INSERT INTO alerts (patient_id, priority, type, title, details, status, time_ago)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertAlert.run("PT-1019", "High", "Abnormal Vitals", "Vikram Singh - Heart rate reading 104 BPM at rest", "Exceeds NYHA Class II guideline threshold; clinician consultation suggested.", "Open", "12 min ago");
  insertAlert.run("PT-1038", "Medium", "Medication Adherence", "Rahul Mehta - Missed evening Amlodipine dose", "System alert triggered after 3 hour delay past scheduled time.", "Open", "48 min ago");
  insertAlert.run("PT-1042", "Medium", "Symptom Logged", "Ananya Rao - Logged moderate toe tingling", "Symptom severity 3 logged today. Review at upcoming Oct 4 visit.", "Open", "2 hr ago");
  insertAlert.run("PT-1027", "Low", "Lab Due", "Meera Nair - Renal panel scheduled for renewal", "eGFR and Serum Creatinine due within 7 days.", "Acknowledged", "4 hr ago");
}

export function resetDatabase() {
  db.exec(`
    DROP TABLE IF EXISTS alerts;
    DROP TABLE IF EXISTS messages;
    DROP TABLE IF EXISTS care_plans;
    DROP TABLE IF EXISTS lab_tests;
    DROP TABLE IF EXISTS symptoms;
    DROP TABLE IF EXISTS appointments;
    DROP TABLE IF EXISTS medication_logs;
    DROP TABLE IF EXISTS medications;
    DROP TABLE IF EXISTS vitals;
    DROP TABLE IF EXISTS patients;
  `);
  initDatabase();
}

