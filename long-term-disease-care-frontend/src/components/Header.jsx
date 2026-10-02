import React, { useState } from "react";
import { Menu, Bell, Database, CheckCircle2, ChevronDown, User } from "lucide-react";
import { useApp } from "../context/AppContext";

export function Header() {
  const {
    role,
    setRole,
    currentPage,
    setMobileMenuOpen,
    unreadAlertsCount,
    setUnreadAlertsCount,
    showToast,
    backendOnline,
    patients,
    activePatientId,
    setActivePatientId,
    currentPatient
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: "Morning Medication Taken", text: "Metformin 500mg logged for 08:00 AM", time: "1 hr ago", type: "success" },
    { id: 2, title: "Upcoming Care Consultation", text: "Dr. Priya Menon on Oct 4, 10:30 AM", time: "2 hrs ago", type: "info" },
    { id: 3, title: "Lab Result Added", text: "Quarterly HbA1c report available (6.8%)", time: "Yesterday", type: "notice" }
  ];

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (unreadAlertsCount > 0) {
      setUnreadAlertsCount(0);
    }
  };

  return (
    <header className="topbar" id="main-header">
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          className="mobile-menu"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
          id="btn-mobile-menu"
        >
          <Menu size={22} />
        </button>

        <div className="breadcrumbs">
          <span>CareSync</span>
          <b>/</b>
          <strong>{role} Portal</strong>
          <b>/</b>
          <span style={{ color: "var(--primary)", fontWeight: 600 }}>{currentPage}</span>
        </div>
      </div>

      <div className="top-actions">
        {/* Backend Database Status Badge */}
        <div
          className="api-status-badge"
          title={backendOnline ? "Connected to Node.js/SQLite REST API server" : "Local mode active"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "11px",
            padding: "5px 10px",
            borderRadius: "20px",
            background: backendOnline ? "#eaf8f1" : "#fff8e6",
            color: backendOnline ? "#19865b" : "#b47712",
            fontWeight: 600
          }}
        >
          <Database size={13} />
          <span>{backendOnline ? "SQLite DB Online" : "Local State"}</span>
        </div>

        {/* Patient Switcher (Visible in Clinician/Admin or testing) */}
        {role !== "Patient" && patients.length > 0 && (
          <div className="patient-selector" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600 }}>Cohort Patient:</span>
            <select
              value={activePatientId}
              onChange={(e) => {
                setActivePatientId(e.target.value);
                showToast(`Switched view to patient ${e.target.value}`);
              }}
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "5px 9px",
                borderRadius: "8px",
                border: "1px solid var(--line)",
                background: "#fff",
                color: "var(--ink)",
                outline: "none"
              }}
              id="select-cohort-patient"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id}) - {p.condition}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Role Switcher */}
        <div className="role-switch">
          <span>Role View</span>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              showToast(`Switched to ${e.target.value} Portal view`);
            }}
            id="select-user-role"
          >
            <option value="Patient">Patient</option>
            <option value="Clinician">Clinician</option>
            <option value="Admin">Administrator</option>
          </select>
        </div>

        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button
            className="icon-btn notification"
            onClick={handleNotificationClick}
            aria-label="Notifications"
            id="btn-notifications"
          >
            <Bell size={18} />
            {unreadAlertsCount > 0 && <i>{unreadAlertsCount}</i>}
          </button>

          {showNotifications && (
            <div
              className="notification-dropdown"
              style={{
                position: "absolute",
                right: 0,
                top: "44px",
                width: "320px",
                background: "#fff",
                border: "1px solid var(--line)",
                borderRadius: "14px",
                boxShadow: "var(--shadow)",
                padding: "14px",
                zIndex: 50
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <b style={{ fontSize: "12px" }}>Notifications & Alerts</b>
                <span style={{ fontSize: "10px", color: "var(--primary)", cursor: "pointer", fontWeight: 600 }} onClick={() => setShowNotifications(false)}>Close</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {notifications.map((n) => (
                  <div key={n.id} style={{ padding: "8px", borderRadius: "8px", background: "#f8fafc", border: "1px solid #edf2f7" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 700 }}>
                      <span>{n.title}</span>
                      <small style={{ color: "#95a1b0", fontWeight: 400 }}>{n.time}</small>
                    </div>
                    <p style={{ margin: "3px 0 0", fontSize: "10px", color: "#667586" }}>{n.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <div
          className="top-avatar"
          title={role === "Patient" ? `${currentPatient?.name} (${currentPatient?.id})` : role === "Clinician" ? "Dr. Priya Menon" : "Administrator"}
        >
          {role === "Patient" ? (currentPatient?.avatar_initials || "AR") : role === "Clinician" ? "PM" : "AD"}
        </div>
      </div>
    </header>
  );
}
