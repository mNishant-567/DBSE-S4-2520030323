import React, { useState, useEffect } from "react";
import { TestTube2, Plus, Download, Printer, CheckCircle2, AlertCircle, FileText, ChevronRight } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";
import { Modal } from "../../components/Modal";
import { StatusBadge } from "../../components/StatusBadge";

export function LabTestsPage() {
  const { activePatientId, showToast, currentPatient } = useApp();
  const [labTests, setLabTests] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [form, setForm] = useState({
    test_name: "",
    category: "Diabetes Profile",
    date: new Date().toISOString().split("T")[0],
    result_value: "",
    unit: "mg/dL",
    reference_range: "Normal: 70 - 99 mg/dL",
    status: "Normal",
    clinician_notes: "",
    technician: "CareSync Central Clinical Laboratory"
  });

  const loadLabTests = async () => {
    try {
      const data = await api.getLabTests(activePatientId);
      setLabTests(data);
    } catch (err) {
      console.warn("Using sample lab tests:", err);
    }
  };

  useEffect(() => {
    loadLabTests();
  }, [activePatientId]);

  const handleAddTest = async (e) => {
    e.preventDefault();
    try {
      await api.addLabTest(activePatientId, form);
      showToast("Lab test result recorded successfully!");
      setIsAddOpen(false);
      setForm({
        test_name: "",
        category: "Diabetes Profile",
        date: new Date().toISOString().split("T")[0],
        result_value: "",
        unit: "mg/dL",
        reference_range: "",
        status: "Normal",
        clinician_notes: "",
        technician: "CareSync Central Clinical Laboratory"
      });
      loadLabTests();
    } catch (err) {
      showToast("Saved locally to lab log", "info");
      setLabTests(prev => [{ ...form, id: Date.now() }, ...prev]);
      setIsAddOpen(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const categories = ["All", "Diabetes Profile", "Renal Function", "Lipid Profile"];
  const filtered = selectedCategory === "All"
    ? labTests
    : labTests.filter(t => t.category === selectedCategory);

  // Key biomarkers
  const hba1c = labTests.find(t => t.test_name.toLowerCase().includes("hba1c"));
  const egfr = labTests.find(t => t.test_name.toLowerCase().includes("egfr") || t.test_name.toLowerCase().includes("creatinine"));
  const ldl = labTests.find(t => t.test_name.toLowerCase().includes("ldl"));

  return (
    <div className="lab-tests-page">
      <div className="page-head" style={{ marginBottom: "20px" }}>
        <div>
          <div className="section-kicker">DIAGNOSTIC PATHOLOGY & LAB SURVEILLANCE</div>
          <h1>Medical Test & Lab Diagnostic Reports</h1>
          <p>Longitudinal tracking of glycemic control (HbA1c), renal markers, and lipid panels.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-ghost" onClick={handlePrint} id="btn-print-labs">
            <Printer size={15} /> Print / Export Summary
          </button>
          <button className="btn btn-primary" onClick={() => setIsAddOpen(true)} id="btn-add-lab-test">
            <Plus size={16} /> Enter Lab Result
          </button>
        </div>
      </div>

      {/* Biomarker Summary Cards */}
      <div className="metric-grid" style={{ marginBottom: "20px" }}>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: "#f1edff", color: "var(--purple)" }}>
            <TestTube2 size={20} />
          </div>
          <span className="metric-label">HbA1c (Glycated Hb)</span>
          <div className="metric-value">
            {hba1c ? hba1c.result_value : "6.8"} <small>%</small>
          </div>
          <div className="metric-trend warn">
            Target: &lt; 6.5% · Borderline controlled
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: "#eaf8f1", color: "var(--green)" }}>
            <TestTube2 size={20} />
          </div>
          <span className="metric-label">Renal Function (eGFR)</span>
          <div className="metric-value">
            {egfr ? egfr.result_value : "88"} <small>mL/min</small>
          </div>
          <div className="metric-trend positive">
            Kidney filtration rate intact
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: "#edf6ff", color: "var(--primary)" }}>
            <TestTube2 size={20} />
          </div>
          <span className="metric-label">LDL-C (Cholesterol)</span>
          <div className="metric-value">
            {ldl ? ldl.result_value : "94"} <small>mg/dL</small>
          </div>
          <div className="metric-trend positive">
            Target: &lt; 100 mg/dL for Diabetics
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: "#fff5df", color: "var(--amber)" }}>
            <TestTube2 size={20} />
          </div>
          <span className="metric-label">Next Diagnostic Test</span>
          <div className="metric-value" style={{ fontSize: "17px", marginTop: "8px" }}>
            10 Oct 2026
          </div>
          <div className="metric-trend positive">
            Quarterly Fasting Panel
          </div>
        </div>
      </div>

      {/* Category filter pills */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {categories.map((c) => (
          <button
            key={c}
            className={`btn btn-ghost ${selectedCategory === c ? "btn-primary" : ""}`}
            style={{ padding: "6px 12px", fontSize: "11px", borderRadius: "20px" }}
            onClick={() => setSelectedCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Lab Results Table */}
      <section className="panel">
        <div className="panel-head">
          <h2>Clinical Diagnostic Records ({filtered.length})</h2>
          <span style={{ fontSize: "11px", color: "var(--muted)" }}>Official certified lab findings</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Test / Biomarker</th>
                <th>Category</th>
                <th>Date Taken</th>
                <th>Reported Result</th>
                <th>Reference Range</th>
                <th>Status</th>
                <th>Clinical Interpretation & Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <TestTube2 size={16} color="var(--primary)" />
                      <b style={{ color: "var(--ink)", fontSize: "12px" }}>{t.test_name}</b>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: "11px", color: "#667789" }}>{t.category}</span>
                  </td>
                  <td><b>{t.date}</b></td>
                  <td>
                    <strong style={{ fontSize: "13px", color: "var(--ink)" }}>
                      {t.result_value} {t.unit}
                    </strong>
                  </td>
                  <td style={{ fontSize: "10px", color: "#748496" }}>
                    {t.reference_range}
                  </td>
                  <td>
                    <StatusBadge label={t.status || "Normal"} />
                  </td>
                  <td style={{ maxWidth: "260px", fontSize: "11px", color: "#566677" }}>
                    {t.clinician_notes || "Within established limits."}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "24px", color: "var(--muted)" }}>
                    No lab test entries found for this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Enter Lab Test Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Diagnostic Laboratory Result"
        kicker="PATHOLOGY ARCHIVE"
        icon={TestTube2}
      >
        <form onSubmit={handleAddTest}>
          <div className="form-grid">
            <label className="full">
              Test Name / Biomarker
              <input
                required
                placeholder="e.g. Fasting Lipid Profile - Triglycerides"
                value={form.test_name}
                onChange={e => setForm({ ...form, test_name: e.target.value })}
                id="input-lab-test-name"
              />
            </label>
            <label>
              Panel Category
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                id="select-lab-category"
              >
                <option value="Diabetes Profile">Diabetes Profile</option>
                <option value="Renal Function">Renal Function</option>
                <option value="Lipid Profile">Lipid Profile</option>
                <option value="Liver Function">Liver Function</option>
                <option value="Complete Blood Count">Complete Blood Count</option>
              </select>
            </label>
            <label>
              Date of Test
              <input
                type="date"
                required
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                id="input-lab-date"
              />
            </label>
            <label>
              Result Value
              <input
                required
                placeholder="e.g. 142"
                value={form.result_value}
                onChange={e => setForm({ ...form, result_value: e.target.value })}
                id="input-lab-value"
              />
            </label>
            <label>
              Measurement Unit
              <input
                placeholder="e.g. mg/dL, %, mL/min"
                value={form.unit}
                onChange={e => setForm({ ...form, unit: e.target.value })}
                id="input-lab-unit"
              />
            </label>
            <label className="full">
              Reference Range
              <input
                placeholder="e.g. Normal: 70 - 99 mg/dL"
                value={form.reference_range}
                onChange={e => setForm({ ...form, reference_range: e.target.value })}
                id="input-lab-ref-range"
              />
            </label>
            <label>
              Clinical Evaluation Status
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                id="select-lab-status"
              >
                <option value="Normal">Normal</option>
                <option value="Borderline">Borderline</option>
                <option value="Abnormal">Abnormal / Critical</option>
              </select>
            </label>
            <label>
              Analyzing Laboratory
              <input
                value={form.technician}
                onChange={e => setForm({ ...form, technician: e.target.value })}
                id="input-lab-technician"
              />
            </label>
            <label className="full">
              Clinician Assessment Notes
              <textarea
                rows="2"
                placeholder="e.g. Showing improved lipid control post-statin adjustment."
                value={form.clinician_notes}
                onChange={e => setForm({ ...form, clinician_notes: e.target.value })}
                id="input-lab-notes"
              />
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setIsAddOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" id="btn-submit-lab-test">
              <CheckCircle2 size={16} /> Save Lab Result
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
