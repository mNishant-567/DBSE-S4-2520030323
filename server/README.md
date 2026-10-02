# CareSync Backend

The backend keeps the existing SQLite endpoints used by the frontend and adds the requested authenticated API at `/api/v1`. PostgreSQL stores users and relational clinical records; MongoDB stores medical tests, symptom reports, follow-ups, and notification logs.

## Requirements

- Node.js 22.5+ (the legacy SQLite API uses `node:sqlite`)
- PostgreSQL 13+
- MongoDB 6+

## Setup

1. Create a PostgreSQL database named `caresync` and make sure PostgreSQL and MongoDB are running.
2. Copy `.env.example` to `.env` in this folder and set `DATABASE_URL`, `MONGODB_URI`, and a random `JWT_SECRET` of at least 32 characters. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` for the initial administrator.
3. Install dependencies, migrate, and seed:

   ```powershell
   npm install
   npm run migrate
   npm run seed
   ```

4. Start the backend from this folder with `npm run dev`, or start the complete application from the workspace root with `npm run dev`.

The migration is idempotent and creates all PostgreSQL tables and indexes. The seed command creates/resets the configured administrator password and inserts a baseline disease row. Patient accounts can register through the API; administrators create doctor accounts.

## Authentication

Register a patient with `POST /api/v1/auth/register`, then log in through `POST /api/v1/auth/login`. Send the returned token as `Authorization: Bearer <token>`. `GET /api/v1/auth/me` returns the current account. An administrator can create a doctor and login through `POST /api/v1/auth/staff`.

## API Routes

All routes below are prefixed with `/api/v1`. Except for health, patient registration, and login, routes require a JWT. Resource `GET` supports collection and item forms. Relational resources support `POST` collection, `PUT` item, and `DELETE` item, subject to role permissions and ownership. Prescription item paths use both keys.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | API health check |
| POST | `/auth/register` | Register a patient account and patient record |
| POST | `/auth/login` | Authenticate and issue a JWT |
| GET | `/auth/me` | Read the authenticated account |
| POST | `/auth/staff` | Admin creates a doctor account and record |
| GET, POST, PUT, DELETE | `/patients[/:patient_id]` | Patient demographics; patients/doctors are row-scoped |
| GET, POST, PUT, DELETE | `/doctors[/:doctor_id]` | Doctor directory and records |
| GET, POST, PUT, DELETE | `/diseases[/:disease_id]` | Disease catalog |
| GET, POST, PUT, DELETE | `/diagnoses[/:diagnosis_id]` | Patient diagnoses and clinician assignments |
| GET, POST, PUT, DELETE | `/treatment-plans[/:plan_id]` | Diagnosis treatment plans |
| GET, POST, PUT, DELETE | `/medications[/:medication_id]` | Medication catalog |
| GET, POST, PUT, DELETE | `/prescriptions` | Prescriptions collection |
| GET, PUT, DELETE | `/prescriptions/:plan_id/:medication_id` | Individual prescription |
| GET, POST, PUT, DELETE | `/appointments[/:appointment_id]` | Appointment records; use workflow routes for booking/cancellation |
| GET, POST, PATCH, DELETE | `/medical-tests[/:id]` | MongoDB test results with flexible `result` values |
| GET, POST, PATCH, DELETE | `/symptoms[/:id]` | MongoDB symptom reports |
| GET, POST, PATCH, DELETE | `/follow-ups[/:id]` | MongoDB follow-up records |
| GET, POST, PATCH, DELETE | `/notifications[/:id]` | MongoDB notification/reminder log |
| PUT | `/workflows/patients/:patientId/treatment-plan` | Doctor/admin creates or updates a diagnosis, plan, and optional prescriptions atomically |
| GET | `/workflows/me/schedule` | Patient views appointments, treatment plans, and prescriptions |
| POST | `/workflows/appointments` | Patient/doctor/admin books an appointment |
| PATCH | `/workflows/appointments/:appointmentId/cancel` | Patient/assigned doctor/admin cancels a scheduled appointment |
| POST | `/workflows/symptom-reports` | Patient submits a symptom or side-effect report to MongoDB |
| GET | `/workflows/patients/:patientId/clinical-reports` | Doctor/admin views a patient's symptoms and test results |
| GET, POST | `/workflows/treatment-plans/:planId/follow-ups` | View or book follow-ups for an accessible plan |
| PATCH | `/workflows/follow-ups/:followUpId/cancel` | Cancel a scheduled follow-up |

The legacy unversioned `/api` routes remain available to the current frontend and continue to use `server/caresync.sqlite`. New integrations should use `/api/v1`.