# LIVE_TRACKING_PAGE.md
## Live Tracking Page — Enhanced Stop Stepper & Route View
### Campus Bus Tracker Redesign · Tab 3

> **What changed from existing app:** The flat stop list becomes a polished vertical stepper with departure timestamps, amenity badges (WiFi, density), and an upgraded stop-tap modal that shows both bus ETA and student walking ETA side by side.

---

## 1. Page Identity

| Property | Value |
|----------|-------|
| **Route** | `/tracking` |
| **Tab** | 3 — Tracking |
| **Layout** | Split: Map (top 50%) + Bottom Sheet (bottom 50%, expandable) |
| **Real-time** | Yes — WebSocket feeds both map markers and stepper |
| **Deep Link** | `navigate("/tracking", { state: { busId: "BUS-04" } })` |

---

## 2. Full Page Layout

```
┌──────────────────────────────────────────────┐
│  ← Tracking         BUS-04      [🌙]         │  ← PageHeader
├──────────────────────────────────────────────┤
│                                              │
│                                              │
│         [ LIVE MAP — top 50% ]              │
│                                              │
│   🔴 animated bus    📍 your stop            │
│                                              │
│                                              │
├──────────────────────────────────────────────┤
│  ════  (drag handle)                         │  ← Bottom Sheet
│                                              │
│  BUS-04 · Ayapakkam → RIT                   │
│  🟢 On Track  ·  🔴 Full  ·  ~52 min total  │
│                                              │
│  ─────── STOP STEPPER ────────────────────   │
│                                              │
│  ✅ 07:00  Ayapakkam Bus Stand               │
│  ✅ 07:09  Ambattur OT                       │
│  ✅ 07:18  Thirumullaivoyal                  │
│                                              │
│  🔵 NEXT   Avadi Bus Stand         6 min ›  │  ← pulsing, tappable
│                                              │
│  ○  ~15m   Paruthipattu            WiFi ›   │  ← tappable + badge
│  ○  ~25m   Sennerkuppam                ›    │
│  ○  ~40m   Poonamallee Bus Stand   WiFi ›  │
│  ○  ~52m   Kuthambakkam                ›    │
│  ⭐ ~60m   RIT Chennai — Main Gate      ›   │
│                                              │
└──────────────────────────────────────────────┘
      [Dashboard]  [Map]  [Track]  [Safety] [Me]
```

---

## 3. Vertical Stop Stepper

### 3.1 Design Spec

The stepper uses a **continuous vertical line** connecting all stop nodes. Each node's visual state changes as the bus progresses.

```
  │
  ●────── ✅ 07:00   Ayapakkam Bus Stand        DEPARTED
  │
  ●────── ✅ 07:09   Ambattur OT                DEPARTED
  │
  ●────── ✅ 07:18   Thirumullaivoyal            DEPARTED
  │
  🔵───── ⬤  NEXT    Avadi Bus Stand   6 min  ← pulsing blue ring
  │
  ┊────── ○   ~15m   Paruthipattu      [WiFi]  ← tappable
  ┊
  ┊────── ○   ~25m   Sennerkuppam               ← tappable
  ┊
  ┊────── ○   ~40m   Poonamallee       [WiFi]  ← tappable + delay badge
  ┊
  ┊────── ○   ~52m   Kuthambakkam               ← tappable
  ┊
  ★────── ⭐  ~60m   RIT Chennai — Main Gate    ← destination star
```

**Line styling:**
- Completed segment: `2px solid var(--success)` — solid green
- Current-to-next segment: `2px solid var(--accent-primary)` — red
- Upcoming segment: `2px dashed var(--border)` — dashed grey

### 3.2 Stop Node States

| State | Node Icon | Node Color | Line Above | Row Style |
|-------|-----------|-----------|-----------|-----------|
| `passed` | ✅ | `var(--success)` | Solid green | Muted opacity-60 |
| `next` | ⬤ with ring | `var(--accent-primary)` | Red | Bold, blue label, pulse |
| `upcoming` | ○ | `var(--border)` | Dashed | Normal, tappable |
| `destination` | ★ | `var(--accent-primary)` | Dashed | Bold name, distinct icon |
| `student_stop` | ⭐ | Gold + red | Dashed | Extra-highlighted |

### 3.3 StopStepper Component

