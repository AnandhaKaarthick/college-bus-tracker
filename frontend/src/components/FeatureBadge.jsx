import React from "react";

const BADGE_CONFIG = {
  wifi:       { icon: "📶", label: "Live WiFi",     style: "info"    },
  low:        { icon: "🟢", label: "Low Density",   style: "success" },
  high:       { icon: "🔴", label: "High Density",  style: "danger"  },
  traffic:    { icon: "🚦", label: "Heavy Traffic", style: "warning" },
  delay:      { icon: "⚠️", label: "Delay Zone",   style: "warning" },
};

export default function FeatureBadge({ type }) {
  const config = BADGE_CONFIG[type];
  if (!config) return null;

  return (
    <span className={`feature-badge flex items-center`}>
      <span className="mr-1">{config.icon}</span>
      <span style={{ fontFamily: "var(--font-body)", fontSize: 10,
                     fontWeight: 500, color: "var(--text-secondary)" }}>
        {config.label}
      </span>
    </span>
  );
}
