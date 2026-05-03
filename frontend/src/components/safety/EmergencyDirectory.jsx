import React from "react";

const CONTACTS = [
  { emoji: "🚔", name: "Campus Police",            phone: "+914423456789" },
  { emoji: "🏥", name: "University Medical Centre", phone: "+914423459876" },
  { emoji: "🚌", name: "SafeRide Dispatch",         phone: "+919988776655" },
  { emoji: "🔥", name: "Fire & Emergency",           phone: "112"           },
];

export default function EmergencyDirectory() {
  return (
    <div className="card flex flex-col gap-1">
      <h3 style={{ fontFamily: "var(--font-headline)", fontSize: 16,
                   fontWeight: 700, color: "var(--text-primary)",
                   marginBottom: 8 }}>
        📞 Emergency Directory
      </h3>

      {CONTACTS.map(({ emoji, name, phone }, index) => (
        <div key={phone}
          className="flex items-center justify-between py-3"
          style={{ borderBottom: index === CONTACTS.length - 1 ? 'none' : "1px solid var(--border)" }}>
          <div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14,
                        fontWeight: 600, color: "var(--text-primary)" }}>
              {emoji} {name}
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12,
                        color: "var(--text-muted)", marginTop: 2 }}>
              {phone.startsWith("+") ? phone.replace("+91", "+91 ") : phone}
            </p>
          </div>
          <a href={`tel:${phone}`}
            className="btn-secondary text-sm px-4 py-2 rounded-[var(--radius-md)] flex-shrink-0 ml-2">
            Call
          </a>
        </div>
      ))}
    </div>
  );
}
