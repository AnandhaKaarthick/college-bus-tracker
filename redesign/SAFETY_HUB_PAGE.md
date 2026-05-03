# SAFETY_HUB_PAGE.md
## Safety Hub — Comprehensive Safety Panel
### Campus Bus Tracker Redesign · Tab 4

> **What changed from existing app:** The single floating SOS button is replaced by a full dedicated Safety screen with 5 distinct features — covering emergency alerts, journey sharing, virtual escort, incident reporting, and a quick-dial emergency directory.

---

## 1. Page Identity

| Property | Value |
|----------|-------|
| **Route** | `/safety` |
| **Tab** | 4 — Safety |
| **Layout** | Scrollable page with PageHeader |
| **Badge** | Alert count shown on nav tab if active alerts > 0 |
| **Access** | All roles — student, driver, admin |

---

## 2. Full Page Layout

```
┌──────────────────────────────────────────────┐
│  Safety Hub                          [🌙]    │  ← PageHeader
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │        SOS EMERGENCY BUTTON            │  │
│  │                                        │  │
│  │      ╔══════════════════╗              │  │
│  │      ║   🚨  SOS        ║              │  │
│  │      ║ Hold 3s to send  ║              │  │
│  │      ╚══════════════════╝              │  │
│  │                                        │  │
│  │  Sends your GPS location to            │  │
│  │  Campus Security instantly             │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  📡 Share Journey                      │  │
│  │  Share your live trip with contacts   │  │
│  │  [Share Now]                          │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  🛡️  Request Virtual Escort            │  │
│  │  Get a digital walk-along from        │  │
│  │  campus dispatch                      │  │
│  │  [Request Escort]                     │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  📋 Report an Incident                 │  │
│  │  [Accident] [Breakdown] [Suspicious]  │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  📞 Emergency Directory                │  │
│  │  Campus Police     [Call]              │  │
│  │  University Medical [Call]             │  │
│  │  SafeRide Dispatch  [Call]             │  │
│  └────────────────────────────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
         [Dashboard] [Map] [Track] [Safety] [Me]
```

---

## 3. Feature 1 — SOS Emergency Button (Press & Hold)

### 3.1 Design

The SOS button is **the most visually dominant element** on the page — full-width card, deep red gradient, impossible to miss.

```
┌──────────────────────────────────────────────┐
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │                                        │  │
│  │    ╔════════════════════════╗           │  │
│  │    ║                        ║           │  │
│  │    ║        🚨              ║           │  │
│  │    ║                        ║           │  │
│  │    ║       SOS              ║   ← Manrope 800, 36px, white
│  │    ║                        ║           │  │
│  │    ║  Press & Hold 3 sec   ║           │  │
│  │    ╚════════════════════════╝           │  │
│  │                                        │  │
│  │    ○────────────────────────○          │  │  ← progress ring animates on hold
│  │                                        │  │
│  │  Your GPS location will be shared      │  │
│  │  instantly with Campus Security        │  │
│  └────────────────────────────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
```

### 3.2 Press-and-Hold Mechanic

| Duration | Visual Feedback |
|----------|----------------|
| 0s — tap | Nothing happens (prevents accidental trigger) |
| 0–3s hold | Red circular progress ring fills around button |
| 3s reached | Ring completes, button pulses, confirmation appears |
| Released < 3s | Ring resets with gentle shake animation |

### 3.3 Confirmation Dialog (after 3s hold)

```
┌──────────────────────────────────────────────┐
│  🚨 Emergency Alert Sent                     │
│  ─────────────────────────────────────────   │
│  Your location has been shared with          │
│  Campus Security.                            │
│                                              │
│  📍 Sharing coordinates:                    │
│  13.0827° N, 80.2707° E                     │
│                                              │
│  🔴 Alert ID: #8841                          │
│                                              │
│  Campus Security: +91 44 2345 6789          │
│  [📞 Call Now]       [✓ Close]              │
└──────────────────────────────────────────────┘
```

