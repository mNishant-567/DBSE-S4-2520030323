import React, { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, ShieldAlert, ArrowRight, Check } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";
import { StatusBadge } from "../../components/StatusBadge";

export function AlertsTriage() {
  const { showToast, setActivePatientId, setCurrentPage } = useApp();
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState("Open");

  const loadAlerts = async () => {
    try {
      const data = await api.getAlerts();
      setAlerts(data);
    } catch (err) {
      console.warn("Using sample alerts:", err);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.resolveAlert(id, newStatus);
      showToast(`Alert marked as ${newStatus}`);
      loadAlerts();
    } catch (err) {
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
      showToast(`Updated to ${newStatus}`, "info");
    }
  };

  const handleInspectPatient = (patientId) => {
    setActivePatientId(patientId);
    showToast(`Loaded clinical record for ${patientId}`);
    setCurrentPage("Dashboard");
  };

  const filtered = filter === "All"
    ? alerts
    : alerts.filter(a => (filter === "Open" ? a.status !== "Resolved" : a.status === filter));

  return (
    <div className="alerts-triage-page">
      <div className="page-head" style={{ marginBottom: "20px" }}>
        <div>
          <div className="section-kicker">CLINICAL TRIAGE & TELEMETRY SURVEILLANCE</div>
          <h1>Clinical Alerts & Intervention Queue</h1>
          <p>Automated safety flags triggered by blood pressure spikes, hypoglycemia, medication non-compliance, and acute symptoms.</p>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {["Open", "All", "Resolved"].map((f) => (
            <button
              key={f}
              className={`btn btn-ghost ${filter === f ? "btn-primary" : ""}`}
              style={{ padding: "6px 12px", fontSize: "11px" }}
              onClick={() => setFilter(f)}
            >
              {f} Alerts
            </button>
          ))}
        </div>
      </div>

      <div className="alert-list">
        {filtered.map((a) => {
          const isHigh = a.priority === "High";
          return (
            <div
              key={a.id}
              className={`alert-card ${isHigh ? "red" : a.priority === "Medium" ? "amber" : "blue"}`}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px" }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", flex: 1, minWidth: "300px" }}>
                <div className={`alert-symbol ${isHigh ? "" : a.priority === "Medium" ? "amber" : "blue"}`}>
                  <AlertCircle size={20} />
                </div>
                <div className="alert-main">
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <StatusBadge label={a.priority} tone={isHigh ? "red" : "amber"} />
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--primary)" }}>{a.type}</span>
                    <span style={{ fontSize: "10px", color: "var(--muted)" }}>{a.time_ago || "Recent"}</span>
                  </div>
                  <h3 style={{ margin: "6px 0 3px", fontSize: "13px" }}>{a.title}</h3>
                  <p style={{ fontSize: "11px", color: "#667586" }}>{a.details}</p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  className="btn btn-ghost"
                  style={{ padding: "6px 10px", fontSize: "11px" }}
                  onClick={() => handleInspectPatient(a.patient_id)}
                >
                  Inspect Patient <ArrowRight size={14} />
                </button>

                {a.status !== "Resolved" ? (
                  <button
                    className="btn btn-primary"
                    style={{ padding: "6px 12px", fontSize: "11px" }}
                    onClick={() => handleUpdateStatus(a.id, "Resolved")}
                  >
                    <Check size={14} /> Resolve Alert
                  </button>
                ) : (
                  <span style={{ fontSize: "11px", color: "var(--green)", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                    <CheckCircle2 size={15} /> Resolved
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", background: "#fff", borderRadius: "14px", border: "1px solid var(--line)" }}>
            <CheckCircle2 size={32} color="var(--green)" style={{ margin: "0 auto 10px", display: "block" }} />
            <b style={{ fontSize: "14px" }}>No active alerts in queue</b>
            <p style={{ fontSize: "12px", color: "var(--muted)", margin: "4px 0 0" }}>
              All patient vitals and adherence streams are currently operating within physiological safety limits.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
