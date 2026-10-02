# CareSync — Long-Term Disease Treatment Monitoring & Care Coordination Platform

A Full-Stack clinical application for **Long Term Disease Treatment Monitoring and Multidisciplinary Care Coordination**, built with **React**, **Vite**, **Recharts**, **Lucide Icons**, a dedicated **Node.js/Express REST API**, and a persistent **SQLite Relational Database** (`node:sqlite`).

---

## 🌟 Key Features & Clinical Modules

### 1. 🩺 Patient Portal
- **Interactive Executive Dashboard**: Daily care goals, biometric cards (Blood Pressure, Fasting Glucose, Heart Rate, Body Weight), dynamic adherence gauge, and care team announcements.
- **Biometric Vitals Tracker**: Longitudinal area telemetry charts (7-day / 14-day / 30-day), target threshold indicators (optimal vs hypertensive / hyperglycemic zones), and interactive vital logger with validation.
- **Medication Schedule & Adherence Engine**: Daily dose timeline with one-click intake logging ("Mark Taken" / "Undo"), real-time adherence calculation, and prescription instructions.
- **Appointments & Follow-up Scheduling**: Booking interface for clinician consultations, diagnostic lab tests, follow-ups, and telehealth video reviews, with preparation guidelines and cancellation.
- **Symptom & Side-Effect Journal**: Interactive logger with visual 1–5 severity scale, quick symptom chips, onset timestamps, and automatic clinician safety escalation for severe ratings.
- **Medical Tests & Diagnostic Lab Archive**: Comprehensive tracking of Glycated Hemoglobin (HbA1c), fasting glucose, renal function (eGFR, Serum Creatinine), and lipid profiles with normal/abnormal reference ranges and print/export summary.
- **Personalized Disease Care Plan**: Chronic care protocols for Type 2 Diabetes and Hypertension, milestone progress tracking (+5% incremental goals), and dietary/lifestyle guidelines.
- **Encrypted Care Team Messaging**: Asynchronous consultation chat with attending endocrinologist (Dr. Priya Menon) and nurse coordinator (Ramesh Kumar, RN), with automated clinical response simulation.
- **Account & Preference Settings**: Patient credentials, emergency contacts, disease history, and automated reminder push toggles.

### 2. 👩‍⚕️ Clinician Suite
- **Cohort Health Overview**: Population risk stratification (Low, Medium, High Priority), triage queue, and daily consultation schedule.
- **Patient Directory & Electronic Charts**: Full roster with search, risk filtering, and an enrollment modal for new chronic disease patients.
- **Clinical Intervention & Alert Queue**: Automated telemetry safety triggers (systolic spikes, severe symptom logs) with "Acknowledge" and "Resolve" actions.

### 3. 🛡️ System Administration Console
- **Platform Telemetry**: REST API health, SQLite database connection telemetry, and active clinician licenses.
- **Role-Based Access Control (RBAC)**: User roles across Patients, Clinicians, Care Coordinators, and Administrators.
- **Cryptographic Audit Trail**: Timestamped logs of medical interventions and patient telemetry submissions.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, Recharts, Lucide Icons, Pure Vanilla CSS Design System |
| **Backend REST API** | Node.js, Express 4, CORS, JSON Body Parser |
| **Database** | SQLite Relational Database using Node's native built-in `node:sqlite` (zero node-gyp build dependencies) |
| **API Proxy** | Vite dev server proxies `/api/*` to `http://localhost:5000` |

---

## 🚀 How to Run

### Option A: Run Both Frontend & Backend Together (Recommended)
From the workspace root:
```bash
npm run dev
```
*(Runs `node start-dev.js`, which launches both the backend on port 5000 and the Vite frontend on port 5173).*

### Option B: Run Separately

1. **Start the Backend REST API Server**:
   ```bash
   node server/server.js
   ```
   *Listens on `http://localhost:5000` and creates/seeds `server/caresync.sqlite` automatically.*

2. **Start the Frontend Vite Client**:
   ```bash
   cd long-term-disease-care-frontend
   npm run dev
   ```
   *Opens on `http://localhost:5173`.*

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status |
| `GET` | `/api/patients` | Retrieve all cohort patients |
| `GET` | `/api/patients/:id` | Get patient profile & recent summary |
| `POST` | `/api/patients` | Enroll a new patient |
| `GET` | `/api/patients/:id/vitals` | Get historical biometric readings |
| `POST` | `/api/patients/:id/vitals` | Log new vital signs (triggers alerts if high) |
| `GET` | `/api/patients/:id/medications` | Get medications & today's dose logs |
| `POST` | `/api/patients/:id/medications` | Prescribe a new medication |
| `POST` | `/api/patients/:id/medications/:medId/log` | Record dose status (taken/pending) |
| `GET` | `/api/patients/:id/appointments` | Get scheduled & past visits |
| `POST` | `/api/patients/:id/appointments` | Schedule a new appointment |
| `PATCH` | `/api/appointments/:id` | Reschedule or cancel appointment |
| `GET` | `/api/patients/:id/symptoms` | Retrieve logged symptoms timeline |
| `POST` | `/api/patients/:id/symptoms` | Record adverse symptom |
| `GET` | `/api/patients/:id/lab-tests` | Retrieve diagnostic lab reports |
| `POST` | `/api/patients/:id/lab-tests` | Add diagnostic lab report |
| `GET` | `/api/patients/:id/care-plan` | Retrieve patient care plan & goals |
| `PUT` | `/api/patients/:id/care-plan/goal/:idx` | Update goal milestone progress |
| `GET` | `/api/patients/:id/messages` | Retrieve consultation messages |
| `POST` | `/api/patients/:id/messages` | Send message (triggers auto doctor reply) |
| `GET` | `/api/alerts` | Get clinician triage queue |
| `PATCH` | `/api/alerts/:id` | Resolve clinical alert |
| `GET` | `/api/analytics/summary` | Cohort population statistics |

---

## ⚠️ Clinical Disclaimer
This software is intended for educational demonstration, multidisciplinary care workflow coordination, and academic evaluation. It does not replace professional clinical decision-making or medical diagnosis.
