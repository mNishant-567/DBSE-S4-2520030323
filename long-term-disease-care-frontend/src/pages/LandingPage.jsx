import React from "react";
import {
  HeartPulse, ArrowRight, ShieldCheck, Activity, Pill, CalendarDays,
  TestTube2, Users, Database, Sparkles, CheckCircle2, ChevronRight
} from "lucide-react";
import { useApp } from "../context/AppContext";

export function LandingPage({ onEnter }) {
  const { setRole } = useApp();

  const handleLaunchRole = (selectedRole) => {
    setRole(selectedRole);
    onEnter();
  };

  return (
    <div className="landing">
      <div className="landing-glow glow-one" />
      <div className="landing-glow glow-two" />

      {/* Navigation */}
      <nav className="landing-nav">
        <div className="brand">
          <div className="brand-mark">
            <HeartPulse size={20} />
          </div>
          <span>Care<span>Sync</span></span>
        </div>

        <div className="landing-nav-links">
          <span>Patient Portal</span>
          <span>Clinician Triage</span>
          <span>Diagnostic Labs</span>
          <span>Full-Stack REST API</span>
        </div>

        <button
          className="btn btn-dark"
          onClick={() => handleLaunchRole("Patient")}
          id="btn-nav-open-demo"
        >
          Open App <ArrowRight size={16} />
        </button>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="pulse-dot" /> Long-Term Disease Care & Multidisciplinary Coordination
          </div>
          <h1>
            One continuous workspace for the <em>entire</em> chronic care journey.
          </h1>
          <p>
            Connected telemetry, personalized clinical care plans, automated medication adherence tracking, diagnostic lab archives, and real-time care team triage.
          </p>

          <div className="hero-actions" style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <button
              className="btn btn-primary btn-large"
              onClick={() => handleLaunchRole("Patient")}
              id="btn-hero-patient-portal"
            >
              Explore Patient Portal <ArrowRight size={18} />
            </button>
            <button
              className="btn btn-ghost btn-large"
              onClick={() => handleLaunchRole("Clinician")}
              id="btn-hero-clinician-portal"
            >
              Clinician Suite <Users size={17} />
            </button>
            <button
              className="btn btn-ghost btn-large"
              onClick={() => handleLaunchRole("Admin")}
              id="btn-hero-admin-portal"
            >
              Admin Console <ShieldCheck size={17} />
            </button>
          </div>

          <div className="trust" style={{ marginTop: "14px" }}>
            <ShieldCheck size={17} color="var(--green)" />
            <span>Full-Stack architecture backed by persistent SQLite relational database & REST APIs</span>
          </div>

          <div className="hero-stats">
            <div>
              <strong>3</strong>
              <span>Role-Based Portals</span>
            </div>
            <div>
              <strong>100%</strong>
              <span>Full CRUD Persistence</span>
            </div>
            <div>
              <strong>SQLite</strong>
              <span>ACID Storage</span>
            </div>
            <div>
              <strong>24/7</strong>
              <span>Telemetry Triage</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive Visual */}
        <div className="hero-visual">
          <div className="dashboard-window">
            <div className="window-top">
              <div className="window-dots">
                <i /><i /><i />
              </div>
              <span>CareSync / Patient Telemetry Overview</span>
              <div className="mini-user">AR</div>
            </div>

            <div className="preview-grid">
              <div className="preview-main">
                <div className="preview-label">
                  Chronic Care Cohort <span>✦ Ananya Rao (PT-1042)</span>
                </div>
                <h3 style={{ margin: "6px 0 14px", fontFamily: "Manrope" }}>
                  Type 2 Diabetes & Hypertension
                </h3>

                <div className="preview-cards">
                  <div>
                    <span>Blood Pressure</span>
                    <b>128 / 81</b>
                    <small>Optimal (Target &lt; 130/80)</small>
                  </div>
                  <div>
                    <span>Fasting Glucose</span>
                    <b>114 mg/dL</b>
                    <small>Within Target Range</small>
                  </div>
                </div>

                <div className="preview-chart">
                  <div className="chart-caption">
                    <span>Blood Pressure (Systolic) 7-Day Trend</span>
                    <b>Stable</b>
                  </div>
                  <div style={{ height: "60px", background: "linear-gradient(90deg, #eef7ff, #e3f1ff)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Activity size={24} color="var(--primary)" />
                  </div>
                </div>
              </div>

              <div className="preview-side">
                <div className="side-title">Today's Protocol</div>
                <div className="todo done">
                  <CheckCircle2 size={16} />
                  <span>Morning Metformin 500mg</span>
                </div>
                <div className="todo done">
                  <CheckCircle2 size={16} />
                  <span>Log fasting blood glucose</span>
                </div>
                <div className="todo">
                  <HeartPulse size={16} />
                  <span>20 min aerobic walk</span>
                </div>

                <div className="next-card">
                  <small>Next Care Review</small>
                  <b>04 Oct</b>
                  <span>with Dr. Priya Menon</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars Grid */}
      <section style={{ maxWidth: "1240px", margin: "40px auto 60px", padding: "0 28px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div className="section-kicker">COMPREHENSIVE MULTIDISCIPLINARY PLATFORM</div>
          <h2 style={{ fontFamily: "Manrope", fontSize: "28px", margin: "6px 0" }}>
            Designed for the Full Spectrum of Long-Term Disease Care
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "14px", maxWidth: "600px", margin: "auto" }}>
            Every tool required by patients, endocrinologists, nephrologists, care coordinators, and administrators in a single harmonious environment.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
          <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: "14px", padding: "20px", boxShadow: "var(--shadow)" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#edf6ff", color: "var(--primary)", display: "grid", placeItems: "center", marginBottom: "14px" }}>
              <HeartPulse size={22} />
            </div>
            <b style={{ fontSize: "15px", fontFamily: "Manrope" }}>Continuous Vitals & Biometrics</b>
            <p style={{ fontSize: "12px", color: "#667586", lineHeight: "1.6", margin: "8px 0 0" }}>
              Record systolic/diastolic blood pressure, blood glucose, heart rate, and weight with interactive 7/14/30-day area charts and target thresholds.
            </p>
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: "14px", padding: "20px", boxShadow: "var(--shadow)" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#f1edff", color: "var(--purple)", display: "grid", placeItems: "center", marginBottom: "14px" }}>
              <Pill size={22} />
            </div>
            <b style={{ fontSize: "15px", fontFamily: "Manrope" }}>Medication Adherence Engine</b>
            <p style={{ fontSize: "12px", color: "#667586", lineHeight: "1.6", margin: "8px 0 0" }}>
              Track daily morning, afternoon, and bedtime doses with one-click intake logging, historical weekly adherence rates, and instructions.
            </p>
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: "14px", padding: "20px", boxShadow: "var(--shadow)" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#eaf8f1", color: "var(--green)", display: "grid", placeItems: "center", marginBottom: "14px" }}>
              <TestTube2 size={22} />
            </div>
            <b style={{ fontSize: "15px", fontFamily: "Manrope" }}>Diagnostic Lab Archive</b>
            <p style={{ fontSize: "12px", color: "#667586", lineHeight: "1.6", margin: "8px 0 0" }}>
              Longitudinal tracking of HbA1c, renal filtration (eGFR, Creatinine), and lipid profiles with normal vs abnormal reference flags and exportable reports.
            </p>
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: "14px", padding: "20px", boxShadow: "var(--shadow)" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#fff5df", color: "var(--amber)", display: "grid", placeItems: "center", marginBottom: "14px" }}>
              <Activity size={22} />
            </div>
            <b style={{ fontSize: "15px", fontFamily: "Manrope" }}>Symptom & Adverse Reaction Journal</b>
            <p style={{ fontSize: "12px", color: "#667586", lineHeight: "1.6", margin: "8px 0 0" }}>
              Record symptoms with a visual 1-5 severity scale, quick symptom chips, duration, and automatic priority escalation for severe ratings.
            </p>
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: "14px", padding: "20px", boxShadow: "var(--shadow)" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#edf6ff", color: "var(--primary)", display: "grid", placeItems: "center", marginBottom: "14px" }}>
              <CalendarDays size={22} />
            </div>
            <b style={{ fontSize: "15px", fontFamily: "Manrope" }}>Appointments & Follow-up Calendar</b>
            <p style={{ fontSize: "12px", color: "#667586", lineHeight: "1.6", margin: "8px 0 0" }}>
              Schedule care reviews, lab draws, and telehealth video calls with preparation checklists and automatic rescheduling/cancellation.
            </p>
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: "14px", padding: "20px", boxShadow: "var(--shadow)" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#eaf8f1", color: "var(--green)", display: "grid", placeItems: "center", marginBottom: "14px" }}>
              <Database size={22} />
            </div>
            <b style={{ fontSize: "15px", fontFamily: "Manrope" }}>Persistent SQLite Backend & REST API</b>
            <p style={{ fontSize: "12px", color: "#667586", lineHeight: "1.6", margin: "8px 0 0" }}>
              Integrated Express server with built-in Node.js SQLite relational database ensuring ACID data integrity and seamless frontend-backend syncing.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="landing-bottom">
        <span>BUILT FOR</span>
        <b>Patients Living with Chronic Conditions</b>
        <b>Specialist Clinicians & Endocrinologists</b>
        <b>Care Coordinators</b>
        <b>Health System Administrators</b>
      </div>
    </div>
  );
}
