import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient_id: { type: String, required: true, index: true },
  recipient_role: { type: String, enum: ["patient", "doctor", "admin"], required: true },
  type: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  read_at: { type: Date, default: null }
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, strict: "throw" });

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema);