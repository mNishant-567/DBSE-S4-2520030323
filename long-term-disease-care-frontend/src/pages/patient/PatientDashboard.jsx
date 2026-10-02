import React, { useState, useEffect } from "react";
import {
  HeartPulse, Activity, UserRound, ArrowRight, CheckCircle2, Clock3,
  CalendarDays, Pill, AlertCircle, Plus, ChevronRight, TrendingUp
} from "lucide-react";
import {
  AreaChart, Area, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";
import { StatusBadge } from "../../components/StatusBadge";
import { Modal } from "../../components/Modal";

const defaultTasks = [
  { id: 1, title: "Morning medication", meta: "Metformin 500mg · Completed at 08:14 AM", done: true },
  { id: 2, title: "Log fasting glucose", meta: "Recorded 114 mg/dL before breakfast", done: true },
  { id: 3, title: "20 min brisk aerobic walk", meta: "Care plan wellness target", done: false },
  { id: 4, title: "Evening medication", meta: "Atorvastatin 10mg + Metformin · 09:00 PM", done: false }
];

export function PatientDashboard() {
  const { currentPatient, activePatientId, showToast, setCurrentPage } = useApp();
  const [vitalsData, setVitalsData] = useState([]);
  const [medsData, setMedsData] = useState({ medications: [], weeklyAdherence: 92 });
  const [appointments, setAppointments] = useState([]);
  const [selectedChartMetric, setSelectedChartMetric] = useState("bp"); // 'bp' | 'glucose' | 'heart'
  const [isLogVitalOpen, setIsLogVitalOpen] = useState(false);
  const [tasks, setTasks] = useState(defaultTasks);
  const [savingTasks, setSavingTasks] = useState(() => new Set());

  // Vital form inputs
  const [vitalForm, setVitalForm] = useState({
    systolic: "128",
    diastolic: "81",
    glucose: "114",
    heart_rate: "72",
    weight: "68.2",
    notes: ""
  });

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [vitals, meds, appts, savedTasks] = await Promise.all([
          api.getVitals(activePatientId).catch(() => []),
          api.getMedications(activePatientId).catch(() => ({ medications: [], weeklyAdherence: 92 })),
          api.getAppointments(activePatientId).catch(() => []),
          api.getDailyTasks(activePatientId).catch(() => [])
        ]);

        if (mounted) {
          if (vitals && vitals.length > 0) {
            setVitalsData(vitals);
          } else {
            // fallback
            setVitalsData([
              { date: "2026-09-24", systolic: 126, diastolic: 80, glucose: 112, heart_rate: 72 },
              { date: "2026-09-25", systolic: 129, diastolic: 82, glucose: 118, heart_rate: 74 },
              { date: "2026-09-26", systolic: 124, diastolic: 79, glucose: 109, heart_rate: 70 },
              { date: "2026-09-27", systolic: 131, diastolic: 84, glucose: 121, heart_rate: 76 },
              { date: "2026-09-28", systolic: 127, diastolic: 81, glucose: 115, heart_rate: 71 },
              { date: "2026-09-29", systolic: 125, diastolic: 80, glucose: 110, heart_rate: 70 },
              { date: "2026-09-30", systolic: 128, diastolic: 81, glucose: 114, heart_rate: 72 }
            ]);
          }
          setMedsData(meds);
          setAppointments(appts || []);
          const taskStatus = new Map(savedTasks.map(task => [task.task_key, task.done]));
          setTasks(defaultTasks.map(task => ({
            ...task,
            done: taskStatus.has(String(task.id)) ? taskStatus.get(String(task.id)) : task.done
          })));
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [activePatientId]);

  const toggleTask = async (id) => {
    const target = tasks.find(task => task.id === id);
    if (!target || savingTasks.has(id)) return;

    const done = !target.done;
    setSavingTasks(previous => new Set(previous).add(id));
    try {
      await api.updateDailyTask(activePatientId, String(id), done);
      setTasks(previous => previous.map(task => task.id === id ? { ...task, done } : task));
      showToast(done ? `Completed "${target.title}"!` : `Marked "${target.title}" as pending`);
    } catch (err) {
      showToast(err.message || "Could not save today's task.", "error");
    } finally {
      setSavingTasks(previous => {
        const next = new Set(previous);
        next.delete(id);
        return next;
      });
    }
  };

  const handleSaveVital = async (e) => {
    e.preventDefault();
    try {
      const saved = await api.logVital(activePatientId, vitalForm);
      setVitalsData(prev => [...prev, saved]);
      setIsLogVitalOpen(false);
      showToast("Vitals saved to database and clinical timeline!");
    } catch (err) {
      showToast("Saved locally to timeline", "info");
      setVitalsData(prev => [...prev, { ...vitalForm, date: new Date().toISOString().split("T")[0] }]);
      setIsLogVitalOpen(false);
    }
  };

  const latestVital = vitalsData[vitalsData.length - 1] || {
    systolic: 128,
    diastolic: 81,
    glucose: 114,
    heart_rate: 72,
    weight: 68.2
  };

  const chartFormattedData = vitalsData.map(v => ({
    ...v,
    day: v.date ? v.date.slice(5) : "Day"
  }));

  return (
    <div className="patient-dashboard-container">
      {/* Top Banner */}
      <div className="welcome-banner">
        <div>
          <div className="banner-icon">
            <HeartPulse size={24} />
          </div>
          <div>
            <b>Welcome back, {currentPatient?.name || "Ananya Rao"}</b>
            <span>
              Long-Term Care Focus: <strong>{currentPatient?.condition || "Type 2 Diabetes & Hypertension"}</strong> · Care Coordinator: {currentPatient?.care_coordinator || "Ramesh Kumar, RN"}
            </span>
          </div>
        </div>
        <button
          className="btn btn-white"
          onClick={() => setIsLogVitalOpen(true)}
          id="btn-log-today-vitals"
        >
          <Plus size={16} /> Log Today's Vitals
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <HeartPulse size={19} />
          </div>
          <span className="metric-label">Blood Pressure</span>
          <div className="metric-value">
            {latestVital.systolic} / {latestVital.diastolic} <small>mmHg</small>
          </div>
          <div className="metric-trend positive">
            <TrendingUp size={13} /> Target: &lt; 130/80 mmHg (Optimal)
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Activity size={19} />
          </div>
          <span className="metric-label">Fasting Glucose</span>
          <div className="metric-value">
            {latestVital.glucose} <small>mg/dL</small>
          </div>
          <div className="metric-trend positive">
            <TrendingUp size={13} /> Target: 90 - 120 mg/dL (In range)
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <HeartPulse size={19} />
          </div>
          <span className="metric-label">Resting Heart Rate</span>
          <div className="metric-value">
            {latestVital.heart_rate || 72} <small>BPM</small>
          </div>
          <div className="metric-trend positive">
            <TrendingUp size={13} /> Normal sinus rhythm (60-80)
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <UserRound size={19} />
          </div>
          <span className="metric-label">Current Weight</span>
          <div className="metric-value">
            {latestVital.weight || 68.2} <small>kg</small>
          </div>
          <div className="metric-trend positive">
            <TrendingUp size={13} /> Down 0.4 kg this month
          </div>
        </div>
      </div>

      {/* Middle Two-Column: Interactive Chart & Daily Care Plan */}
      <div className="two-col">
        {/* Health Trends Panel */}
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Biometric Health Trends</h2>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--muted)" }}>
                Continuous readings tracked in your digital health record
              </p>
            </div>
            {/* Chart toggle buttons */}
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                className={`btn btn-ghost ${selectedChartMetric === "bp" ? "btn-primary" : ""}`}
                style={{ padding: "5px 9px", fontSize: "10px" }}
                onClick={() => setSelectedChartMetric("bp")}
              >
                Blood Pressure
              </button>
              <button
                className={`btn btn-ghost ${selectedChartMetric === "glucose" ? "btn-primary" : ""}`}
                style={{ padding: "5px 9px", fontSize: "10px" }}
                onClick={() => setSelectedChartMetric("glucose")}
              >
                Glucose
              </button>
              <button
                className={`btn btn-ghost ${selectedChartMetric === "heart" ? "btn-primary" : ""}`}
                style={{ padding: "5px 9px", fontSize: "10px" }}
                onClick={() => setSelectedChartMetric("heart")}
              >
                Heart Rate
              </button>
            </div>
          </div>

          <div className="chart-legend" style={{ marginBottom: "10px" }}>
            {selectedChartMetric === "bp" && (
              <>
                <span><i className="dot blue" /> Systolic (mmHg)</span>
                <span><i className="dot purple" /> Diastolic (mmHg)</span>
              </>
            )}
            {selectedChartMetric === "glucose" && (
              <span><i className="dot purple" /> Fasting Blood Glucose (mg/dL)</span>
            )}
            {selectedChartMetric === "heart" && (
              <span><i className="dot blue" /> Heart Rate (BPM)</span>
            )}
          </div>

          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartFormattedData}>
                <defs>
                  <linearGradient id="sysGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2d87e8" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#2d87e8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gluGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8066e8" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#8066e8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#eef2f7" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#8996a7", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8996a7", fontSize: 11 }} domain={['dataMin - 10', 'dataMax + 10']} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e5ebf2",
                    fontSize: 12,
                    boxShadow: "0 6px 18px rgba(0,0,0,0.06)"
                  }}
                />
                {selectedChartMetric === "bp" && (
                  <>
                    <Area type="monotone" dataKey="systolic" name="Systolic" stroke="#2d87e8" strokeWidth={2.5} fill="url(#sysGrad)" />
                    <Area type="monotone" dataKey="diastolic" name="Diastolic" stroke="#8066e8" strokeWidth={2} fill="none" />
                  </>
                )}
                {selectedChartMetric === "glucose" && (
                  <Area type="monotone" dataKey="glucose" name="Glucose (mg/dL)" stroke="#8066e8" strokeWidth={2.5} fill="url(#gluGrad)" />
                )}
                {selectedChartMetric === "heart" && (
                  <Area type="monotone" dataKey="heart_rate" name="Heart Rate (BPM)" stroke="#2d87e8" strokeWidth={2.5} fill="url(#sysGrad)" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Today's Care Plan Checklist */}
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Today's Care Protocol</h2>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--muted)" }}>
                Click to mark daily care tasks
              </p>
            </div>
            <button className="text-btn" onClick={() => setCurrentPage("Care Plan")}>
              View Full Plan <ArrowRight size={14} />
            </button>
          </div>

          <div className="task-list">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="task"
                style={{ cursor: "pointer" }}
                onClick={() => toggleTask(task.id)}
                role="button"
                aria-pressed={task.done}
                aria-disabled={savingTasks.has(task.id)}
                tabIndex={0}
                onKeyDown={event => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleTask(task.id);
                  }
                }}
              >
                <div className={`task-check ${task.done ? "done" : ""}`}>
                  {task.done && <CheckCircle2 size={14} />}
                </div>
                <div>
                  <b style={{ textDecoration: task.done ? "line-through" : "none", color: task.done ? "#7c8c9e" : "var(--ink)" }}>
                    {task.title}
                  </b>
                  <span>{task.meta}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #edf1f5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "#6e7e90" }}>
              {tasks.filter(t => t.done).length} of {tasks.length} tasks completed today
            </span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--primary)" }}>
              {Math.round((tasks.filter(t => t.done).length / tasks.length) * 100)}%
            </span>
          </div>
        </section>
      </div>

      {/* Bottom Row: Upcoming Appointments & Medication Adherence */}
      <div className="two-col bottom-gap">
        {/* Appointments Preview */}
        <section className="panel">
          <div className="panel-head">
            <h2>Upcoming Care Consultations</h2>
            <button className="text-btn" onClick={() => setCurrentPage("Appointments")}>
              All Appointments <ArrowRight size={14} />
            </button>
          </div>

          {appointments.slice(0, 2).map((a, i) => (
            <div className="appointment-row" key={i}>
              <div className={`date-block ${a.color || "blue"}`}>
                <b>{a.date ? a.date.split("-")[2] || "04" : "04"}</b>
                <span>OCT</span>
              </div>
              <div>
                <b>{a.title}</b>
                <span>{a.clinician_name} · {a.type} · {a.time}</span>
              </div>
              <StatusBadge label={a.status || "Scheduled"} />
            </div>
          ))}

          {appointments.length === 0 && (
            <p style={{ fontSize: "12px", color: "var(--muted)", textAlign: "center", padding: "15px" }}>
              No upcoming appointments. Click below to schedule.
            </p>
          )}

          <button
            className="btn btn-ghost"
            style={{ width: "100%", justifyContent: "center", marginTop: "12px" }}
            onClick={() => setCurrentPage("Appointments")}
          >
            <CalendarDays size={16} /> Schedule Consultation / Test
          </button>
        </section>

        {/* Medication Adherence Overview */}
        <section className="panel">
          <div className="panel-head">
            <h2>Medication Adherence (Past 7 Days)</h2>
            <button className="text-btn" onClick={() => setCurrentPage("Medications")}>
              Manage Doses <ArrowRight size={14} />
            </button>
          </div>

          <div className="adherence">
            <div className="ring">
              <span>{medsData.weeklyAdherence || 92}%</span>
            </div>
            <div>
              <b style={{ fontSize: "13px" }}>Strong Compliance</b>
              <p>
                Consistent intake of Metformin and Amlodipine prevents glucose surges and vascular strain.
              </p>
              <span className="success-text">
                <CheckCircle2 size={14} /> Prescribed regimen on track
              </span>
            </div>
          </div>

          <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => setCurrentPage("Medications")}
            >
              <Pill size={15} /> Check Today's Doses
            </button>
            <button
              className="btn btn-ghost"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => setCurrentPage("Lab Tests")}
            >
              Review Lab Reports
            </button>
          </div>
        </section>
      </div>

      {/* Log Vital Modal */}
      <Modal
        isOpen={isLogVitalOpen}
        onClose={() => setIsLogVitalOpen(false)}
        title="Log Today's Biometric Readings"
        kicker="VITAL SIGNS LOGGER"
        icon={HeartPulse}
      >
        <form onSubmit={handleSaveVital}>
          <div className="form-grid">
            <label>
              Systolic BP (mmHg)
              <input
                type="number"
                required
                value={vitalForm.systolic}
                onChange={e => setVitalForm({ ...vitalForm, systolic: e.target.value })}
                placeholder="e.g. 126"
                id="input-systolic"
              />
            </label>
            <label>
              Diastolic BP (mmHg)
              <input
                type="number"
                required
                value={vitalForm.diastolic}
                onChange={e => setVitalForm({ ...vitalForm, diastolic: e.target.value })}
                placeholder="e.g. 80"
                id="input-diastolic"
              />
            </label>
            <label>
              Fasting Blood Sugar (mg/dL)
              <input
                type="number"
                value={vitalForm.glucose}
                onChange={e => setVitalForm({ ...vitalForm, glucose: e.target.value })}
                placeholder="e.g. 114"
                id="input-glucose"
              />
            </label>
            <label>
              Heart Rate (BPM)
              <input
                type="number"
                value={vitalForm.heart_rate}
                onChange={e => setVitalForm({ ...vitalForm, heart_rate: e.target.value })}
                placeholder="e.g. 72"
                id="input-heart-rate"
              />
            </label>
            <label className="full">
              Weight (kg)
              <input
                type="number"
                step="0.1"
                value={vitalForm.weight}
                onChange={e => setVitalForm({ ...vitalForm, weight: e.target.value })}
                placeholder="e.g. 68.2"
                id="input-weight"
              />
            </label>
            <label className="full">
              Clinical Context / Self-Report Notes
              <textarea
                rows="2"
                value={vitalForm.notes}
                onChange={e => setVitalForm({ ...vitalForm, notes: e.target.value })}
                placeholder="e.g. Taken 15 mins after waking up, prior to morning tea."
                id="input-vital-notes"
              />
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setIsLogVitalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" id="btn-submit-vital">
              <CheckCircle2 size={16} /> Save Reading
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
