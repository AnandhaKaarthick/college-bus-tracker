# DASHBOARD_PAGE.md
## Bento Dashboard — Student Home Screen
### Campus Bus Tracker Redesign · Tab 1

> **Purpose:** Replace the existing "jump straight to map" entry with a high-utility information hub. A student opens the app and within 2 seconds knows their ETA, the fleet status, and any active alerts — without touching the map.

---

## 1. Page Identity

| Property | Value |
|----------|-------|
| **Route** | `/dashboard` |
| **Tab** | 1 — Dashboard |
| **Default on Login** | Yes |
| **Scroll** | Vertical scroll (below header) |
| **Real-time Updates** | Yes — WebSocket feeds My Bus Card and Alerts Feed |

---

## 2. Full Layout Wireframe

```
┌──────────────────────────────────────────────┐
│  Campus Transit        [🔔]  [🌙]           │  ← PageHeader
├──────────────────────────────────────────────┤
│                                              │
│  Good morning, Arjun 👋                     │  ← Greeting
│  Your bus departs in                         │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │        MY BUS CARD                     │  │
│  │  ╔══════════════════════════════════╗  │  │
│  │  ║  BUS-04 · North Campus Express  ║  │  │
│  │  ║                                 ║  │  │
│  │  ║        08                       ║  │  │
│  │  ║        mins                     ║  │  │
│  │  ║                                 ║  │  │
│  │  ║  Next: Avadi Bus Stand          ║  │  │
│  │  ╚══════════════════════════════════╝  │  │
│  │  ─────────────────────────────────    │  │
│  │  🧑 Ramesh Kumar    [📞]  [Track →]   │  │
│  └────────────────────────────────────────┘  │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│  ┌─────────────────┐  ┌────────────────────┐ │
│  │  STATS CARD     │  │  STATS CARD        │ │
│  │  12             │  │  847               │ │
│  │  Active Buses   │  │  Students Boarded  │ │
│  └─────────────────┘  └────────────────────┘ │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  MINI-MAP WIDGET                       │  │
│  │                                        │  │
│  │  [small Leaflet map — bus near stop]   │  │
│  │                                        │  │
│  │  📍 Bus 04 is near Central Library     │  │
│  └────────────────────────────────────────┘  │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  ALERTS FEED                           │  │
│  │  ⚠️  Route Delay: West Gate — 8 min   │  │
│  │  📢  Weekend Schedule Updated          │  │
│  │  ✅  Bus 02 back on route              │  │
│  └────────────────────────────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
     [Dashboard]  [Map]  [Track]  [Safety] [Me]
```

---

## 3. My Bus Card

### 3.1 Visual Design

The My Bus Card is **the most important element on the screen.** It occupies the full card width with a **two-layer design:**

- **Top section (dark navy bg):** Route name, giant ETA, next stop — dominates visual attention
- **Bottom section (white/secondary bg):** Driver info and action buttons

```
┌───────────────────────────────────────────────┐
│  ╔═════════════════════════════════════════╗   │
│  ║                                         ║   │
│  ║  🚌  BUS-04 · Ayapakkam → RIT          ║   │ ← Manrope 14px, white/70%
│  ║                                         ║   │
│  ║          08                             ║   │ ← Manrope 800, 64px, white
│  ║          mins away                      ║   │ ← Inter 500, 14px, white/60%
│  ║                                         ║   │
│  ║  ──────────────────────────────────     ║   │
│  ║  Next Stop:  Avadi Bus Stand   6 min   ║   │ ← Inter 500, 13px, white/70%
│  ║                                         ║   │
│  ║  ● On Track       🪑 Full              ║   │ ← status + occupancy pills
│  ╚═════════════════════════════════════════╝   │
│                                                │
│  ┌─────────────────────────────────────────┐   │
│  │  🧑  Ramesh Kumar                       │   │ ← Inter 500, 14px, text-primary
│  │       Driver · TN 09 AB 1234            │   │ ← Inter 400, 12px, text-muted
│  │                          [📞]  [Track →]│   │ ← action buttons
│  └─────────────────────────────────────────┘   │
└───────────────────────────────────────────────┘
```

### 3.2 ETA Color States

| ETA | Top Section Color | Behavior |
|-----|-----------------|----------|
| > 10 min | Deep Navy `#1B263B` | Static |
| 5–10 min | Navy-teal blend | Static |
| 2–5 min | `#E63946` red | Slight pulse on number |
| < 2 min | Red + black overlay | ETA number flashes |

### 3.3 "Track →" Button

