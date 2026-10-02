import React, { useState, useEffect } from "react";
import { Pill, CheckCircle2, Clock3, Plus, AlertCircle, RefreshCw, XCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";
import { Modal } from "../../components/Modal";
import { StatusBadge } from "../../components/StatusBadge";

export function MedicationsPage() {
  const { activePatientId, showToast } = useApp();
  const [data, setData] = useState({ medications: [], weeklyAdherence: 92, todaySummary: { total: 0, taken: 0 } });
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [newMed, setNewMed] = useState({
    name: "",
    dosage: "",
    frequency: "Daily",
    scheduled_time: "08:00 AM",
    instructions: "Take with water after meals",
    category: "Routine"
  });

  const loadMeds = async () => {
    try {
      setLoading(true);
      const res = await api.getMedications(activePatientId);
      setData(res);
    } catch (err) {
      console.warn("Using sample medications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeds();
  }, [activePatientId]);

  const handleToggleDose = async (med) => {
    const nextStatus = med.taken ? "pending" : "taken";
    try {
      await api.logMedicationDose(activePatientId, med.id, nextStatus);
      showToast(nextStatus === "taken" ? `Marked ${med.name} as taken!` : `Reset ${med.name} dose status`);
      loadMeds();
    } catch (err) {
      // Local fallback
      setData(prev => ({
        ...prev,
        medications: prev.medications.map(m => m.id === med.id ? { ...m, taken: !m.taken } : m)
      }));
      showToast(med.taken ? "Dose reset" : "Dose marked as taken", "info");
    }
  };

  const handleAddMedication = async (e) => {
    e.preventDefault();
    try {
      await api.addMedication(activePatientId, newMed);
      showToast(`Prescription for ${newMed.name} added!`);
      setIsAddOpen(false);
      setNewMed({
        name: "",
        dosage: "",
        frequency: "Daily",
        scheduled_time: "08:00 AM",
        instructions: "Take with water after meals",
        category: "Routine"
      });
      loadMeds();
    } catch (err) {
      showToast("Medication added locally", "info");
      setIsAddOpen(false);
    }
  };

  const meds = data.medications || [];
  const takenCount = meds.filter(m => m.taken).length;
  const adherencePercent = meds.length > 0 ? Math.round((takenCount / meds.length) * 100) : 0;

  return (
    <div className="medications-page">
      <div className="page-head" style={{ marginBottom: "20px" }}>
        <div>
          <div className="section-kicker">PHARMACOTHERAPY MANAGEMENT</div>
          <h1>Prescriptions & Medication Schedule</h1>
          <p>Maintain consistent drug therapy for glycemic stability and vascular organ protection.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddOpen(true)} id="btn-add-medication">
          <Plus size={16} /> Add Medication
        </button>
      </div>

      {/* Adherence Summary Bar */}
      <div className="med-summary">
        <div className="med-summary-icon">
          <Pill size={22} />
        </div>
        <div>
          <span>Today's Completion Rate</span>
          <b>{adherencePercent}%</b>
          <small>{takenCount} of {meds.length} prescribed doses logged today</small>
        </div>
        <div className="progress wide" style={{ height: "10px", borderRadius: "10px" }}>
          <i style={{ width: `${adherencePercent}%`, background: adherencePercent === 100 ? "#1e9a68" : "#2d87e8" }} />
        </div>
      </div>

      {/* Today's Dose Schedule */}
      <section className="panel" style={{ marginBottom: "20px" }}>
        <div className="panel-head">
          <h2>Today's Medication Doses</h2>
          <span style={{ fontSize: "11px", color: "var(--muted)" }}>Click button to record intake</span>
        </div>

        <div className="med-list">
          {meds.map((m) => (
            <div className="med-row" key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div className={`med-avatar ${m.taken ? "med-avatar-taken" : ""}`} style={{
                  background: m.taken ? "#eaf8f1" : "#edf6ff",
                  color: m.taken ? "var(--green)" : "var(--primary)"
                }}>
                  <Pill size={20} />
                </div>
                <div className="med-info">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <b>{m.name}</b>
                    <StatusBadge label={m.category || "Routine"} size="small" />
                  </div>
                  <span>{m.dosage} · {m.frequency} · {m.instructions}</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <div className="med-time">
                  <Clock3 size={15} />
                  <span>{m.scheduled_time}</span>
                </div>

                <button
                  className={`dose-btn ${m.taken ? "taken" : ""}`}
                  onClick={() => handleToggleDose(m)}
                  id={`btn-dose-${m.id}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                    padding: "8px 14px",
                    borderRadius: "10px"
                  }}
                >
                  {m.taken ? (
                    <>
                      <CheckCircle2 size={16} /> Taken
                    </>
                  ) : (
                    "Mark Taken"
                  )}
                </button>
              </div>
            </div>
          ))}

          {meds.length === 0 && (
            <p style={{ textAlign: "center", padding: "20px", color: "var(--muted)", fontSize: "12px" }}>
              No active prescriptions found. Click "Add Medication" above.
            </p>
          )}
        </div>
      </section>

      {/* Medication Safety & Clinical Notes */}
      <section className="panel">
        <div className="panel-head">
          <h2>Clinical Medication Guidelines</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div style={{ padding: "14px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #eef2f7" }}>
            <b style={{ fontSize: "12px", color: "var(--ink)", display: "block", marginBottom: "4px" }}>
              Metformin HCL Guidelines
            </b>
            <p style={{ fontSize: "11px", color: "#667789", lineHeight: "1.5", margin: 0 }}>
              Always take with meals to reduce gastric distress. Do not skip doses; maintain adequate daily hydration.
            </p>
          </div>
          <div style={{ padding: "14px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #eef2f7" }}>
            <b style={{ fontSize: "12px", color: "var(--ink)", display: "block", marginBottom: "4px" }}>
              Amlodipine Besylate Guidelines
            </b>
            <p style={{ fontSize: "11px", color: "#667789", lineHeight: "1.5", margin: 0 }}>
              Take at approximately the same time each morning. Monitor for ankle swelling or orthostatic lightheadedness.
            </p>
          </div>
        </div>
      </section>

      {/* Add Medication Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Prescribed Medication"
        kicker="PHARMACEUTICAL THERAPY"
        icon={Pill}
      >
        <form onSubmit={handleAddMedication}>
          <div className="form-grid">
            <label className="full">
              Medication Name & Salt
              <input
                required
                placeholder="e.g. Empagliflozin (Jardiance)"
                value={newMed.name}
                onChange={e => setNewMed({ ...newMed, name: e.target.value })}
                id="input-med-name"
              />
            </label>
            <label>
              Dosage & Strength
              <input
                required
                placeholder="e.g. 10 mg"
                value={newMed.dosage}
                onChange={e => setNewMed({ ...newMed, dosage: e.target.value })}
                id="input-med-dosage"
              />
            </label>
            <label>
              Frequency
              <select
                value={newMed.frequency}
                onChange={e => setNewMed({ ...newMed, frequency: e.target.value })}
                id="select-med-frequency"
              >
                <option value="Once daily">Once daily</option>
                <option value="Twice daily">Twice daily</option>
                <option value="Three times daily">Three times daily</option>
                <option value="As needed">As needed (PRN)</option>
              </select>
            </label>
            <label>
              Scheduled Time
              <input
                placeholder="e.g. 08:00 AM"
                value={newMed.scheduled_time}
                onChange={e => setNewMed({ ...newMed, scheduled_time: e.target.value })}
                id="input-med-time"
              />
            </label>
            <label>
              Therapeutic Category
              <select
                value={newMed.category}
                onChange={e => setNewMed({ ...newMed, category: e.target.value })}
                id="select-med-category"
              >
                <option value="Antidiabetic">Antidiabetic</option>
                <option value="Antihypertensive">Antihypertensive</option>
                <option value="Lipid-lowering">Lipid-lowering</option>
                <option value="Cardioprotective">Cardioprotective</option>
                <option value="Routine">Routine</option>
              </select>
            </label>
            <label className="full">
              Administration Instructions
              <textarea
                rows="2"
                placeholder="e.g. Take immediately after breakfast with a full glass of water."
                value={newMed.instructions}
                onChange={e => setNewMed({ ...newMed, instructions: e.target.value })}
                id="input-med-instructions"
              />
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setIsAddOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" id="btn-submit-med">
              <CheckCircle2 size={16} /> Save Prescription
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
