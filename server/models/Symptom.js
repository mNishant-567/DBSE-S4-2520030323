import mongoose from "mongoose";

const symptomSchema = new mongoose.Schema({
  patient_id: { type: String, required: true, index: true },
  plan_id: { type: String, required: true, index: true },
  description: { type: String, required: true, trim: true },
  severity: { type: Number, required: true, min: 1, max: 5 },
  reported_date: { type: Date, required: true, default: Date.now },
  is_side_effect: { type: Boolean, required: true, default: false }
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, strict: "throw" });

export default mongoose.models.Symptom || mongoose.model("Symptom", symptomSchema);