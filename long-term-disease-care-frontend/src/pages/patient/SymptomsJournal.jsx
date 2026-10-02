import React, { useState, useEffect } from "react";
import { Activity, Plus, AlertCircle, CheckCircle2, Clock3, Tag, MessageSquare } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";
import { StatusBadge } from "../../components/StatusBadge";

export function SymptomsJournal() {
  const { activePatientId, showToast } = useApp();
  const [symptoms, setSymptoms] = useState([]);
  const [symptomName, setSymptomName] = useState("");
  const [severity, setSeverity] = useState(2);
  const [onsetDate, setOnsetDate] = useState(new Date().toISOString().split("T")[0]);
  const [duration, setDuration] = useState("1-2 hours");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const quickSymptoms = [
    "Dizziness upon standing",
    "Afternoon fatigue",
    "Numbness / tingling in feet",
    "Headache",
    "Excessive thirst",
    "Shortness of breath",
    "Nausea post-medication"
  ];

  const loadSymptoms = async () => {
    try {
      const data = await api.getSymptoms(activePatientId);
      setSymptoms(data);
    } catch (err) {
      console.warn("Using sample symptoms:", err);
    }
  };

  useEffect(() => {
    loadSymptoms();
  }, [activePatientId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symptomName.trim()) {
      showToast("Please enter or select a symptom name", "warning");
      return;
    }

    try {
      setSubmitting(true);
      await api.logSymptom(activePatientId, {
        symptom_name: symptomName,
        severity: parseInt(severity),
        onset_date: onsetDate,
        duration,
        notes
      });

      if (severity >= 4) {
        showToast("Severe symptom recorded. High-priority alert sent to clinical team!", "warning");
      } else {
        showToast("Symptom logged to clinical care record.");
      }

      setSymptomName("");
      setSeverity(2);
      setDuration("1-2 hours");
      setNotes("");
      loadSymptoms();
    } catch (err) {
      showToast("Recorded in local journal", "info");
      setSymptoms(prev => [
        {
          id: Date.now(),
          symptom_name: symptomName,
          severity,
          onset_date: onsetDate,
          duration,
          notes,
          status: "Logged"
        },
        ...prev
      ]);
      setSymptomName("");
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityLabel = (lvl) => {
    switch (Number(lvl)) {
      case 1: return { text: "1 — Mild (Noticeable but no interference)", color: "#19865b", bg: "#eaf8f1" };
      case 2: return { text: "2 — Moderate (Manageable discomfort)", color: "#b47712", bg: "#fff5df" };
      case 3: return { text: "3 — Significant (Impairs daily tasks)", color: "#df7418", bg: "#fff1e6" };
      case 4: return { text: "4 — Severe (Urgent attention advised)", color: "#c5444d", bg: "#fdebec" };
      case 5: return { text: "5 — Very Severe (Immediate medical help)", color: "#8a1322", bg: "#fbdfe2" };
      default: return { text: "Moderate", color: "#b47712", bg: "#fff5df" };
    }
  };

  return (
    <div className="symptoms-journal-page">
      <div className="page-head" style={{ marginBottom: "20px" }}>
        <div>
          <div className="section-kicker">ADVERSE EFFECTS & SYMPTOM MONITORING</div>
          <h1>Symptom & Side-Effect Journal</h1>
          <p>Report physical sensations or medication reactions so your care team can adjust your treatment plan promptly.</p>
        </div>
      </div>

      <div className="two-col" style={{ gridTemplateColumns: "1.2fr 1fr", gap: "20px" }}>
        {/* Log Form */}
        <section className="panel">
          <div className="panel-head">
            <h2>Record a Symptom or Side-Effect</h2>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Quick symptom pills */}
            <div style={{ marginBottom: "14px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "6px" }}>
                Common Chronic Disease Symptoms (Click to autofill):
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {quickSymptoms.map((qs) => (
                  <button
                    type="button"
                    key={qs}
                    className="btn btn-ghost"
                    style={{
                      padding: "4px 8px",
                      fontSize: "10px",
                      borderRadius: "15px",
                      background: symptomName === qs ? "var(--blue-soft)" : "#f8fafc",
                      borderColor: symptomName === qs ? "var(--primary)" : "var(--line)",
                      color: symptomName === qs ? "var(--primary)" : "var(--ink)"
                    }}
                    onClick={() => setSymptomName(qs)}
                  >
                    + {qs}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-grid">
              <label className="full">
                Symptom Name / Reaction
                <input
                  required
                  placeholder="e.g. Mild morning lightheadedness upon standing"
                  value={symptomName}
                  onChange={e => setSymptomName(e.target.value)}
                  id="input-symptom-name"
                />
              </label>

              <label className="full">
                Severity Rating (1 to 5)
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", marginTop: "6px" }}>
                  {[1, 2, 3, 4, 5].map((lvl) => {
                    const info = getSeverityLabel(lvl);
                    const isSelected = Number(severity) === lvl;
                    return (
                      <button
                        type="button"
                        key={lvl}
                        onClick={() => setSeverity(lvl)}
                        id={`btn-severity-${lvl}`}
                        style={{
                          padding: "10px 4px",
                          borderRadius: "10px",
                          border: isSelected ? `2px solid ${info.color}` : "1px solid var(--line)",
                          background: isSelected ? info.bg : "#fff",
                          color: isSelected ? info.color : "#5c6b7d",
                          fontWeight: isSelected ? 800 : 600,
                          fontSize: "11px",
                          cursor: "pointer",
                          textAlign: "center"
                        }}
                      >
                        Level {lvl}
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: "6px", fontSize: "11px", color: getSeverityLabel(severity).color, fontWeight: 700 }}>
                  Selected: {getSeverityLabel(severity).text}
                </div>
              </label>

              <label>
                Onset Date
                <input
                  type="date"
                  value={onsetDate}
                  onChange={e => setOnsetDate(e.target.value)}
                  id="input-symptom-date"
                />
              </label>

              <label>
                Approximate Duration
                <input
                  placeholder="e.g. 30 minutes, 2 hours"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  id="input-symptom-duration"
                />
              </label>

              <label className="full">
                Context, Diet, or Triggers
                <textarea
                  rows="3"
                  placeholder="e.g. Noticed dizziness about 20 minutes after taking morning blood pressure medication."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  id="input-symptom-notes"
                />
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              id="btn-save-symptom"
              style={{ width: "100%", justifyContent: "center", marginTop: "10px" }}
            >
              <CheckCircle2 size={16} /> Save Symptom to Care Record
            </button>
          </form>
        </section>

        {/* Symptoms History Timeline */}
        <section className="panel">
          <div className="panel-head">
            <h2>Reported Timeline ({symptoms.length})</h2>
          </div>

          <div className="symptom-history">
            {symptoms.map((s) => {
              const sev = Number(s.severity) || 2;
              const sevClass = sev === 1 ? "mild" : sev === 2 ? "moderate" : "severe";
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 0", borderBottom: "1px solid #edf1f5" }}>
                  <span
                    className={`severity-dot ${sevClass}`}
                    style={{
                      background: sev >= 4 ? "var(--red)" : sev === 3 ? "#df7418" : sev === 2 ? "var(--amber)" : "var(--green)",
                      marginTop: "4px"
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <b style={{ fontSize: "12px", color: "var(--ink)" }}>{s.symptom_name}</b>
                      <StatusBadge label={s.status || "Logged"} size="small" />
                    </div>
                    <small style={{ color: "#7a8a9c", marginTop: "3px", display: "block" }}>
                      Severity {s.severity}/5 · {s.duration || "Recorded"} · {s.onset_date}
                    </small>
                    {s.notes && (
                      <p style={{ margin: "5px 0 0", fontSize: "11px", color: "#596778", background: "#f8fafc", padding: "6px 8px", borderRadius: "6px" }}>
                        {s.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {symptoms.length === 0 && (
              <p style={{ textAlign: "center", padding: "20px", color: "var(--muted)", fontSize: "12px" }}>
                No symptoms recorded yet. Keep your care team informed if you experience any changes.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
