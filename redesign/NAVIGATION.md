# NAVIGATION.md
## Unified Bottom Navigation Bar — Stitch Design
### Campus Bus Tracker Redesign

> **Replacing:** Existing sidebar / hamburger menu  
> **New Pattern:** Fixed 5-tab bottom navigation bar — always visible, always reachable with one thumb.

---

## 1. Navigation Structure

The app has **5 top-level destinations**, each accessible in one tap from anywhere in the app.

| Tab | Icon | Label | Route | Badge |
|-----|------|-------|-------|-------|
| 1 | `LayoutDashboard` | Dashboard | `/dashboard` | — |
| 2 | `Map` | Map | `/map` | — |
| 3 | `Navigation` | Tracking | `/tracking` | Live pulse dot |
| 4 | `ShieldCheck` | Safety | `/safety` | Alert count (if any) |
| 5 | `User` | Profile | `/profile` | — |

---

## 2. Visual Design

### 2.1 Bar Layout

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  [Dashboard]   [Map]   [Tracking]  [Safety]  [Me]   │
│    active        ○         ○          ○        ○     │
│      ●                                               │
└──────────────────────────────────────────────────────┘
```

**Dimensions:**
- Height: `64px` (plus safe area bottom padding on iOS)
- Background: `var(--nav-bg)`
- Top border: `1px solid var(--nav-border)`
- Box shadow: `var(--shadow-nav)` — subtle upward shadow

### 2.2 Tab Item — States

**Active tab:**
```
  ┌──────────────┐
  │      🏠      │  ← icon, color: var(--nav-active)
  │  Dashboard   │  ← label, color: var(--nav-active), font-weight: 600
  │      ●       │  ← active indicator dot below label
  └──────────────┘
```

**Inactive tab:**
```
  ┌──────────────┐
  │      🗺️      │  ← icon, color: var(--nav-inactive)
  │    Map       │  ← label, color: var(--nav-inactive), font-weight: 500
  └──────────────┘
```

### 2.3 Tracking Tab — Live Pulse Badge

The Tracking tab always shows a **small animated pulse dot** when a bus is actively being tracked — signals to the student that GPS is live.

```
  ┌──────────────┐
  │   🧭  🔴     │  ← 🔴 = 6px red dot, animate-pulse, top-right of icon
  │  Tracking    │
  └──────────────┘
```

### 2.4 Safety Tab — Alert Badge

If there are any active emergency alerts, the Safety tab shows a count badge:

```
  ┌──────────────┐
  │   🛡️  [2]   │  ← badge: 16px circle, bg: var(--danger), text: white
  │   Safety     │
  └──────────────┘
```

---

## 3. Component Code

```jsx
// components/BottomNavBar.jsx

import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Map, Navigation, ShieldCheck, User
} from "lucide-react";
import { useBusContext } from "../context/BusContext";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Map",       icon: Map,             path: "/map"       },
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
```

---

## 4. Router Setup

```jsx
// App.jsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import BottomNavBar from "./components/BottomNavBar";
import { ThemeProvider }  from "./context/ThemeContext";
import { BusProvider }    from "./context/BusContext";

// Pages
import Dashboard    from "./pages/Dashboard";
import MapPage      from "./pages/MapPage";
import TrackingPage from "./pages/TrackingPage";
import SafetyHub    from "./pages/SafetyHub";
import ProfilePage  from "./pages/ProfilePage";

export default function App() {
  return (
    <ThemeProvider>
      <BusProvider>
        <BrowserRouter>
          {/* Main content — padded for bottom nav */}
          <main className="pb-16 min-h-screen"
            style={{ background: "var(--bg-primary)" }}>
            <Routes>
              <Route path="/"          element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />}    />
              <Route path="/map"       element={<MapPage />}      />
              <Route path="/tracking"  element={<TrackingPage />} />
              <Route path="/safety"    element={<SafetyHub />}    />
              <Route path="/profile"   element={<ProfilePage />}  />
            </Routes>
          </main>

          {/* Always-visible bottom nav */}
          <BottomNavBar />
        </BrowserRouter>
      </BusProvider>
    </ThemeProvider>
  );
}
```

---

## 5. Page Header Pattern

Every page (except Map, which is full-screen) uses a standard header bar:

```
┌──────────────────────────────────────────┐
│  ← (optional back)   Page Title   [🌙]  │  ← 56px height
└──────────────────────────────────────────┘
```

```jsx
// components/PageHeader.jsx

import ThemeToggleButton from "./ThemeToggleButton";

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
```

---

## 6. Page Transition Animation

Between tab switches, pages animate with a subtle fade (no slide — slide feels wrong for tabs):

```jsx
// In each page component, wrap content with:
import { motion } from "framer-motion";

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -6 },
};

// Usage:
<motion.div
  variants={pageVariants}
  initial="initial"
  animate="animate"
  exit="exit"
  transition={{ duration: 0.22, ease: "easeOut" }}
>
  {/* page content */}
</motion.div>
```

---

## 7. Safe Area Handling (iOS / Android)

Add to `index.css` to respect device safe areas (notch, home indicator):

```css
/* Respect iOS safe areas */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* Bottom nav height accounting for safe area */
nav.fixed.bottom-0 {
  padding-bottom: env(safe-area-inset-bottom, 0px);
  height: calc(64px + env(safe-area-inset-bottom, 0px));
}

/* Main content: push up to avoid nav overlap */
main.pb-16 {
  padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px));
}
```