### 3.4 SOSHoldButton Component

```jsx
// components/safety/SOSHoldButton.jsx

import { useState, useRef, useCallback } from "react";
import { motion, useAnimation }          from "framer-motion";
import { useStudentLocation }            from "../../hooks/useStudentLocation";
import { postAlert }                     from "../../api/alerts";

const HOLD_DURATION = 3000;

export default function SOSHoldButton({ onSuccess }) {
  const [progress,    setProgress]    = useState(0);
  const [isSending,   setIsSending]   = useState(false);
  const [sent,        setSent]        = useState(false);
  const holdTimer    = useRef(null);
  const startTime    = useRef(null);
  const animFrame    = useRef(null);
  const controls     = useAnimation();
  const location     = useStudentLocation();

  const startHold = useCallback(() => {
    if (sent || isSending) return;
    startTime.current = Date.now();

    const tick = () => {
      const elapsed  = Date.now() - startTime.current;
      const pct      = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setProgress(pct);

      if (pct < 100) {
        animFrame.current = requestAnimationFrame(tick);
      } else {
        triggerSOS();
      }
    };
    animFrame.current = requestAnimationFrame(tick);
  }, [sent, isSending]);

  const endHold = useCallback(() => {
    cancelAnimationFrame(animFrame.current);
    if (progress < 100) {
      // Shake and reset
      controls.start({
        x: [0, -8, 8, -6, 6, -4, 4, 0],
        transition: { duration: 0.4 }
      });
      setProgress(0);
    }
  }, [progress, controls]);

  async function triggerSOS() {
    setIsSending(true);
    try {
      await postAlert({
        type:         "panic",
        triggered_by: "student",
        lat:          location.lat,
        lng:          location.lng,
        message:      "Student SOS — emergency assistance required",
      });
      setSent(true);
      onSuccess?.();
    } catch (err) {
      console.error("SOS failed:", err);
      setProgress(0);
    } finally {
      setIsSending(false);
    }
  }

  // SVG ring calculation
  const RADIUS = 68;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeDash = (progress / 100) * CIRCUMFERENCE;

  return (
    <div className="card flex flex-col items-center gap-6 py-8">
      <motion.div animate={controls} className="relative w-40 h-40">

        {/* Progress ring SVG */}
        <svg className="absolute inset-0 -rotate-90" width="160" height="160">
          {/* Background circle */}
          <circle cx="80" cy="80" r={RADIUS}
            fill="none" stroke="var(--danger-bg)" strokeWidth="4" />
          {/* Progress arc */}
          <circle cx="80" cy="80" r={RADIUS}
            fill="none"
            stroke="var(--danger)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
            style={{ transition: "stroke-dasharray 50ms linear" }}
          />
        </svg>

        {/* SOS Button core */}
        <motion.button
          className="absolute inset-3 rounded-full flex flex-col items-center
                     justify-center gap-1 cursor-pointer select-none"
          style={{
            background: sent
              ? "var(--success)"
              : "var(--danger)",
            color: "var(--text-inverse)",
          }}
          animate={sent ? { scale: [1, 1.05, 1] } : {}}
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          aria-label="Press and hold 3 seconds to send SOS"
        >
          <span style={{ fontSize: 28 }}>{sent ? "✅" : "🚨"}</span>
          <span style={{
            fontFamily: "var(--font-headline)",
            fontSize: 22,
            fontWeight: 800,
          }}>
            {sent ? "Sent" : "SOS"}
          </span>
          <span style={{
            fontFamily: "var(--font-body)",
            fontSize: 10,
            fontWeight: 500,
            opacity: 0.8,
          }}>
            {sent ? "Help is on the way" : "Hold 3 sec"}
          </span>
        </motion.button>
      </motion.div>

      <p style={{
        fontFamily: "var(--font-body)",
        fontSize: 13,
        color: "var(--text-muted)",
        textAlign: "center",
        maxWidth: 240,
      }}>
        Your GPS location will be shared instantly with Campus Security
      </p>
    </div>
  );
}
```

