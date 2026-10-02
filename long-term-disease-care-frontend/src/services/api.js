// CareSync REST API Service Client
// Connects to /api endpoints with automatic fallback to local memory state

const API_BASE = "/api";

async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.warn(`[CareSync API] Request to ${endpoint} failed:`, error.message);
    throw error;
  }
}

export const api = {
  // Health
  checkHealth: () => request("/health"),

  // Database Reset / Re-sync
  resetDatabase: () => request("/reset-database", { method: "POST" }),

  // Patients
  getPatients: () => request("/patients"),
  getPatient: (id) => request(`/patients/${id}`),
  getPatientSettings: (id) => request(`/patients/${id}/settings`),
  savePatientSettings: (id, data) => request(`/patients/${id}/settings`, { method: "PUT", body: JSON.stringify(data) }),
  createPatient: (data) => request("/patients", { method: "POST", body: JSON.stringify(data) }),
  updatePatient: (id, data) => request(`/patients/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deletePatient: (id) => request(`/patients/${id}`, { method: "DELETE" }),

  // Vitals
  getVitals: (patientId) => request(`/patients/${patientId}/vitals`),
  logVital: (patientId, data) => request(`/patients/${patientId}/vitals`, { method: "POST", body: JSON.stringify(data) }),
  deleteVital: (id) => request(`/vitals/${id}`, { method: "DELETE" }),
  getDailyTasks: (patientId) => request(`/patients/${patientId}/daily-tasks`),
  updateDailyTask: (patientId, taskKey, done) => request(`/patients/${patientId}/daily-tasks/${taskKey}`, {
    method: "PUT",
    body: JSON.stringify({ done })
  }),

  // Medications
  getMedications: (patientId) => request(`/patients/${patientId}/medications`),
  addMedication: (patientId, data) => request(`/patients/${patientId}/medications`, { method: "POST", body: JSON.stringify(data) }),
  deleteMedication: (id) => request(`/medications/${id}`, { method: "DELETE" }),
  logMedicationDose: (patientId, medId, status) => request(`/patients/${patientId}/medications/${medId}/log`, {
    method: "POST",
    body: JSON.stringify({ status })
  }),

  // Appointments
  getAppointments: (patientId) => request(`/patients/${patientId}/appointments`),
  bookAppointment: (patientId, data) => request(`/patients/${patientId}/appointments`, { method: "POST", body: JSON.stringify(data) }),
  updateAppointment: (id, data) => request(`/appointments/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteAppointment: (id) => request(`/appointments/${id}`, { method: "DELETE" }),

  // Symptoms
  getSymptoms: (patientId) => request(`/patients/${patientId}/symptoms`),
  logSymptom: (patientId, data) => request(`/patients/${patientId}/symptoms`, { method: "POST", body: JSON.stringify(data) }),
  deleteSymptom: (id) => request(`/symptoms/${id}`, { method: "DELETE" }),

  // Lab Tests & Reports
  getLabTests: (patientId) => request(`/patients/${patientId}/lab-tests`),
  addLabTest: (patientId, data) => request(`/patients/${patientId}/lab-tests`, { method: "POST", body: JSON.stringify(data) }),
  deleteLabTest: (id) => request(`/lab-tests/${id}`, { method: "DELETE" }),

  // Care Plan
  getCarePlan: (patientId) => request(`/patients/${patientId}/care-plan`),
  updateCarePlanGoal: (patientId, goalIndex, data) => request(`/patients/${patientId}/care-plan/goal/${goalIndex}`, {
    method: "PUT",
    body: JSON.stringify(data)
  }),

  // Messages
  getMessages: (patientId) => request(`/patients/${patientId}/messages`),
  sendMessage: (patientId, data) => request(`/patients/${patientId}/messages`, { method: "POST", body: JSON.stringify(data) }),

  // Alerts
  getAlerts: () => request("/alerts"),
  resolveAlert: (id, status = "Resolved") => request(`/alerts/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  }),

  // Analytics
  getAnalyticsSummary: () => request("/analytics/summary"),
};