Tapping "Track →" navigates to `/tracking` and auto-selects BUS-04 as the active tracked bus.

### 3.4 Fallback State (No Active Bus)

When no bus is assigned or active:
```
┌─────────────────────────────────────────────┐
│  No bus scheduled right now                 │
│  Next departure: Tomorrow at 07:00 AM       │
│                                             │
│  [Browse All Routes]                        │
└─────────────────────────────────────────────┘
```

### 3.5 Component

```jsx
// components/dashboard/MyBusCard.jsx

import { useNavigate } from "react-router-dom";
import { Phone, ArrowRight } from "lucide-react";
import { useBusContext } from "../../context/BusContext";

export default function MyBusCard() {
  const navigate = useNavigate();
  const { myBus, myBusETA, nextStop } = useBusContext();

  if (!myBus) return <NoBusCard />;

  const etaColor = myBusETA <= 2
    ? "var(--danger)"
    : myBusETA <= 5
    ? "var(--accent-primary)"
    : "var(--bg-navy-card)";

  return (
    <div className="rounded-[var(--radius-lg)] overflow-hidden"
      style={{ border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>

      {/* Top — Dark hero section */}
      <div className="px-5 pt-5 pb-4"
        style={{ background: etaColor, transition: "background 600ms ease" }}>

        {/* Route label */}
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13,
                    color: "rgba(255,255,255,0.70)", fontWeight: 500 }}>
          🚌 {myBus.bus_id} · {myBus.route_name}
        </p>

        {/* ETA hero */}
        <div className="flex items-baseline gap-2 my-3">
          <span style={{ fontFamily: "var(--font-headline)", fontSize: 64,
                         fontWeight: 800, color: "#fff", lineHeight: 1 }}>
            {String(myBusETA).padStart(2, "0")}
          </span>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 14,
                         color: "rgba(255,255,255,0.60)", fontWeight: 500 }}>
            mins away
          </span>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)",
                      marginBottom: 12 }} />

        {/* Next stop + status row */}
        <div className="flex items-center justify-between">
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13,
                      color: "rgba(255,255,255,0.75)" }}>
            Next: <strong style={{ color: "#fff" }}>{nextStop?.name}</strong>
          </p>
          <div className="flex gap-2">
            <span className="pill pill-success">● On Track</span>
            <span className="pill" style={{
              background: "rgba(255,255,255,0.15)", color: "#fff" }}>
              🪑 {myBus.occupancy}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom — Driver info */}
      <div className="flex items-center justify-between px-5 py-3"
        style={{ background: "var(--bg-secondary)" }}>
        <div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14,
                      fontWeight: 500, color: "var(--text-primary)" }}>
            🧑 {myBus.driver_name}
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12,
                      color: "var(--text-muted)" }}>
            Driver · {myBus.vehicle_number}
          </p>
        </div>
        <div className="flex gap-2">
          <a href={`tel:${myBus.driver_phone}`}
            className="btn-secondary p-2.5 rounded-[var(--radius-md)]">
            <Phone size={16} />
          </a>
          <button onClick={() => navigate("/tracking")}
            className="btn-primary flex items-center gap-1.5 px-3 py-2.5
                       text-sm rounded-[var(--radius-md)]">
            Track <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 4. Stats Cards

Two small cards displayed in a 2-column grid below the My Bus Card.

### 4.1 Layout

```
┌────────────────────┐  ┌────────────────────┐
│  🚌               │  │  👥               │
│  12               │  │  847              │
│  Active Buses      │  │  Students Boarded  │
└────────────────────┘  └────────────────────┘
```

### 4.2 Stats Data Source

| Stat | Backend Source | Update Frequency |
|------|---------------|-----------------|
| Active Buses | WebSocket telemetry — count buses with status ≠ `offline` | Every 10s |
| Students Boarded | Sum of estimated occupancy across all active buses | Every 30s |

### 4.3 Component

```jsx
// components/dashboard/StatsCard.jsx

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

// Usage in Dashboard.jsx
<div className="grid grid-cols-2 gap-3">
  <StatsCard icon="🚌" value={activeBusCount}    label="Active Buses"       color="var(--accent-primary)" />
  <StatsCard icon="👥" value={studentsBoardedCount} label="Students Boarded" />