```jsx
// components/tracking/StopStepper.jsx

import { motion } from "framer-motion";

export default function StopStepper({ stops, busState, studentLocation, onStopTap }) {

  return (
    <div className="relative pl-8">
      {stops.map((stop, index) => {
        const status  = getStopStatus(stop, busState);
        const eta     = getStopETA(stop.stop_id, busState);
        const isLast  = index === stops.length - 1;
        const isFirst = index === 0;

        return (
          <div key={stop.stop_id} className="relative">

            {/* Vertical connector line (above node) */}
            {!isFirst && (
              <StepperLine status={status} prevStatus={getStopStatus(stops[index-1], busState)} />
            )}

            {/* Stop Row */}
            <StopStepperRow
              stop={stop}
              status={status}
              eta={eta}
              onTap={
                status === "upcoming" || status === "destination" || status === "student_stop"
                  ? () => onStopTap(stop, eta, studentLocation)
                  : null
              }
            />
          </div>
        );
      })}
    </div>
  );
}

function StopStepperRow({ stop, status, eta, onTap }) {
  const isPassed  = status === "passed";
  const isNext    = status === "next";
  const isTappable = !!onTap;

  return (
    <button
      onClick={onTap}
      disabled={!isTappable}
      className={`
        flex items-start gap-3 w-full text-left py-3 rounded-xl px-2
        transition-colors duration-150
        ${isTappable ? "hover:bg-[var(--bg-tertiary)] active:scale-[0.99]" : ""}
      `}
    >
      {/* Node */}
      <div className="absolute left-0 flex flex-col items-center">
        <StepperNode status={status} />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-between">
        <div>
          {/* Timestamp (passed) or ETA label */}
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: 11,
            fontWeight: 500,
            color: isPassed ? "var(--success)" : "var(--text-muted)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}>
            {isPassed
              ? stop.actual_departure_time
              : isNext
              ? "NEXT"
              : eta ? `~${eta}m` : ""}
          </p>

          {/* Stop name */}
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            fontWeight: isNext ? 600 : isPassed ? 400 : 500,
            color: isPassed
              ? "var(--text-muted)"
              : isNext
              ? "var(--accent-primary)"
              : "var(--text-primary)",
            opacity: isPassed ? 0.6 : 1,
          }}>
            {stop.name}
          </p>
        </div>

        {/* Right side: badges + chevron */}
        <div className="flex items-center gap-1.5">
          {stop.has_wifi    && <FeatureBadge type="wifi" />}
          {stop.zone_type === "heavy_traffic" && <FeatureBadge type="traffic" />}
          {isNext && (
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13,
                           fontWeight: 700, color: "var(--accent-primary)" }}>
              {eta} min
            </span>
          )}
          {isTappable && (
            <ChevronRight size={14} color="var(--text-muted)" />
          )}
        </div>
      </div>
    </button>
  );
}
```

---

## 4. Feature Badges

Small visual tags attached to stop rows and bus cards to communicate amenities.

### 4.1 Badge Types

| Badge | Icon | Label | Condition |
|-------|------|-------|-----------|
| WiFi | 📶 | Live WiFi | `stop.has_wifi === true` |
| Low Density | 🟢 | Low Density | `bus.occupancy === "low"` |
| High Density | 🔴 | High Density | `bus.occupancy === "full"` |
| Traffic | 🚦 | Heavy Traffic | `stop.zone_type === "heavy_traffic"` |
| Delay | ⚠️ | Delay Zone | `stop.triggers_delay_alert === true` |

### 4.2 FeatureBadge Component

```jsx
// components/FeatureBadge.jsx

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
    <span className={`feature-badge`}>
      {config.icon}
      <span style={{ fontFamily: "var(--font-body)", fontSize: 10,
                     fontWeight: 500, color: "var(--text-secondary)" }}>
        {config.label}
      </span>
    </span>
  );
}
```

---

## 5. Enhanced Stop Detail Modal

When a student taps any upcoming stop, the modal shows three things simultaneously: bus ETA to the stop, student walking ETA to the stop, and a smart recommendation.

### 5.1 Modal Layout

```
┌──────────────────────────────────────────────────┐
│  📍 Poonamallee Bus Stand           [✕]          │
│                                                  │
│  ┌─────────────────┐  ┌───────────────────────┐  │
│  │  🚌 Bus arrives │  │  🚶 You arrive        │  │
│  │                 │  │                       │  │
│  │  40             │  │   12                  │  │
│  │  min            │  │   min                 │  │
│  │                 │  │                       │  │
│  │  2.1 km left    │  │  850m from you        │  │
│  └─────────────────┘  └───────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │  💡 28 min buffer.                       │    │  ← recommendation banner
│  │  Walk comfortably or board at            │    │
│  │  Sennerkuppam instead.                   │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  ⚠️ Delay Zone · 📶 Live WiFi at this stop      │  ← feature badges row
│                                                  │
│  [📍 Show on Map]       [🔔 Alert Me]            │
└──────────────────────────────────────────────────┘
```

