// components/BenchmarkBadge.tsx
import React from "react";

const colors: Record<string, string> = {
  "Service Quality": "#4A90FF",
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
  const color = colors[text] || "#8a99ad";

  return (
    <span
      style={{
        padding: "5px 12px",
        borderRadius: "10px",
        fontSize: "11px",
        fontWeight: 600,
        marginRight: "6px",
        marginTop: "4px",
        display: "inline-block",
        letterSpacing: "0.03em",
        color: type === "benchmark" ? color : "rgba(247, 250, 252, 0.8)",
        background:
          type === "benchmark"
            ? `${color}15`
            : "rgba(255,255,255,0.04)",
        border: `1px solid ${type === "benchmark" ? `${color}30` : "rgba(255,255,255,0.08)"}`,
      }}
    >
      {text}
    </span>
  );
}

