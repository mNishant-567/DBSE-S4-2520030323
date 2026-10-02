import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info } from "lucide-react";

export function Toast({ toast }) {
  if (!toast) return null;

  const { message, type = "success" } = toast;

  let Icon = CheckCircle2;
  let iconClass = "toast-icon-success";

  if (type === "error") {
    Icon = AlertCircle;
    iconClass = "toast-icon-error";
  } else if (type === "warning") {
    Icon = AlertTriangle;
    iconClass = "toast-icon-warning";
  } else if (type === "info") {
    Icon = Info;
    iconClass = "toast-icon-info";
  }

  return (
    <div className={`toast toast-${type}`} role="alert" id="toast-notification">
      <Icon size={18} className={iconClass} />
      <span>{message}</span>
    </div>
  );
}
