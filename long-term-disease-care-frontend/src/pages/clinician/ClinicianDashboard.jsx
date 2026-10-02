import React, { useState, useEffect } from "react";
import { Users, AlertCircle, CalendarDays, MessageCircle, ArrowRight, ShieldCheck, CheckCircle2, UserCheck } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";
import { StatusBadge } from "../../components/StatusBadge";

export function ClinicianDashboard() {
  const { patients, showToast, setActivePatientId, setCurrentPage } = useApp();
  const [alerts, setAlerts] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalPatients: 42,
    highRisk: 4,
    mediumRisk: 9,
    lowRisk: 29,
    openAlerts: 4,
    todayAppointments: 6
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [alertList, summary] = await Promise.all([
          api.getAlerts().catch(() => []),
          api.getAnalyticsSummary().catch(() => null)
        ]);
        if (alertList) setAlerts(alertList);
        if (summary) setAnalytics(summary);
      } catch (e) {
        console.warn(e);
      }
    }
    loadData();
  }, []);

  const handlePatientSelect = (p) => {
    setActivePatientId(p.id);
    showToast(`Loaded clinical record for ${p.name}`);
    setCurrentPage("Dashboard");
  };

  return (
    <div className="clinician-dashboard">
      <div className="page-head" style={{ marginBottom: "20px" }}>
        <div>
          <div className="section-kicker">ENDOCRINOLOGY & MULTIMORBIDITY CARE COHORT</div>
          <h1>Clinical Dashboard & Cohort Overview</h1>
          <p>Real-time population health triage, biometric excursion monitoring, and critical alerts queue.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <Users size={20} />
          </div>
          <span className="metric-label">Assigned Patients</span>
          <div className="metric-value">
            {analytics.totalPatients || patients.length || 42} <small>active</small>
          </div>
          <div className="metric-trend positive">
            +3 onboarded this month
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon warning">
            <AlertCircle size={20} />
          </div>
          <span className="metric-label">Requiring Triage</span>
          <div className="metric-value">
            {analytics.openAlerts || 4} <small>patients</small>
          </div>
          <div className="metric-trend warn">
            Abnormal telemetry flagged
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <CalendarDays size={20} />
          </div>
          <span className="metric-label">Scheduled Reviews</span>
          <div className="metric-value">
            {analytics.todayAppointments || 6} <small>today</small>
          </div>
          <div className="metric-trend positive">
            Next visit at 10:30 AM
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <MessageCircle size={20} />
          </div>
          <span className="metric-label">Care Team Messages</span>
          <div className="metric-value">
            8 <small>unread</small>
          </div>
          <div className="metric-trend positive">
            3 require physician reply
          </div>
        </div>
      </div>

      {/* Cohort Risk Breakdown & Live Alerts */}
      <div className="two-col provider-grid" style={{ marginBottom: "20px" }}>
        <section className="panel">
          <div className="panel-head">
            <h2>Cohort Risk Stratification</h2>
            <button className="text-btn" onClick={() => setCurrentPage("Patients")}>
              View Roster <ArrowRight size={14} />
            </button>
          </div>

          <div className="risk-bars">
            <div className="risk-row">
              <div>
                <span>Low Risk Cohort</span>
                <b>{analytics.lowRisk || 29} <small>/ {analytics.totalPatients || 42}</small></b>
              </div>
              <div className="risk-track">
                <i className="green" style={{ width: "69%" }} />
              </div>
            </div>

            <div className="risk-row">
              <div>
                <span>Moderate Risk (Review Needed)</span>
                <b>{analytics.mediumRisk || 9} <small>/ {analytics.totalPatients || 42}</small></b>
              </div>
              <div className="risk-track">
                <i className="amber" style={{ width: "21%" }} />
              </div>
            </div>

            <div className="risk-row">
              <div>
                <span>High Priority (Clinical Instability)</span>
                <b>{analytics.highRisk || 4} <small>/ {analytics.totalPatients || 42}</small></b>
              </div>
              <div className="risk-track">
                <i className="red" style={{ width: "10%" }} />
              </div>
            </div>
          </div>

          <div className="mini-note">
            <ShieldCheck size={16} />
            <span>
              Stratification algorithm evaluates sustained systolic BP &gt; 140 mmHg, HbA1c &gt; 8.0%, and medication gaps.
            </span>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Critical Telemetry Alerts</h2>
            <button className="text-btn" onClick={() => setCurrentPage("Alerts")}>
              Open Triage Queue <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {alerts.slice(0, 3).map((a) => (
              <div
                key={a.id}
                style={{
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: a.priority === "High" ? "#fdf2f2" : "#fff8e6",
                  borderLeft: `4px solid ${a.priority === "High" ? "var(--red)" : "var(--amber)"}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <b style={{ fontSize: "11px", color: "var(--ink)" }}>{a.title}</b>
                  <p style={{ margin: "2px 0 0", fontSize: "10px", color: "#667587" }}>{a.details}</p>
                </div>
                <StatusBadge label={a.priority} tone={a.priority === "High" ? "red" : "amber"} />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Attention Patient Roster */}
      <section className="panel">
        <div className="panel-head">
          <h2>Patients Requiring Care Review</h2>
          <button className="text-btn" onClick={() => setCurrentPage("Patients")}>
            Complete Directory ({patients.length}) <ArrowRight size={14} />
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Age / Gender</th>
                <th>Chronic Condition</th>
                <th>Risk Profile</th>
                <th>Care Status</th>
                <th>Physician Action</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="patient-cell">
                      <div className="avatar small">{p.avatar_initials || "AR"}</div>
                      <div>
                        <b>{p.name}</b>
                        <span>{p.id}</span>
                      </div>
                    </div>
                  </td>
                  <td>{p.age} yrs · {p.gender}</td>
                  <td>{p.condition}</td>
                  <td>
                    <StatusBadge label={p.risk || "Low"} />
                  </td>
                  <td>
                    <StatusBadge label={p.status || "Stable"} />
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: "5px 10px", fontSize: "10px" }}
                      onClick={() => handlePatientSelect(p)}
                      id={`btn-open-patient-${p.id}`}
                    >
                      Inspect Care Record <ArrowRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
