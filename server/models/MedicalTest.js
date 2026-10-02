import mongoose from "mongoose";

const medicalTestSchema = new mongoose.Schema({
  plan_id: { type: String, required: true, index: true },
  patient_id: { type: String, required: true, index: true },
  test_name: { type: String, required: true, trim: true },
  test_date: { type: Date, required: true },
  result: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, strict: "throw" });

export default mongoose.models.MedicalTest || mongoose.model("MedicalTest", medicalTestSchema);