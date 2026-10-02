import React from "react";

export function StatusBadge({ label, tone = "blue", size = "normal" }) {
  let mappedTone = tone;
  if (!tone) mappedTone = "blue";
  const lower = String(label || "").toLowerCase();

  if (lower.includes("high") || lower.includes("abnormal") || lower.includes("attention") || lower.includes("severe") || lower.includes("missed")) {
    mappedTone = "red";
  } else if (lower.includes("medium") || lower.includes("review") || lower.includes("borderline") || lower.includes("moderate")) {
    mappedTone = "amber";
  } else if (lower.includes("low") || lower.includes("stable") || lower.includes("normal") || lower.includes("taken") || lower.includes("optimal") || lower.includes("completed")) {
    mappedTone = "green";
  } else if (lower.includes("scheduled") || lower.includes("consultation") || lower.includes("logged")) {
    mappedTone = "blue";
  }

  return (
    <span className={`badge ${mappedTone} ${size === "small" ? "badge-sm" : ""}`}>
      <i />
      {label}
    </span>
  );
}
