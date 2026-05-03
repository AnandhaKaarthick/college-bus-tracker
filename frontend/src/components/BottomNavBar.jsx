import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Map as MapIcon, Navigation, ShieldCheck, User
} from "lucide-react";
import { useBusContext } from "../context/BusContext";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Tracking",  icon: Navigation,      path: "/tracking"  },
  { label: "Safety",    icon: ShieldCheck,     path: "/safety"    },
  { label: "Me",        icon: User,            path: "/profile"   },
];

export default function BottomNavBar() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { isTracking, activeAlertCount } = useBusContext();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-[100]
                 flex items-center justify-around
                 h-16 pb-safe
                 border-t"
      style={{
        background:   "var(--nav-bg)",
        borderColor:  "var(--nav-border)",
        boxShadow:    "var(--shadow-nav)",
      }}
    >
      {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
        const isActive = location.pathname === path;
        const color    = isActive
          ? "var(--nav-active)"
          : "var(--nav-inactive)";

        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            className="relative flex flex-col items-center justify-center
                       gap-0.5 w-16 h-full
                       transition-colors duration-200"
          >
            {/* Icon + Badges */}
            <div className="relative">
              <Icon size={22} color={color} strokeWidth={2} />

              {/* Live pulse — Tracking tab only */}
              {label === "Tracking" && isTracking && (
                <span className="absolute -top-0.5 -right-0.5
                                 w-2 h-2 rounded-full animate-pulse"
                  style={{ background: "var(--accent-primary)" }}
                />
              )}

              {/* Alert count — Safety tab */}
              {label === "Safety" && activeAlertCount > 0 && (
                <span className="absolute -top-1.5 -right-2
                                 min-w-[16px] h-4 px-1
                                 rounded-full text-[10px] font-bold
                                 flex items-center justify-center"
                  style={{
                    background: "var(--danger)",
                    color:      "var(--text-inverse)",
                  }}
                >
                  {activeAlertCount}
                </span>
              )}
            </div>

            {/* Label */}
            <span
              className="text-[10px] transition-colors duration-200"
              style={{
                color,
                fontFamily:  "var(--font-body)",
                fontWeight:  isActive ? 600 : 500,
                letterSpacing: "0.02em",
              }}
            >
              {label}
            </span>

            {/* Active indicator dot */}
            {isActive && (
              <span
                className="absolute bottom-1 w-1 h-1 rounded-full"
                style={{ background: "var(--nav-active)" }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
