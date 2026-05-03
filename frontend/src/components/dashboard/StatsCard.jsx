import React from "react";

export default function StatsCard({ icon, value, label, color }) {
  return (
    <div className="card flex-1">
      <span style={{ fontSize: 22 }}>{icon}</span>
      <p style={{
        fontFamily: "var(--font-headline)",
        fontSize: 32,
        fontWeight: 800,
        color: color ?? "var(--text-primary)",
        lineHeight: 1.1,
        marginTop: 4,
      }}>
        {value}
      </p>
      <p style={{
        fontFamily: "var(--font-body)",
        fontSize: 12,
        color: "var(--text-muted)",
        marginTop: 2,
      }}>
        {label}
      </p>
    </div>
  );
}
