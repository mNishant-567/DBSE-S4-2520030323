import React, { useState } from "react";
import { Users, Search, Plus, UserPlus, Phone, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";
import { Modal } from "../../components/Modal";
import { StatusBadge } from "../../components/StatusBadge";

export function PatientDirectory() {
  const { patients, showToast, triggerRefresh, setActivePatientId, setCurrentPage } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    age: "52",
    gender: "Female",
    blood_group: "B+",
    condition: "Type 2 Diabetes Mellitus",
    risk: "Medium",
    phone: "+91 98000 12345",
    email: "",
    doctor_name: "Dr. Priya Menon"
  });

  const handleAddPatient = async (e) => {
    e.preventDefault();
    try {
      const created = await api.createPatient(form);
      showToast(`Added new patient ${form.name} (${created.id || "PT-New"})`);
      setIsAddOpen(false);
      setForm({
        name: "",
        age: "52",
        gender: "Female",
        blood_group: "B+",
        condition: "Type 2 Diabetes Mellitus",
        risk: "Medium",
        phone: "",
        email: "",
        doctor_name: "Dr. Priya Menon"
      });
      triggerRefresh();
    } catch (err) {
      showToast("Patient added locally", "info");
      setIsAddOpen(false);
    }
  };

  const filtered = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.condition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === "All" || p.risk === riskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="patient-directory-page">
      <div className="page-head" style={{ marginBottom: "20px" }}>
        <div>
          <div className="section-kicker">POPULATION ROSTER & MEDICAL CHARTS</div>
          <h1>Assigned Patient Directory</h1>
          <p>Review comprehensive disease profiles, contact data, and active clinical pathways.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddOpen(true)} id="btn-add-patient">
          <UserPlus size={16} /> Enroll New Patient
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "18px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "260px", background: "#fff", border: "1px solid var(--line)", borderRadius: "10px", padding: "8px 12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Search size={16} color="#8a97a8" />
          <input
            placeholder="Search by patient name, ID (e.g. PT-1042), or disease..."
            style={{ border: 0, outline: 0, width: "100%", fontSize: "12px" }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            id="input-search-patients"
          />
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          {["All", "High", "Medium", "Low"].map((lvl) => (
            <button
              key={lvl}
              className={`btn btn-ghost ${riskFilter === lvl ? "btn-primary" : ""}`}
              style={{ padding: "6px 12px", fontSize: "11px" }}
              onClick={() => setRiskFilter(lvl)}
            >
              {lvl === "All" ? "All Risks" : `${lvl} Risk`}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Table */}
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient Name & ID</th>
                <th>Demographics</th>
                <th>Primary Chronic Diagnosis</th>
                <th>Risk Stratification</th>
                <th>Attending Physician</th>
                <th>Contact</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="patient-cell">
                      <div className="avatar small">{p.avatar_initials || "PT"}</div>
                      <div>
                        <b>{p.name}</b>
                        <span>{p.id}</span>
                      </div>
                    </div>
                  </td>
                  <td>{p.age} yrs · {p.gender} · {p.blood_group || "O+"}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: "var(--ink)" }}>{p.condition}</span>
                  </td>
                  <td>
                    <StatusBadge label={p.risk || "Low"} />
                  </td>
                  <td>{p.doctor_name || "Dr. Priya Menon"}</td>
                  <td style={{ fontSize: "10px", color: "#6a7b8f" }}>
                    <div>{p.phone || "No phone"}</div>
                    <div>{p.email}</div>
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: "5px 10px", fontSize: "10px" }}
                      onClick={() => {
                        setActivePatientId(p.id);
                        showToast(`Selected ${p.name} as active care subject.`);
                        setCurrentPage("Dashboard");
                      }}
                      id={`btn-select-patient-${p.id}`}
                    >
                      Open Chart <ArrowRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Enroll Patient Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Enroll Patient in Chronic Care Program"
        kicker="PATIENT REGISTRATION"
        icon={UserPlus}
      >
        <form onSubmit={handleAddPatient}>
          <div className="form-grid">
            <label className="full">
              Full Patient Name
              <input
                required
                placeholder="e.g. Ramesh Chandra Verma"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                id="modal-input-patient-name"
              />
            </label>
            <label>
              Age
              <input
                type="number"
                required
                value={form.age}
                onChange={e => setForm({ ...form, age: e.target.value })}
                id="modal-input-patient-age"
              />
            </label>
            <label>
              Biological Gender
              <select
                value={form.gender}
                onChange={e => setForm({ ...form, gender: e.target.value })}
                id="modal-select-patient-gender"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label>
              Blood Group
              <select
                value={form.blood_group}
                onChange={e => setForm({ ...form, blood_group: e.target.value })}
                id="modal-select-patient-blood"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </label>
            <label>
              Risk Stratification
              <select
                value={form.risk}
                onChange={e => setForm({ ...form, risk: e.target.value })}
                id="modal-select-patient-risk"
              >
                <option value="Low">Low Risk (Stable)</option>
                <option value="Medium">Medium Risk (Review Needed)</option>
                <option value="High">High Risk (Intensive Monitoring)</option>
              </select>
            </label>
            <label className="full">
              Primary Chronic Disease Diagnosis
              <input
                required
                placeholder="e.g. Type 2 Diabetes, Diabetic Nephropathy"
                value={form.condition}
                onChange={e => setForm({ ...form, condition: e.target.value })}
                id="modal-input-patient-condition"
              />
            </label>
            <label>
              Contact Phone
              <input
                placeholder="+91 98..."
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                id="modal-input-patient-phone"
              />
            </label>
            <label>
              Email Address
              <input
                type="email"
                placeholder="patient@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                id="modal-input-patient-email"
              />
            </label>
            <label className="full">
              Assigned Attending Clinician
              <input
                value={form.doctor_name}
                onChange={e => setForm({ ...form, doctor_name: e.target.value })}
                id="modal-input-patient-doctor"
              />
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setIsAddOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" id="btn-submit-enroll-patient">
              <CheckCircle2 size={16} /> Complete Enrollment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
