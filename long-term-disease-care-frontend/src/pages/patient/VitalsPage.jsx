import React, { useState, useEffect } from "react";
import { HeartPulse, Plus, Activity, Calendar, FileText, CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";
import { AreaChart, Area, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";
import { Modal } from "../../components/Modal";
import { StatusBadge } from "../../components/StatusBadge";

export function VitalsPage() {
  const { activePatientId, showToast } = useApp();
  const [vitals, setVitals] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'bp' | 'glucose'

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    systolic: "",
    diastolic: "",
    glucose: "",
    heart_rate: "",
    weight: "",
    notes: ""
  });

  const loadVitals = async () => {
    try {
      const data = await api.getVitals(activePatientId);
      setVitals(data);
    } catch (e) {
      console.warn("Using sample vitals:", e);
    }
  };

  useEffect(() => {
    loadVitals();
  }, [activePatientId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.logVital(activePatientId, form);
      showToast("Biometric reading logged successfully!");
      setIsModalOpen(false);
      setForm({
        date: new Date().toISOString().split("T")[0],
        systolic: "",
        diastolic: "",
        glucose: "",
        heart_rate: "",
        weight: "",
        notes: ""
      });
      loadVitals();
    } catch (err) {
      showToast("Recorded to local session timeline", "info");
      setVitals(prev => [...prev, { ...form, id: Date.now() }]);
      setIsModalOpen(false);
    }
  };

  const chartData = vitals.map(v => ({
    ...v,
    day: v.date ? v.date.slice(5) : "Day"
  }));

  return (
    <div className="vitals-page">
      <div className="page-head" style={{ marginBottom: "20px" }}>
        <div>
          <div className="section-kicker">CHRONIC BIOMETRIC MONITORING</div>
          <h1>Vitals & Health Metrics Tracker</h1>
          <p>Continuous physiological telemetry for diabetes and cardiovascular health control.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} id="btn-add-vital-entry">
          <Plus size={16} /> Log New Reading
        </button>
      </div>

      {/* Target Reference Guidelines Banner */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "12px",
        marginBottom: "20px"
      }}>
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: "12px", padding: "14px" }}>
          <b style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
            <HeartPulse size={16} color="var(--primary)" /> Target Blood Pressure
          </b>
          <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#68788c" }}>
            Optimal: <strong>&lt; 130 / 80 mmHg</strong>. Stage 1 threshold: 130-139 / 80-89.
          </p>
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: "12px", padding: "14px" }}>
          <b style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Activity size={16} color="#8066e8" /> Target Fasting Glucose
          </b>
          <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#68788c" }}>
            Fasting goal: <strong>90 - 120 mg/dL</strong>. Post-meal goal: &lt; 160 mg/dL.
          </p>
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: "12px", padding: "14px" }}>
          <b style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
            <TrendingUp size={16} color="var(--green)" /> Target Resting Pulse
          </b>
          <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#68788c" }}>
            Normal Sinus: <strong>60 - 80 BPM</strong>. Notify doctor if sustained &gt; 95 BPM.
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <section className="panel" style={{ marginBottom: "20px" }}>
        <div className="panel-head">
          <h2>Telemetry History & Fluctuations</h2>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              className={`btn btn-ghost ${activeTab === "all" ? "btn-primary" : ""}`}
              style={{ padding: "5px 10px", fontSize: "11px" }}
              onClick={() => setActiveTab("all")}
            >
              Combined View
            </button>
            <button
              className={`btn btn-ghost ${activeTab === "bp" ? "btn-primary" : ""}`}
              style={{ padding: "5px 10px", fontSize: "11px" }}
              onClick={() => setActiveTab("bp")}
            >
              BP Only
            </button>
            <button
              className={`btn btn-ghost ${activeTab === "glucose" ? "btn-primary" : ""}`}
              style={{ padding: "5px 10px", fontSize: "11px" }}
              onClick={() => setActiveTab("glucose")}
            >
              Glucose Only
            </button>
          </div>
        </div>

        <div className="chart-legend" style={{ marginBottom: "12px" }}>
          {(activeTab === "all" || activeTab === "bp") && (
            <>
              <span><i className="dot blue" /> Systolic BP (mmHg)</span>
              <span><i className="dot purple" /> Diastolic BP (mmHg)</span>
            </>
          )}
          {(activeTab === "all" || activeTab === "glucose") && (
            <span><i className="dot purple" /> Fasting Glucose (mg/dL)</span>
          )}
        </div>

        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="sysG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2d87e8" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#2d87e8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gluG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8066e8" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#8066e8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#eef2f7" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#8996a7", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8996a7", fontSize: 11 }} domain={['dataMin - 10', 'dataMax + 10']} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5ebf2", fontSize: 12 }} />
              {(activeTab === "all" || activeTab === "bp") && (
                <>
                  <Area type="monotone" dataKey="systolic" name="Systolic" stroke="#2d87e8" strokeWidth={2.5} fill="url(#sysG)" />
                  <Area type="monotone" dataKey="diastolic" name="Diastolic" stroke="#38a169" strokeWidth={2} fill="none" />
                </>
              )}
              {(activeTab === "all" || activeTab === "glucose") && (
                <Area type="monotone" dataKey="glucose" name="Glucose" stroke="#8066e8" strokeWidth={2.5} fill="url(#gluG)" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Vitals Log Table */}
      <section className="panel">
        <div className="panel-head">
          <h2>Historical Readings Log ({vitals.length} records)</h2>
          <span style={{ fontSize: "11px", color: "var(--muted)" }}>Synchronized with clinic electronic record</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Blood Pressure</th>
                <th>Fasting Glucose</th>
                <th>Heart Rate</th>
                <th>Weight</th>
                <th>Clinical Interpretation</th>
                <th>Patient Notes</th>
              </tr>
            </thead>
            <tbody>
              {vitals.slice().reverse().map((v, i) => {
                const isBpHigh = v.systolic && v.systolic > 135;
                const isGluHigh = v.glucose && v.glucose > 130;
                return (
                  <tr key={v.id || i}>
                    <td>
                      <b style={{ color: "var(--ink)", fontSize: "12px" }}>{v.date}</b>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: isBpHigh ? "var(--red)" : "inherit" }}>
                        {v.systolic || "--"} / {v.diastolic || "--"} mmHg
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: isGluHigh ? "var(--amber)" : "inherit" }}>
                        {v.glucose ? `${v.glucose} mg/dL` : "--"}
                      </span>
                    </td>
                    <td>{v.heart_rate ? `${v.heart_rate} BPM` : "--"}</td>
                    <td>{v.weight ? `${v.weight} kg` : "--"}</td>
                    <td>
                      {isBpHigh || isGluHigh ? (
                        <StatusBadge label="Review Needed" tone="amber" />
                      ) : (
                        <StatusBadge label="Optimal Control" tone="green" />
                      )}
                    </td>
                    <td style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {v.notes || "Self-monitored reading"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Biometric Reading"
        kicker="VITAL TELEMETRY"
        icon={HeartPulse}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="full">
              Date of Measurement
              <input
                type="date"
                required
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                id="input-vitals-date"
              />
            </label>
            <label>
              Systolic BP (mmHg)
              <input
                type="number"
                placeholder="e.g. 124"
                required
                value={form.systolic}
                onChange={e => setForm({ ...form, systolic: e.target.value })}
                id="modal-input-systolic"
              />
            </label>
            <label>
              Diastolic BP (mmHg)
              <input
                type="number"
                placeholder="e.g. 80"
                required
                value={form.diastolic}
                onChange={e => setForm({ ...form, diastolic: e.target.value })}
                id="modal-input-diastolic"
              />
            </label>
            <label>
              Fasting Blood Sugar (mg/dL)
              <input
                type="number"
                placeholder="e.g. 110"
                value={form.glucose}
                onChange={e => setForm({ ...form, glucose: e.target.value })}
                id="modal-input-glucose"
              />
            </label>
            <label>
              Heart Rate (BPM)
              <input
                type="number"
                placeholder="e.g. 72"
                value={form.heart_rate}
                onChange={e => setForm({ ...form, heart_rate: e.target.value })}
                id="modal-input-pulse"
              />
            </label>
            <label className="full">
              Weight (kg)
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 68.4"
                value={form.weight}
                onChange={e => setForm({ ...form, weight: e.target.value })}
                id="modal-input-weight"
              />
            </label>
            <label className="full">
              Notes / Triggers
              <textarea
                rows="2"
                placeholder="e.g. Measured before lunch, rested for 5 minutes prior."
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                id="modal-input-notes"
              />
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" id="btn-save-vitals">
              <CheckCircle2 size={16} /> Save Reading
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
