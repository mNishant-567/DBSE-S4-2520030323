import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../services/api";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState("Patient"); // 'Patient' | 'Clinician' | 'Admin'
  const [activePatientId, setActivePatientId] = useState("PT-1042");
  const [patients, setPatients] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [currentPage, setCurrentPage] = useState("Dashboard");
  const [toast, setToast] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(3);
  const [backendOnline, setBackendOnline] = useState(true);

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3200);
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // Fetch initial patients list and active patient details
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const patientsData = await api.getPatients();
        if (isMounted) {
          setPatients(patientsData);
          setBackendOnline(true);
        }
      } catch (err) {
        if (isMounted) {
          setBackendOnline(false);
          // Fallback patients
          setPatients([
            { id: "PT-1042", name: "Ananya Rao", age: 54, gender: "Female", condition: "Type 2 Diabetes & Hypertension", risk: "Low", status: "Stable", avatar_initials: "AR" },
            { id: "PT-1038", name: "Rahul Mehta", age: 61, gender: "Male", condition: "Stage 2 Hypertension", risk: "Medium", status: "Review", avatar_initials: "RM" },
            { id: "PT-1027", name: "Meera Nair", age: 48, gender: "Female", condition: "Chronic Kidney Disease", risk: "Low", status: "Stable", avatar_initials: "MN" },
            { id: "PT-1019", name: "Vikram Singh", age: 67, gender: "Male", condition: "Heart Failure & CAD", risk: "High", status: "Attention", avatar_initials: "VS" }
          ]);
        }
      }
    }

    loadInitialData();
    return () => { isMounted = false; };
  }, [refreshKey]);

  // Load current active patient info
  useEffect(() => {
    let isMounted = true;
    async function loadCurrentPatient() {
      try {
        const p = await api.getPatient(activePatientId);
        if (isMounted) setCurrentPatient(p);
      } catch (err) {
        if (isMounted) {
          const matched = patients.find(item => item.id === activePatientId) || patients[0];
          setCurrentPatient(matched || {
            id: "PT-1042",
            name: "Ananya Rao",
            age: 54,
            gender: "Female",
            condition: "Type 2 Diabetes & Hypertension",
            risk: "Low",
            status: "Stable",
            phone: "+91 98765 43210",
            email: "ananya.rao@example.com",
            doctor_name: "Dr. Priya Menon",
            avatar_initials: "AR"
          });
        }
      }
    }

    if (activePatientId) {
      loadCurrentPatient();
    }
  }, [activePatientId, patients, refreshKey]);

  const value = {
    isLoggedIn,
    setIsLoggedIn,
    role,
    setRole: (newRole) => {
      setRole(newRole);
      setCurrentPage("Dashboard");
    },
    activePatientId,
    setActivePatientId,
    patients,
    currentPatient,
    currentPage,
    setCurrentPage,
    toast,
    showToast,
    mobileMenuOpen,
    setMobileMenuOpen,
    triggerRefresh,
    unreadAlertsCount,
    setUnreadAlertsCount,
    backendOnline
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
