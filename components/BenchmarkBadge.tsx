// components/BenchmarkBadge.tsx
import React from "react";

const colors: Record<string, string> = {
  "Service Quality": "#3b82f6",
  "Staff Behaviour": "#8b5cf6",
  "Cleanliness & Hygiene": "#22c55e",
  "Ambience": "#ec4899",
  "Pricing": "#fbbf24",
  "Appointment & Waiting Time": "#fb923c",
  "Product Quality": "#ef4444",
};

export default function BenchmarkBadge({
  text,
  type = "benchmark",
}: {
  text: string;
  type?: "benchmark" | "sub";
}) {
  const color = colors[text] || "#64748b";

  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: "8px",
        fontSize: "12px",
        fontWeight: 600,
        marginRight: "6px",
        marginTop: "4px",
        display: "inline-block",
        color: type === "benchmark" ? color : "#cbd5e1",
        background:
          type === "benchmark"
            ? `${color}20`
            : "rgba(255,255,255,0.06)",
        border: `1px solid ${color}40`,
      }}
    >
      {text}
    </span>
  );
}