---

## 4. Feature 2 — Live Journey Sharing

### 4.1 UI

```
┌──────────────────────────────────────────────┐
│  📡 Share Journey                            │
│  ─────────────────────────────────────────   │
│                                              │
│  Let trusted contacts follow your trip       │
│  in real time.                               │
│                                              │
│  Share with:                                 │
│  ┌─────────────────────────────────────────┐ │
│  │  👤  Mom              [🔴 Live]  [✕]    │ │  ← active share
│  │  👤  Add contact...                     │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  [+ Share with New Contact]                  │
│                                              │
│  Auto-stops sharing when you reach RIT.      │
└──────────────────────────────────────────────┘
```

### 4.2 How It Works

1. Student taps **"+ Share with New Contact"**
2. Modal opens — enter contact name + phone or pick from contacts
3. Backend generates a **unique share link:** `campustracker.local/share/{token}`
4. Link sent via SMS / WhatsApp to the contact
5. Contact opens link — sees a **read-only live map** of the student's bus (no login required)
6. Share auto-expires when bus reaches the destination stop

### 4.3 Backend Requirements

```
POST /journey/share
{
  "student_id":    42,
  "contact_name":  "Mom",
  "contact_phone": "+91 98765 43210",
  "bus_id":        "BUS-04",
  "expires_at":    "on_destination_arrival"
}

Response:
{
  "share_id":   "abc123",
  "share_url":  "https://campustracker.local/share/abc123",
  "expires_at": "2026-05-01T08:25:00Z"
}
```

---

## 5. Feature 3 — Virtual Escort Request

### 5.1 UI

```
┌──────────────────────────────────────────────┐
│  🛡️ Virtual Escort                           │
│  ─────────────────────────────────────────   │
│                                              │
│  Request a digital walk-along from           │
│  campus dispatch. They will monitor          │
│  your location until you arrive safely.      │
│                                              │
│  Destination:                                │
│  ┌─────────────────────────────────────────┐ │
│  │  🏁  RIT Chennai — Main Gate            │ │  ← auto-filled from route
│  └─────────────────────────────────────────┘ │
│                                              │
│  [Request Escort Now]                        │
│                                              │
│  Typical response time: < 2 minutes          │
└──────────────────────────────────────────────┘
```

### 5.2 States

| State | UI |
|-------|-----|
| Idle | "Request Escort Now" button |
| Pending | "Waiting for dispatch to accept..." spinner |
| Active | "🛡️ Escort Active — Dispatch is monitoring your trip" green banner |
| Arrived | "✅ You have arrived safely. Escort ended." |

### 5.3 Backend Endpoint

```
POST /escort/request
{
  "student_id":      42,
  "current_lat":     13.0445,
  "current_lng":     80.2362,
  "destination_stop": "RIT",
  "bus_id":          "BUS-04"
}
```

---

## 6. Feature 4 — Incident Report Form

### 6.1 Incident Type Selector

A horizontal chip selector at the top of the form:

```
┌──────────────────────────────────────────────┐
│  📋 Report an Incident                       │
│  ─────────────────────────────────────────   │
│                                              │
│  What happened?                              │
│  ┌──────────────────────────────────────┐    │
│  │ [Accident] [Breakdown] [Suspicious]  │    │
│  │ [Overcrowding] [Other]               │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  Bus: [BUS-04 ▾]                            │
│                                              │
│  Location:                                   │
│  ┌──────────────────────────────────────┐    │
│  │  📍  Using your current GPS location │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  Details (optional):                         │
│  ┌──────────────────────────────────────┐    │
│  │  Describe what you observed...       │    │
│  │                                      │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  [Submit Report]                             │
└──────────────────────────────────────────────┘
```

### 6.2 Incident Types & Alert Mapping

