import React from "react";
import { createRoot } from "react-dom/client";
import { AppProvider, useApp } from "./context/AppContext";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Toast } from "./components/Toast";
import { LandingPage } from "./pages/LandingPage";

// Patient Portal Pages
import { PatientDashboard } from "./pages/patient/PatientDashboard";
import { VitalsPage } from "./pages/patient/VitalsPage";
import { MedicationsPage } from "./pages/patient/MedicationsPage";
import { AppointmentsPage } from "./pages/patient/AppointmentsPage";
import { SymptomsJournal } from "./pages/patient/SymptomsJournal";
import { LabTestsPage } from "./pages/patient/LabTestsPage";
import { CarePlanPage } from "./pages/patient/CarePlanPage";
import { MessagesPage } from "./pages/patient/MessagesPage";
import { PatientSettings } from "./pages/patient/PatientSettings";

// Clinician Portal Pages
import { ClinicianDashboard } from "./pages/clinician/ClinicianDashboard";
import { PatientDirectory } from "./pages/clinician/PatientDirectory";
import { AlertsTriage } from "./pages/clinician/AlertsTriage";

// Admin Portal Pages
import { AdminPortal } from "./pages/admin/AdminPortal";

import "./styles.css";

function MainApp() {
  const {
    isLoggedIn,
    setIsLoggedIn,
    role,
    currentPage,
    mobileMenuOpen,
    setMobileMenuOpen,
    toast
  } = useApp();

  if (!isLoggedIn) {
    return <LandingPage onEnter={() => setIsLoggedIn(true)} />;
  }

  const renderContent = () => {
    // Patient Role
    if (role === "Patient") {
      switch (currentPage) {
        case "Vitals":
          return <VitalsPage />;
        case "Medications":
          return <MedicationsPage />;
        case "Appointments":
          return <AppointmentsPage />;
        case "Symptoms":
          return <SymptomsJournal />;
        case "Lab Tests":
          return <LabTestsPage />;
        case "Care Plan":
          return <CarePlanPage />;
        case "Messages":
          return <MessagesPage />;
        case "Settings":
          return <PatientSettings />;
        case "Dashboard":
        default:
          return <PatientDashboard />;
      }
    }

    // Clinician Role
    if (role === "Clinician") {
      switch (currentPage) {
        case "Patients":
          return <PatientDirectory />;
        case "Care Plans":
          return <CarePlanPage />;
        case "Appointments":
          return <AppointmentsPage />;
        case "Alerts":
          return <AlertsTriage />;
        case "Messages":
          return <MessagesPage />;
        case "Settings":
          return <PatientSettings />;
        case "Dashboard":
        default:
          return <ClinicianDashboard />;
      }
    }

    // Admin Role
    if (role === "Admin") {
      switch (currentPage) {
        case "Patients & Staff":
          return <PatientDirectory />;
        case "Care Protocols":
          return <CarePlanPage />;
        case "Audit Logs":
        case "Settings":
        case "Dashboard":
        default:
          return <AdminPortal />;
      }
    }

    return <PatientDashboard />;
  };

  return (
    <div className="app-shell">
      <Sidebar />

      {mobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
          id="mobile-overlay"
        />
      )}

      <main className="main" id="main-content-region">
        <Header />
        <div className="content">
          {renderContent()}
        </div>
      </main>

      <Toast toast={toast} />
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <AppProvider>
    <MainApp />
  </AppProvider>
);
