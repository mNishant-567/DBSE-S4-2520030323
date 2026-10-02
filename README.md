# CareSync — Long-Term Disease Treatment Monitoring & Care Coordination Platform

A complete full-stack clinical web application for **Long-Term Disease Care & Treatment Monitoring**, built with a modular React/Vite frontend and an Express backend. The existing frontend API remains compatible; the versioned `/api/v1` API uses PostgreSQL for relational clinical data and MongoDB for flexible reports and logs.

---

## 🚀 Quick Start

Configure PostgreSQL and MongoDB, then prepare the backend once from the `server` folder:

```powershell
Set-Location server
npm install
Copy-Item .env.example .env
npm run migrate
npm run seed
Set-Location ..
```

Set connection strings and a strong JWT secret in `server/.env`. Then, from the workspace root, run both the **Backend REST API** and the **Vite Frontend Client**:

```bash
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend REST API**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Relational/document databases**: PostgreSQL and MongoDB for `/api/v1`; SQLite remains for existing frontend routes
- **Backend setup and route reference**: [server/README.md](server/README.md)

---

## 📂 Project Structure

```
long-term-disease-care-frontend/
├── package.json                         # Root launcher scripts (npm run dev)
├── start-dev.js                         # Concurrent development orchestrator
├── server/                              # Node.js + Express REST API Backend
│   ├── server.js                        # Legacy API plus versioned API startup
│   ├── config/                          # PostgreSQL pool and MongoDB connection
│   ├── controllers/                     # Authentication, CRUD, care workflows
│   ├── migrations/                      # PostgreSQL schema migration
│   ├── models/                          # Mongoose document models
│   ├── routes/                          # Auth, CRUD, document, workflow routes
│   ├── db.js                            # Legacy SQLite schema and seed data
│   ├── caresync.sqlite                  # SQLite database file (auto-generated)
│   └── package.json                     # Express, pg, mongoose, JWT and validation dependencies
└── long-term-disease-care-frontend/     # Modular React + Vite Frontend
    ├── src/
    │   ├── components/                  # Header, Sidebar, Modal, Toast, StatusBadge
    │   ├── context/                     # AppContext (Role, patient, live state)
    │   ├── pages/
    │   │   ├── LandingPage.jsx          # Public showcase & quick portal launcher
    │   │   ├── patient/                 # Patient Portal
    │   │   │   ├── PatientDashboard.jsx # Biometrics overview & today's care protocol
    │   │   │   ├── VitalsPage.jsx       # Telemetry charts & vital sign logger
    │   │   │   ├── MedicationsPage.jsx  # Daily dose tracker & adherence calculator
    │   │   │   ├── AppointmentsPage.jsx # Visit scheduling & clinical tests
    │   │   │   ├── SymptomsJournal.jsx  # 1-5 severity scale & adverse reactions
    │   │   │   ├── LabTestsPage.jsx     # HbA1c, renal, lipids & printable reports
    │   │   │   ├── CarePlanPage.jsx     # Disease milestones & lifestyle directives
    │   │   │   ├── MessagesPage.jsx     # Care team chat with automated replies
    │   │   │   └── PatientSettings.jsx  # Demographics & reminder toggles
    │   │   ├── clinician/               # Clinician Suite
    │   │   │   ├── ClinicianDashboard.jsx
    │   │   │   ├── PatientDirectory.jsx
    │   │   │   └── AlertsTriage.jsx
    │   │   └── admin/                   # Administration & Compliance Console
    │   │       └── AdminPortal.jsx
    │   ├── services/
    │   │   └── api.js                   # REST API client with intelligent fallback
    │   ├── styles.css                   # Polished design system
    │   └── main.jsx                     # Application bootstrap & routing
    ├── vite.config.js                   # Vite configuration with /api proxy
    └── package.json
```