### 5.2 Recommendation Banners

| Buffer | Background | Message |
|--------|-----------|---------|
| > 15 min | `var(--success-bg)` | "Plenty of time — walk at your own pace" |
| 5–15 min | `var(--warning-bg)` | "Start walking now to board comfortably" |
| 0–5 min | `var(--danger-bg)` | "Walk quickly — bus arrives soon!" |
| Negative | `var(--danger-bg)` | "Bus arrives before you can walk there. Board at your nearest stop." |

### 5.3 "Alert Me" Confirmation Toast

After tapping [🔔 Alert Me], a toast slides up from the bottom:

```
┌──────────────────────────────────────────────┐
│  ✅  Alert set for Poonamallee Bus Stand     │
│      You'll be notified 14 min before        │
│      the bus arrives.                        │
└──────────────────────────────────────────────┘
```

---

## 6. Bus Header Strip (Top of Bottom Sheet)

```
┌────────────────────────────────────────────────────┐
│  ════                                              │
│                                                    │
│  BUS-04  ·  Ayapakkam → RIT Express               │
│                                                    │
│  ● On Track    🔴 Full    ~52 min total            │
│                                                    │
│  ┌────────────────────────────────────────────┐    │
│  │  📶 Live WiFi available on this bus        │    │  ← if applicable
│  └────────────────────────────────────────────┘    │
│                                                    │
│  ────────────────────────────────────────────      │
│  [STOP STEPPER BELOW]                              │
└────────────────────────────────────────────────────┘
```

---

## 7. Map Configuration (Tracking Tab)

The map on the tracking page has **more interaction** than the mini-map widget:

| Feature | Value |
|---------|-------|
| Zoom controls | Visible (bottom-right) |
| Auto-zoom | Active — keeps bus + student stop in frame |
| Route polyline | Drawn in `var(--route-line)` red |
| Bus marker | Animated, rotates with heading |
| Student dot | Pulsating, `var(--user-dot)` red |
| Stop pins | Numbered, color by state (passed/next/upcoming) |
| Tapping a pin | Opens same StopDetailModal as stepper tap |

---

## 8. TrackingPage Assembly

```jsx
// pages/TrackingPage.jsx

import { useLocation }        from "react-router-dom";
import { useState }           from "react";
import PageHeader             from "../components/PageHeader";
import MapContainer           from "../components/MapContainer";
import BottomSheet            from "../components/BottomSheet";
import StopStepper            from "../components/tracking/StopStepper";
import StopDetailModal        from "../components/tracking/StopDetailModal";
import { useBusContext }      from "../context/BusContext";
import { useStudentLocation } from "../hooks/useStudentLocation";
import { computeStopETA }     from "../utils/eta";
import { computeWalkETA }     from "../utils/geo";

export default function TrackingPage() {
  const { state }                      = useLocation();
  const { busId }                      = state ?? { busId: "BUS-04" };
  const { getBus, stopList }           = useBusContext();
  const studentLocation                = useStudentLocation();
  const bus                            = getBus(busId);
  const [selectedStop, setSelectedStop] = useState(null);
  const [modalData, setModalData]      = useState(null);

  function handleStopTap(stop) {
    const busETA  = computeStopETA(bus, stop.stop_id);
    const walkETA = computeWalkETA(studentLocation, stop);
    setModalData({ stop, busETA, walkETA });
    setSelectedStop(stop);
  }

  return (
    <div className="relative h-screen flex flex-col">
      <PageHeader title="Live Tracking" showBack />

      {/* Map — top portion */}
      <div className="flex-1">
        <MapContainer
          bus={bus}
          studentLocation={studentLocation}
          stops={stopList}
          onStopPinTap={handleStopTap}
        />
      </div>

      {/* Bottom sheet — stop stepper */}
      <BottomSheet>
        {/* Bus info strip */}
        <BusInfoStrip bus={bus} />

        {/* Stop stepper */}
        <StopStepper
          stops={stopList}
          busState={bus}
          studentLocation={studentLocation}
          onStopTap={handleStopTap}
        />
      </BottomSheet>

      {/* Stop detail modal (conditional) */}
      {modalData && (
        <StopDetailModal
          stop={modalData.stop}
          busETA={modalData.busETA}
          walkETA={modalData.walkETA}
          studentLocation={studentLocation}
          onClose={() => setModalData(null)}
          onSetAlert={(stop) => scheduleAlert(stop, modalData)}
        />
      )}
    </div>
  );
}
```
