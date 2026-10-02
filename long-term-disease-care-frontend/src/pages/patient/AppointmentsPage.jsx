import React, { useState, useEffect } from "react";
import { CalendarDays, Clock3, MapPin, User, Plus, CheckCircle2, X, AlertCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";
import { Modal } from "../../components/Modal";
import { StatusBadge } from "../../components/StatusBadge";

export function AppointmentsPage() {
  const { activePatientId, showToast } = useApp();
  const [appointments, setAppointments] = useState([]);
  const [isBookOpen, setIsBookOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    clinician_name: "Dr. Priya Menon",
    type: "Consultation",
    date: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0],
    time: "10:30 AM",
    location: "Endocrinology OPD - Room 302",
    notes: "",
    color: "blue"
  });

  const loadAppointments = async () => {
    try {
      const data = await api.getAppointments(activePatientId);
      setAppointments(data);
    } catch (err) {
      console.warn("Using sample appointments:", err);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [activePatientId]);

  const handleBook = async (e) => {
    e.preventDefault();
    try {
      await api.bookAppointment(activePatientId, form);
      showToast("Appointment scheduled successfully!");
      setIsBookOpen(false);
      setForm({
        title: "",
        clinician_name: "Dr. Priya Menon",
        type: "Consultation",
        date: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0],
        time: "10:30 AM",
        location: "Endocrinology OPD - Room 302",
        notes: "",
        color: "blue"
      });
      loadAppointments();
    } catch (err) {
      showToast("Scheduled in local calendar", "info");
      setAppointments(prev => [...prev, { ...form, id: Date.now(), status: "Scheduled" }]);
      setIsBookOpen(false);
    }
  };

  const handleCancel = async (id, title) => {
    try {
      await api.updateAppointment(id, { status: "Cancelled" });
      showToast(`Cancelled appointment "${title}"`);
      loadAppointments();
    } catch (err) {
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "Cancelled" } : a));
      showToast(`Cancelled "${title}"`, "info");
    }
  };

  const upcoming = appointments.filter(a => a.status === "Scheduled");
  const past = appointments.filter(a => a.status !== "Scheduled");

  return (
    <div className="appointments-page">
      <div className="page-head" style={{ marginBottom: "20px" }}>
        <div>
          <div className="section-kicker">CARE VISITS & CLINICAL TESTING</div>
          <h1>Appointments & Follow-up Scheduling</h1>
          <p>Coordinate routine chronic disease checkups, diagnostic screenings, and tele-consultations.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsBookOpen(true)} id="btn-book-appointment">
          <Plus size={16} /> Schedule Appointment
        </button>
      </div>

      {/* Upcoming Visits Grid */}
      <h2 style={{ fontFamily: "Manrope", fontSize: "16px", marginBottom: "12px" }}>
        Upcoming Visits ({upcoming.length})
      </h2>
      <div className="appointment-grid" style={{ marginBottom: "30px" }}>
        {upcoming.map((a) => {
          const dateParts = (a.date || "").split("-");
          const day = dateParts[2] || "04";
          return (
            <div className="appointment-card" key={a.id} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "14px" }}>
                <div className={`appointment-date ${a.color || "blue"}`}>
                  <b>{day}</b>
                  <span>OCT</span>
                </div>
                <div className="appointment-main">
                  <StatusBadge label={a.type || "Consultation"} />
                  <h3 style={{ margin: "8px 0 4px", fontSize: "13px" }}>{a.title}</h3>
                  <p style={{ margin: "2px 0", color: "#6c7d91", fontSize: "11px" }}>
                    <User size={13} style={{ display: "inline", marginRight: "4px" }} />
                    {a.clinician_name}
                  </p>
                  <p style={{ margin: "2px 0", color: "#6c7d91", fontSize: "11px" }}>
                    <Clock3 size={13} style={{ display: "inline", marginRight: "4px" }} />
                    {a.time}
                  </p>
                  <p style={{ margin: "2px 0", color: "#6c7d91", fontSize: "11px" }}>
                    <MapPin size={13} style={{ display: "inline", marginRight: "4px" }} />
                    {a.location || "CareSync Clinical Center"}
                  </p>
                </div>
              </div>

              {a.notes && (
                <div style={{ margin: "10px 0 0", padding: "8px 10px", background: "#f8fafc", borderRadius: "8px", fontSize: "10px", color: "#687a8e" }}>
                  <strong>Preparation:</strong> {a.notes}
                </div>
              )}

              <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #edf1f5", display: "flex", justifyContent: "flex-end" }}>
                <button
                  className="btn btn-ghost"
                  style={{ color: "var(--red)", borderColor: "#ffd9dc", padding: "6px 10px", fontSize: "10px" }}
                  onClick={() => handleCancel(a.id, a.title)}
                  id={`btn-cancel-appt-${a.id}`}
                >
                  Cancel Visit
                </button>
              </div>
            </div>
          );
        })}

        {upcoming.length === 0 && (
          <p style={{ gridColumn: "1/-1", textAlign: "center", padding: "30px", background: "#fff", borderRadius: "14px", border: "1px solid var(--line)", color: "var(--muted)", fontSize: "12px" }}>
            No upcoming appointments scheduled. Click "Schedule Appointment" to plan your next review.
          </p>
        )}
      </div>

      {/* Past Visit History */}
      <h2 style={{ fontFamily: "Manrope", fontSize: "16px", marginBottom: "12px" }}>
        Completed & Past Visits ({past.length})
      </h2>
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Care Visit / Screening</th>
                <th>Clinician</th>
                <th>Type</th>
                <th>Status</th>
                <th>Clinical Notes & Outcomes</th>
              </tr>
            </thead>
            <tbody>
              {past.map((a) => (
                <tr key={a.id}>
                  <td><b>{a.date}</b></td>
                  <td>{a.title}</td>
                  <td>{a.clinician_name}</td>
                  <td>{a.type}</td>
                  <td><StatusBadge label={a.status} /></td>
                  <td style={{ color: "#6c7d91" }}>{a.notes || "Visit concluded satisfactorily."}</td>
                </tr>
              ))}
              {past.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "20px", color: "var(--muted)" }}>
                    No previous visits recorded in this timeline.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Book Appointment Modal */}
      <Modal
        isOpen={isBookOpen}
        onClose={() => setIsBookOpen(false)}
        title="Schedule Care Consultation or Test"
        kicker="APPOINTMENT BOOKING"
        icon={CalendarDays}
      >
        <form onSubmit={handleBook}>
          <div className="form-grid">
            <label className="full">
              Reason for Visit / Procedure Name
              <input
                required
                placeholder="e.g. Quarterly Diabetic Care Review"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                id="input-appt-title"
              />
            </label>
            <label>
              Clinician / Specialist
              <select
                value={form.clinician_name}
                onChange={e => setForm({ ...form, clinician_name: e.target.value })}
                id="select-appt-clinician"
              >
                <option value="Dr. Priya Menon">Dr. Priya Menon (Endocrinology)</option>
                <option value="Dr. Arvind Roy">Dr. Arvind Roy (Nephrology & Cardiology)</option>
                <option value="CareSync Central Lab">CareSync Central Diagnostics Lab</option>
                <option value="Ramesh Kumar, RN">Ramesh Kumar, RN (Care Coordinator)</option>
              </select>
            </label>
            <label>
              Visit Modality
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                id="select-appt-type"
              >
                <option value="Consultation">Clinical Consultation (In-Person)</option>
                <option value="Medical test">Medical / Diagnostic Test</option>
                <option value="Follow-up">Routine Follow-up</option>
                <option value="Care review">Care Plan Review</option>
                <option value="Telehealth">Telehealth Video Call</option>
              </select>
            </label>
            <label>
              Date
              <input
                type="date"
                required
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                id="input-appt-date"
              />
            </label>
            <label>
              Preferred Time
              <input
                placeholder="e.g. 10:30 AM"
                required
                value={form.time}
                onChange={e => setForm({ ...form, time: e.target.value })}
                id="input-appt-time"
              />
            </label>
            <label className="full">
              Clinic Location / Telehealth Link
              <input
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Room 302 or CareSync Video Room"
                id="input-appt-location"
              />
            </label>
            <label className="full">
              Patient Instructions / Fasting Requirements
              <textarea
                rows="2"
                placeholder="e.g. 10 hours overnight fasting required for glucose & lipid draw."
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                id="input-appt-notes"
              />
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setIsBookOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" id="btn-submit-appt">
              <CheckCircle2 size={16} /> Confirm Booking
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
