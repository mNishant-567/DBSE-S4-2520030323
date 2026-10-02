import React from "react";
import {
  HeartPulse, LayoutDashboard, ClipboardCheck, Pill, CalendarDays,
  Activity, MessageCircle, Settings, Users, AlertCircle, TestTube2,
  ShieldCheck, Zap, ArrowRight, UserCheck
} from "lucide-react";
import { useApp } from "../context/AppContext";

export function Sidebar() {
  const {
    role,
    currentPage,
    setCurrentPage,
    mobileMenuOpen,
    setMobileMenuOpen,
    unreadAlertsCount,
    currentPatient
  } = useApp();

  const patientNav = [
    { id: "Dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "Vitals", label: "Vitals Tracker", icon: HeartPulse },
    { id: "Medications", label: "Medications", icon: Pill },
    { id: "Appointments", label: "Appointments", icon: CalendarDays },
    { id: "Symptoms", label: "Symptom Journal", icon: Activity },
    { id: "Lab Tests", label: "Lab & Diagnostics", icon: TestTube2 },
    { id: "Care Plan", label: "Care Plan", icon: ClipboardCheck },
    { id: "Messages", label: "Care Team Chat", icon: MessageCircle },
    { id: "Settings", label: "Profile & Settings", icon: Settings },
  ];

  const clinicianNav = [
    { id: "Dashboard", label: "Cohort Overview", icon: LayoutDashboard },
    { id: "Patients", label: "Patient Directory", icon: Users },
    { id: "Care Plans", label: "Care Protocols", icon: ClipboardCheck },
    { id: "Appointments", label: "Appointments", icon: CalendarDays },
    { id: "Alerts", label: "Clinical Alerts", icon: AlertCircle, badge: unreadAlertsCount },
    { id: "Messages", label: "Messages", icon: MessageCircle },
    { id: "Settings", label: "Settings", icon: Settings },
  ];

  const adminNav = [
    { id: "Dashboard", label: "Admin Console", icon: LayoutDashboard },
    { id: "Patients & Staff", label: "Patients & Staff", icon: Users },
    { id: "Care Protocols", label: "Care Protocols", icon: ClipboardCheck },
    { id: "Audit Logs", label: "Audit & Compliance", icon: ShieldCheck },
    { id: "Settings", label: "System Config", icon: Settings },
  ];

  const items = role === "Patient" ? patientNav : role === "Clinician" ? clinicianNav : adminNav;

  const handleNavClick = (pageId) => {
    setCurrentPage(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <aside className={`sidebar ${mobileMenuOpen ? "mobile-open" : ""}`} id="main-sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-mark">
          <HeartPulse size={20} />
        </div>
        <span>Care<span>Sync</span></span>
      </div>

      {/* Role Workspace Indicator */}
      <div className="workspace">
        <span className="workspace-dot" />
        <div>
          <small>Role Context</small>
          <b>{role} Workspace</b>
        </div>
        <UserCheck size={16} style={{ color: "#778597" }} />
      </div>

      {/* Navigation */}
      <nav className="side-nav">
        <small className="nav-label">NAVIGATION</small>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              className={isActive ? "active" : ""}
              onClick={() => handleNavClick(item.id)}
              id={`nav-item-${item.id.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.badge > 0 && <i className="nav-count">{item.badge}</i>}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-bottom">
        <div className="help-card">
          <div className="help-icon">
            <Zap size={16} />
          </div>
          <div>
            <b>CareSync Help</b>
            <span>24/7 Clinical Support</span>
          </div>
          <ArrowRight size={14} style={{ color: "#778597" }} />
        </div>

        <div className="profile-mini">
          <div className="avatar">
            {role === "Patient" ? (currentPatient?.avatar_initials || "AR") : role === "Clinician" ? "PM" : "AD"}
          </div>
          <div>
            <b>{role === "Patient" ? (currentPatient?.name || "Ananya Rao") : role === "Clinician" ? "Dr. Priya Menon" : "System Administrator"}</b>
            <span>{role === "Patient" ? (currentPatient?.id || "PT-1042") : role === "Clinician" ? "Lead Endocrinologist" : "IT Ops & Governance"}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
