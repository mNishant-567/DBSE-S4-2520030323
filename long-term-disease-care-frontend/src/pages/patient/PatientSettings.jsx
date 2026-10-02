import React, { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";

export function PatientSettings() {
  const { activePatientId, currentPatient, showToast, triggerRefresh } = useApp();

  const [formData, setFormData] = useState({
    name: currentPatient?.name || "Ananya Rao",
    email: currentPatient?.email || "ananya.rao@example.com",
    phone: currentPatient?.phone || "+91 98765 43210",
    emergency_contact: currentPatient?.emergency_contact || "+91 98765 43219 (Spouse)",
    doctor_name: currentPatient?.doctor_name || "Dr. Priya Menon",
    reminders_med: true,
    reminders_vitals: true,
    reminders_appts: true,
    telehealth_optin: true
  });

  useEffect(() => {
    let mounted = true;
    api.getPatientSettings(activePatientId).then(settings => {
      if (mounted) setFormData(settings);
    }).catch(() => {
      if (mounted) showToast("Could not load saved settings from the server.", "error");
    });
    return () => { mounted = false; };
  }, [activePatientId, showToast]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.savePatientSettings(activePatientId, formData);
      triggerRefresh();
      showToast("Profile and notification preferences saved.");
    } catch (err) {
      showToast(err.message || "Could not save settings to the server.", "error");
    }
  };

  return (
    <div className="patient-settings-page">
      <div className="page-head" style={{ marginBottom: "20px" }}>
        <div>
          <div className="section-kicker">USER PROFILE & CLINICAL SETTINGS</div>
          <h1>Account & Notification Preferences</h1>
          <p>Manage contact credentials, emergency delegates, and automated medication reminder notifications.</p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="settings-grid">
          {/* Profile details */}
          <section className="panel">
            <div className="panel-head">
              <h2>Patient Identity & Clinical Record</h2>
            </div>

            <div className="settings-profile">
              <div className="avatar large" style={{ background: "var(--primary)", color: "#fff" }}>
                {currentPatient?.avatar_initials || "AR"}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px" }}>{currentPatient?.name || "Ananya Rao"}</h3>
                <p style={{ margin: "2px 0", color: "var(--muted)", fontSize: "12px" }}>
                  Record ID: <strong>{currentPatient?.id || "PT-1042"}</strong> · Blood Group: <strong>{currentPatient?.blood_group || "B+"}</strong>
                </p>
                <span style={{ fontSize: "11px", color: "var(--primary)", fontWeight: 700 }}>
                  Diagnoses: {currentPatient?.condition || "Type 2 Diabetes & Hypertension"}
                </span>
              </div>
            </div>

            <div className="form-grid">
              <label>
                Full Legal Name
                <input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  id="input-settings-name"
                />
              </label>
              <label>
                Email Address
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  id="input-settings-email"
                />
              </label>
              <label>
                Phone Number
                <input
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  id="input-settings-phone"
                />
              </label>
              <label>
                Emergency Contact
                <input
                  value={formData.emergency_contact}
                  onChange={e => setFormData({ ...formData, emergency_contact: e.target.value })}
                  id="input-settings-emergency"
                />
              </label>
              <label className="full">
                Assigned Primary Care Endocrinologist
                <input
                  disabled
                  value={formData.doctor_name}
                  style={{ background: "#f0f4f9", cursor: "not-allowed" }}
                  id="input-settings-doctor"
                />
              </label>
            </div>
          </section>

          {/* Preferences */}
          <section className="panel">
            <div className="panel-head">
              <h2>Automated Reminders & Telemetry Alerts</h2>
            </div>

            <div className="preference">
              <div>
                <b>Medication Dose Push Reminders</b>
                <span>Receive scheduled dose notifications at 08:00 AM, 01:00 PM, and 09:00 PM.</span>
              </div>
              <input
                type="checkbox"
                checked={formData.reminders_med}
                onChange={e => setFormData({ ...formData, reminders_med: e.target.checked })}
                id="toggle-med-reminders"
              />
            </div>

            <div className="preference">
              <div>
                <b>Fasting Glucose & BP Morning Nudge</b>
                <span>Prompt to record resting blood pressure and glucose before breakfast.</span>
              </div>
              <input
                type="checkbox"
                checked={formData.reminders_vitals}
                onChange={e => setFormData({ ...formData, reminders_vitals: e.target.checked })}
                id="toggle-vitals-reminders"
              />
            </div>

            <div className="preference">
              <div>
                <b>Upcoming Care Reviews & Lab Tests</b>
                <span>Notify 48 hours prior to lab blood draws or clinician consultations.</span>
              </div>
              <input
                type="checkbox"
                checked={formData.reminders_appts}
                onChange={e => setFormData({ ...formData, reminders_appts: e.target.checked })}
                id="toggle-appt-reminders"
              />
            </div>

            <div className="preference">
              <div>
                <b>Telehealth & Asynchronous Care Sync</b>
                <span>Allow doctor to view daily biometric charts and suggest care plan updates.</span>
              </div>
              <input
                type="checkbox"
                checked={formData.telehealth_optin}
                onChange={e => setFormData({ ...formData, telehealth_optin: e.target.checked })}
                id="toggle-telehealth-sync"
              />
            </div>

            <div style={{ marginTop: "24px" }}>
              <button type="submit" className="btn btn-primary" id="btn-save-settings">
                <Save size={16} /> Save Settings & Preferences
              </button>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}