</div>
```

---

## 5. Mini-Map Widget

A compact, **non-interactive** Leaflet map that shows the bus position relative to the student's saved stop. No zoom controls, no search — purely visual context.

### 5.1 Layout

```
┌──────────────────────────────────────────────┐
│  ┌────────────────────────────────────────┐  │
│  │                                        │  │
│  │         [Leaflet Map — 180px tall]     │  │
│  │                                        │  │
│  │    🔴 bus icon    📍 your stop         │  │
│  │                                        │  │
│  └────────────────────────────────────────┘  │
│  📍  Bus 04 is near Central Library Stop     │
│      Tap to open full map →                  │
└──────────────────────────────────────────────┘
```

### 5.2 Properties

| Property | Value |
|----------|-------|
| Height | 180px |
| Zoom | Fixed at 14 (no zoom controls) |
| Tile source | Same as main map (theme-aware) |
| Interaction | Disabled (drag, zoom locked) — tap the card to go to `/map` |
| Markers | Bus icon + student's stop pin only |

### 5.3 Caption Logic

```
PSEUDOCODE — generate_mini_map_caption(bus, studentStop):

  distance = haversine(bus.lat, bus.lng, studentStop.lat, studentStop.lng)

  IF distance < 0.5:
    RETURN "Bus 04 is approaching {studentStop.name}"

  IF distance < 2.0:
    RETURN "Bus 04 is near {nearest_landmark}"

  ELSE:
    RETURN "Bus 04 is {distance} km from your stop"
```

---

## 6. Alerts Feed

A scrollable list of management broadcasts — delays, schedule updates, and resolutions.

### 6.1 Visual

```
┌─────────────────────────────────────────────────┐
│  🔔 Alerts                      [View All →]   │
│  ─────────────────────────────────────────────  │
│  ⚠️  Route Delay: West Gate                    │
│      Bus 06 — 8 min delay · 2 min ago          │
│  ─────────────────────────────────────────────  │
│  📢  Weekend Schedule Updated                   │
│      Management · 1 hr ago                     │
│  ─────────────────────────────────────────────  │
│  ✅  Bus 02 back on route                       │
│      Resolved · 3 hrs ago                      │
└─────────────────────────────────────────────────┘
```

### 6.2 Alert Row Icons & Colors

| Alert Type | Icon | Pill Style |
|-----------|------|-----------|
| Delay | ⚠️ | `pill-warning` |
| Breakdown | 🔴 | `pill-danger` |
| Announcement | 📢 | `pill-info` |
| Resolved | ✅ | `pill-success` |
| Accident | 🚨 | `pill-danger` |
| Suspicious Activity | 👁️ | `pill-warning` |

### 6.3 Data Source

```
GET /alerts?status=active,resolved&limit=5&sort=created_at:desc
```

Response updates every 60 seconds via polling (alerts don't need WebSocket speed).

---

## 7. Greeting Logic

```jsx
// Personalized greeting based on time of day
function getGreeting(name, hour) {
  if (hour < 12) return `Good morning, ${name} 👋`;
  if (hour < 17) return `Good afternoon, ${name} 👋`;
  return `Good evening, ${name} 👋`;
}
```

---

## 8. Full Dashboard Assembly

```jsx
// pages/Dashboard.jsx

import PageHeader         from "../components/PageHeader";
import MyBusCard          from "../components/dashboard/MyBusCard";
import StatsCard          from "../components/dashboard/StatsCard";
import MiniMapWidget      from "../components/dashboard/MiniMapWidget";
import AlertsFeed         from "../components/dashboard/AlertsFeed";
import { useAuth }        from "../context/AuthContext";
import { useBusContext }  from "../context/BusContext";
import { motion }         from "framer-motion";

export default function Dashboard() {
  const { user }                    = useAuth();
  const { activeBusCount,
          studentsBoardedCount }    = useBusContext();
  const hour                        = new Date().getHours();

  return (
    <motion.div initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}>

      <PageHeader title="Campus Transit" />

      <div className="px-4 pt-4 pb-6 flex flex-col gap-4"
        style={{ background: "var(--bg-primary)" }}>

        {/* Greeting */}
        <div>
          <h2 style={{ fontFamily: "var(--font-headline)", fontSize: 22,
                       fontWeight: 700, color: "var(--text-primary)" }}>
            {getGreeting(user.name.split(" ")[0], hour)}
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14,
                      color: "var(--text-muted)" }}>
            Your bus departs in
          </p>
        </div>

        {/* My Bus Card */}
        <MyBusCard />

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <StatsCard icon="🚌" value={activeBusCount}
            label="Active Buses" color="var(--accent-primary)" />
          <StatsCard icon="👥" value={studentsBoardedCount}
            label="Students Boarded" />
        </div>

        {/* Mini Map */}
        <MiniMapWidget />

        {/* Alerts */}
        <AlertsFeed />

      </div>
    </motion.div>
  );
}
```
