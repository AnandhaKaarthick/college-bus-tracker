import React from "react";
import ThemeToggleButton from "./ThemeToggleButton";
import { ChevronLeft } from "lucide-react";

export default function PageHeader({ title, showBack = false, onBack, action }) {
  return (
    <header
      className="flex items-center justify-between px-4 h-14 sticky top-0 z-50"
      style={{
        background:  "var(--bg-secondary)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-3">
        {showBack && (
          <button onClick={onBack} className="p-1 rounded-full"
            style={{ color: "var(--text-secondary)" }}>
            <ChevronLeft size={22} />
          </button>
        )}
        <h1 style={{
          fontFamily: "var(--font-headline)",
          fontSize:   "20px",
          fontWeight: 700,
          color:      "var(--text-primary)",
        }}>
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {action}
        <ThemeToggleButton />
      </div>
    </header>
  );
}
