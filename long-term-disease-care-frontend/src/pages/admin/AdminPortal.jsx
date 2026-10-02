import React, { useState } from "react";
import { ShieldCheck, Users, Database, Server, Key, Activity, CheckCircle2, Lock } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { StatusBadge } from "../../components/StatusBadge";

export function AdminPortal() {
  const { showToast, backendOnline } = useApp();

  const auditLogs = [
    { id: 1, time: "2026-09-30 08:44", user: "Dr. Priya Menon", action: "Updated care target for PT-1042", ip: "192.168.1.45", status: "Success" },
    { id: 2, time: "2026-09-30 08:32", user: "Ananya Rao", action: "Logged biometric readings (BP: 128/81)", ip: "103.21.14.88", status: "Success" },
    { id: 3, time: "2026-09-30 08:14", user: "Ramesh Kumar, RN", action: "Dispatched medication adherence reminder", ip: "192.168.1.50", status: "Success" },
    { id: 4, time: "2026-09-30 07:50", user: "System Scheduler", action: "Automated daily alert triage evaluation", ip: "127.0.0.1", status: "Verified" }
  ];

  const users = [
    { name: "Dr. Priya Menon", role: "Clinician (Endocrinologist)", email: "priya.menon@hospital.org", patients: 24, status: "Active" },
    { name: "Dr. Arvind Roy", role: "Clinician (Nephrologist)", email: "arvind.roy@hospital.org", patients: 18, status: "Active" },
    { name: "Ramesh Kumar, RN", role: "Care Coordinator", email: "ramesh.kumar@hospital.org", patients: 42, status: "Active" },
    { name: "Ananya Rao", role: "Patient", email: "ananya.rao@example.com", patients: "-", status: "Active" },
    { name: "Admin Governance", role: "Administrator", email: "admin@hospital.org", patients: "-", status: "Active" }
  ];

  return (
    <div className="admin-portal-page">
      <div className="page-head" style={{ marginBottom: "20px" }}>
        <div>
          <div className="section-kicker">HEALTH SYSTEM GOVERNANCE & SECURITY</div>
          <h1>System Administration & Compliance Console</h1>
          <p>Access control, clinical audit logs, database connection telemetry, and regulatory compliance.</p>
        </div>
      </div>

      {/* Admin KPIs */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: "#eaf8f1", color: "var(--green)" }}>
            <Server size={20} />
          </div>
          <span className="metric-label">REST API Service</span>
          <div className="metric-value">
            {backendOnline ? "Online" : "Standby"} <small>port 5000</small>
          </div>
          <div className="metric-trend positive">
            Node.js / Express Architecture
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: "#edf6ff", color: "var(--primary)" }}>
            <Database size={20} />
          </div>
          <span className="metric-label">Database Storage</span>
          <div className="metric-value">
            SQLite <small>caresync.sqlite</small>
          </div>
          <div className="metric-trend positive">
            ACID Relational Storage Active
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: "#f1edff", color: "var(--purple)" }}>
            <Key size={20} />
          </div>
          <span className="metric-label">Role-Based Access (RBAC)</span>
          <div className="metric-value">
            3 <small>Portals</small>
          </div>
          <div className="metric-trend positive">
            Patient / Clinician / Admin
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: "#eaf4ff", color: "var(--primary)" }}>
            <ShieldCheck size={20} />
          </div>
          <span className="metric-label">Audit Compliance</span>
          <div className="metric-value">
            100% <small>compliant</small>
          </div>
          <div className="metric-trend positive">
            Immutable Clinical Logs
          </div>
        </div>
      </div>

      {/* Users & Role Management */}
      <section className="panel" style={{ marginBottom: "20px" }}>
        <div className="panel-head">
          <h2>User Accounts & Clinical Permissions</h2>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User / Clinician</th>
                <th>Role Context</th>
                <th>Official Email</th>
                <th>Assigned Cohort</th>
                <th>Account Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={i}>
                  <td><b>{u.name}</b></td>
                  <td>{u.role}</td>
                  <td>{u.email}</td>
                  <td>{u.patients}</td>
                  <td><StatusBadge label={u.status} tone="green" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Audit Log */}
      <section className="panel">
        <div className="panel-head">
          <h2>Clinical & System Audit Trail</h2>
          <span style={{ fontSize: "11px", color: "var(--muted)" }}>Real-time cryptographic audit stream</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Operator</th>
                <th>Action & Clinical Impact</th>
                <th>Source Address</th>
                <th>Integrity</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td><b>{log.time}</b></td>
                  <td>{log.user}</td>
                  <td>{log.action}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "11px" }}>{log.ip}</td>
                  <td><StatusBadge label={log.status} tone="green" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
