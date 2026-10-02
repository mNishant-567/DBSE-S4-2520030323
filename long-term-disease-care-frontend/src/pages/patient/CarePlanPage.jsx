import React, { useState, useEffect } from "react";
import { ClipboardCheck, CheckCircle2, HeartPulse, Pill, Activity, ShieldCheck, Plus, ArrowUpRight } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";
import { StatusBadge } from "../../components/StatusBadge";

export function CarePlanPage() {
  const { activePatientId, showToast } = useApp();
  const [carePlan, setCarePlan] = useState(null);
  const [goals, setGoals] = useState([]);
  const [instructions, setInstructions] = useState([]);

  useEffect(() => {
    async function loadPlan() {
      try {
        const plan = await api.getCarePlan(activePatientId);
        setCarePlan(plan);
        setGoals(plan.goals || []);
        setInstructions(plan.instructions || []);
      } catch (err) {
        console.warn("Using sample care plan:", err);
        // Fallback
        setGoals([
          { title: "Maintain Glycemic Control", target: "Fasting glucose 90-120 mg/dL, HbA1c < 6.5%", progress: 85, status: "On Track" },
          { title: "Blood Pressure Regulation", target: "Systolic < 130 mmHg, Diastolic < 80 mmHg", progress: 90, status: "Optimal" },
          { title: "Medication Adherence", target: ">= 95% doses taken on schedule", progress: 92, status: "High" },
          { title: "Physical Activity Target", target: "150 minutes of moderate aerobic walking per week", progress: 78, status: "Progressing" }
        ]);
        setInstructions([
          { title: "Daily Vitals Routine", text: "Record fasting blood glucose and morning resting blood pressure before breakfast." },
          { title: "Medication Timing", text: "Take Metformin immediately after morning and evening meals to minimize GI sensitivity." },
          { title: "Hydration & Activity", text: "Drink at least 2 liters of water daily and take a 20-minute gentle walk post-dinner." }
        ]);
      }
    }
    loadPlan();
  }, [activePatientId]);

  const handleIncrementProgress = async (idx) => {
    const goal = goals[idx];
    const newProgress = Math.min(100, (goal.progress || 0) + 5);
    const updatedGoals = [...goals];
    updatedGoals[idx] = { ...goal, progress: newProgress, status: newProgress >= 95 ? "Achieved" : "On Track" };
    setGoals(updatedGoals);

    try {
      await api.updateCarePlanGoal(activePatientId, idx, { progress: newProgress });
      showToast(`Updated progress on "${goal.title}" to ${newProgress}%!`);
    } catch (e) {
      showToast(`Updated progress to ${newProgress}%`, "info");
    }
  };

  return (
    <div className="care-plan-page">
      <div className="page-head" style={{ marginBottom: "20px" }}>
        <div>
          <div className="section-kicker">PERSONALIZED CHRONIC CARE PROTOCOL</div>
          <h1>Disease Care Plan & Clinical Targets</h1>
          <p>Evidence-based guidelines agreed upon with your endocrinologist and multidisciplinary care team.</p>
        </div>
      </div>

      {/* Plan Summary Header */}
      <div className="plan-summary">
        <div>
          <span>PRIMARY CARE STRATEGY</span>
          <h2>{carePlan?.title || "Type 2 Diabetes & Cardiovascular Risk Management Plan"}</h2>
          <p>
            Stage: <strong>{carePlan?.stage || "Active Maintenance"}</strong> · Started: {carePlan?.start_date || "12 Aug 2026"} · Next Review: {carePlan?.next_review || "04 Oct 2026"}
          </p>
        </div>
        <StatusBadge label="Active Care Plan" tone="green" />
      </div>

      {/* Target Biometrics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "20px" }}>
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: "12px", padding: "16px" }}>
          <span style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>
            TARGET HBA1C
          </span>
          <div style={{ fontFamily: "Manrope", fontSize: "22px", fontWeight: 800, marginTop: "4px", color: "var(--primary)" }}>
            {carePlan?.target_hba1c || "< 6.5%"}
          </div>
          <small style={{ color: "#778598", fontSize: "11px" }}>Current: 6.8% (Target within reach)</small>
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: "12px", padding: "16px" }}>
          <span style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>
            TARGET BLOOD PRESSURE
          </span>
          <div style={{ fontFamily: "Manrope", fontSize: "22px", fontWeight: 800, marginTop: "4px", color: "var(--green)" }}>
            {carePlan?.target_bp || "< 130/80 mmHg"}
          </div>
          <small style={{ color: "#778598", fontSize: "11px" }}>Current average: 128/81 mmHg (Optimal)</small>
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: "12px", padding: "16px" }}>
          <span style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>
            TARGET BODY WEIGHT
          </span>
          <div style={{ fontFamily: "Manrope", fontSize: "22px", fontWeight: 800, marginTop: "4px", color: "#8066e8" }}>
            {carePlan?.target_weight || "66.0 kg"}
          </div>
          <small style={{ color: "#778598", fontSize: "11px" }}>Current: 68.2 kg (Healthy downward slope)</small>
        </div>
      </div>

      {/* Interactive Goals Grid */}
      <h2 style={{ fontFamily: "Manrope", fontSize: "16px", marginBottom: "12px" }}>
        Milestones & Behavioral Goals
      </h2>
      <div className="goal-grid">
        {goals.map((g, idx) => (
          <div className="goal-card" key={idx} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div className="goal-top">
                <div className="goal-icon">
                  <CheckCircle2 size={16} />
                </div>
                <b>{g.title}</b>
                <span>{g.progress}%</span>
              </div>
              <p style={{ margin: "8px 0" }}>{g.target}</p>
              <div className="progress">
                <i style={{ width: `${g.progress}%` }} />
              </div>
            </div>

            <div style={{ marginTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <StatusBadge label={g.status || "On Track"} size="small" />
              <button
                className="btn btn-ghost"
                style={{ padding: "4px 8px", fontSize: "10px" }}
                onClick={() => handleIncrementProgress(idx)}
                id={`btn-increment-goal-${idx}`}
              >
                +5% Progress
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Clinical Guidelines & Routine Instructions */}
      <section className="panel" style={{ marginTop: "20px" }}>
        <div className="panel-head">
          <h2>Daily Instructions & Action Items</h2>
        </div>

        <div className="instruction-list">
          {instructions.map((inst, i) => (
            <div key={i}>
              <ClipboardCheck size={20} color="var(--primary)" />
              <div>
                <b>{inst.title}</b>
                <span>{inst.text}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Nutrition & Lifestyle Section */}
      <div style={{
        marginTop: "20px",
        background: "linear-gradient(135deg, #f0f7ff, #ffffff)",
        border: "1px solid #d2e4f7",
        borderRadius: "14px",
        padding: "18px"
      }}>
        <h3 style={{ fontFamily: "Manrope", fontSize: "14px", margin: "0 0 6px", color: "var(--primary)" }}>
          Dietary & Lifestyle Directive
        </h3>
        <p style={{ margin: 0, fontSize: "12px", color: "#54687d", lineHeight: "1.6" }}>
          {carePlan?.lifestyle_guidelines || "Follow a Mediterranean-style low glycemic meal pattern. Avoid sweetened beverages and processed snacks. Drink at least 2 liters of water daily and take a 20-minute gentle walk post-dinner."}
        </p>
      </div>
    </div>
  );
}