| Chip | Alert Type Sent to Backend | Admin Severity |
|------|--------------------------|---------------|
| Accident | `accident` | 🔴 Critical |
| Breakdown | `breakdown` | 🔴 Critical |
| Suspicious Activity | `suspicious_activity` | 🟡 High |
| Overcrowding | `overcrowding` | 🟠 Medium |
| Other | `general` | 🟢 Low |

### 6.3 Submission Payload

```json
POST /alerts
{
  "type":         "accident",
  "triggered_by": 42,
  "bus_id":       "BUS-04",
  "lat":          13.0445,
  "lng":          80.2362,
  "message":      "Fender bender near Avadi junction — no injuries"
}
```

### 6.4 Post-Submit Confirmation

```
┌──────────────────────────────────────────────┐
│  ✅ Report Submitted                          │
│  Alert #8842 sent to management              │
│  Thank you for keeping campus safe.          │
│  [Submit Another]   [Return to Safety Hub]   │
└──────────────────────────────────────────────┘
```

---

## 7. Feature 5 — Emergency Directory

### 7.1 UI

```
┌──────────────────────────────────────────────┐
│  📞 Emergency Directory                      │
│  ─────────────────────────────────────────   │
│                                              │
│  🚔  Campus Police                          │
│      +91 44 2345 6789              [Call]    │
│                                              │
│  🏥  University Medical Centre              │
│      +91 44 2345 9876              [Call]    │
│                                              │
│  🚌  SafeRide Dispatch                      │
│      +91 99887 76655               [Call]    │
│                                              │
│  🔥  Fire & Emergency                       │
│      112 (National)                [Call]    │
└──────────────────────────────────────────────┘
```

### 7.2 Directory Component

```jsx
// components/safety/EmergencyDirectory.jsx

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

      {CONTACTS.map(({ emoji, name, phone }) => (
        <div key={phone}
          className="flex items-center justify-between py-3"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14,
                        fontWeight: 500, color: "var(--text-primary)" }}>
              {emoji} {name}
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12,
                        color: "var(--text-muted)" }}>
              {phone.startsWith("+") ? phone.replace("+91", "+91 ") : phone}
            </p>
          </div>
          <a href={`tel:${phone}`}
            className="btn-primary text-sm px-4 py-2 rounded-[var(--radius-md)]">
            Call
          </a>
        </div>
      ))}
    </div>
  );
}
```

---

## 8. SafetyHub Page Assembly

```jsx
// pages/SafetyHub.jsx

import { useState }              from "react";
import { motion }                from "framer-motion";
import PageHeader                from "../components/PageHeader";
import SOSHoldButton             from "../components/safety/SOSHoldButton";
import JourneySharePanel         from "../components/safety/JourneySharePanel";
import VirtualEscortRequest      from "../components/safety/VirtualEscortRequest";
import IncidentReportForm        from "../components/safety/IncidentReportForm";
import EmergencyDirectory        from "../components/safety/EmergencyDirectory";
import SOSConfirmationModal      from "../components/safety/SOSConfirmationModal";

export default function SafetyHub() {
  const [sosAlert, setSOSAlert] = useState(null);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}>

      <PageHeader title="Safety Hub" />

      <div className="px-4 pt-4 pb-6 flex flex-col gap-4"
        style={{ background: "var(--bg-primary)" }}>

        {/* 1. SOS */}
        <SOSHoldButton onSuccess={(alert) => setSOSAlert(alert)} />

        {/* 2. Journey Share */}
        <JourneySharePanel />

        {/* 3. Virtual Escort */}
        <VirtualEscortRequest />

        {/* 4. Incident Report */}
        <IncidentReportForm />

        {/* 5. Emergency Directory */}
        <EmergencyDirectory />

      </div>

      {/* SOS sent confirmation modal */}
      {sosAlert && (
        <SOSConfirmationModal
          alert={sosAlert}
          onClose={() => setSOSAlert(null)}
        />
      )}
    </motion.div>
  );
}
```
