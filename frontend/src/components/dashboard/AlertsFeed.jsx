import React from "react";

const DUMMY_ALERTS = [
  { id: 1, type: "delay", icon: "⚠️", title: "Route Delay: West Gate", desc: "Bus 06 — 8 min delay · 2 min ago", pillType: "warning" },
  { id: 2, type: "announcement", icon: "📢", title: "Weekend Schedule Updated", desc: "Management · 1 hr ago", pillType: "info" },
  { id: 3, type: "resolved", icon: "✅", title: "Bus 02 back on route", desc: "Resolved · 3 hrs ago", pillType: "success" },
];

export default function AlertsFeed() {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
        <h3 className="font-headline font-bold text-[var(--text-primary)] flex items-center gap-2">
          <span>🔔</span> Alerts
        </h3>
        <button className="text-sm font-semibold text-[var(--accent-primary)]">
          View All &rarr;
        </button>
      </div>
      
      <div className="flex flex-col">
        {DUMMY_ALERTS.map((alert, idx) => (
          <div key={alert.id} className={`px-5 py-4 flex gap-3 ${idx !== DUMMY_ALERTS.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
            <span className={`pill pill-${alert.pillType} self-start shrink-0 text-sm py-1`}>
              {alert.icon}
            </span>
            <div>
              <h4 className="font-body text-sm font-semibold text-[var(--text-primary)]">{alert.title}</h4>
              <p className="font-body text-xs text-[var(--text-muted)] mt-1">{alert.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
