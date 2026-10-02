import mongoose from "mongoose";

const followUpSchema = new mongoose.Schema({
  plan_id: { type: String, required: true, index: true },
  patient_id: { type: String, required: true, index: true },
  followup_date: { type: Date, required: true },
  notes: { type: String, trim: true, default: "" },
  status: { type: String, enum: ["scheduled", "completed", "cancelled"], default: "scheduled" }
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, strict: "throw" });

export default mongoose.models.FollowUp || mongoose.model("FollowUp", followUpSchema);