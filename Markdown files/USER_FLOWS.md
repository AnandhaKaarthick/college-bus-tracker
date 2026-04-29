# USER FLOWS
## Real-Time College Bus Tracking System

---

## 1. Student — Track My Bus

**Goal:** A student wants to know when their bus will arrive at their stop.

```
[Open App]
     │
     ▼
[Home Screen — Map loads]
     │
     ▼
[App fetches live bus positions via WebSocket]
     │
     ▼
[Bus icons appear on map, animated smoothly]
     │
     ▼
[Student selects their stop or route]
     │
     ▼
[Route polyline + stop markers render]
     │
     ▼
[ETA calculated via OSRM + current bus position]
     │
     ▼
[Bottom sheet shows: Bus name | Status | ETA | Driver info]
     │
     ▼
[Student waits — ETA updates in real time]
     │
     ├── Bus enters 1 km geofence ──► [Push Notification: "Bus arriving in ~3 min"]
     │
     ▼
[Student boards the bus] ── END
```

---

## 2. Student — Set Up Stop Alerts

**Goal:** Configure personal geofence notifications for a preferred stop.

```
[Open App → Menu → My Stop Settings]
          │
          ▼
[Select Route from dropdown]
          │
          ▼
[Select preferred Stop from list]
          │
          ▼
[Set notification radius: 500m / 1km / 2km]
          │
          ▼
[App saves preference to backend]
          │
          ▼
[Push token registered for that student + stop combo]
          │
          ▼
[Next time bus enters radius → silent push sent] ── END
```

---

## 3. Driver — Start a Trip & Broadcast GPS

**Goal:** Driver opens the app, starts their route, and begins broadcasting location.

```
[Driver opens mobile browser → campustracker.local/driver]
          │
          ▼
[Login with driver credentials]
          │
          ▼
[Driver Dashboard loads — shows assigned route]
          │
          ▼
[Tap "Start Trip"]
          │
          ▼
[Screen Wake Lock API activated — screen stays on]
          │
          ▼
[Browser Geolocation API begins watching position]
          │
          ▼
[WebSocket connection established to backend]
          │
          ▼
[GPS coordinates sent every 3–5 seconds]
     │                │
     ▼                ▼
[Server updates    [Server broadcasts
bus_live_positions]  to all connected students]
          │
          ▼
[Driver updates occupancy as passengers board]
          │
          ▼
[Driver reaches final stop → taps "End Trip"]
          │
          ▼
[WebSocket closes, GPS stops, status → offline] ── END
```

---

## 4. Driver — Trigger Panic Alert

**Goal:** Driver encounters an emergency and alerts campus security.

```
[Driver is on active trip]
          │
          ▼
[Driver taps 🔴 PANIC BUTTON]
          │
          ▼
[Confirmation modal appears: "Send Emergency Alert?"]
          │
     ┌────┴────┐
   [Yes]      [No → dismiss]
     │
     ▼
[App captures current GPS coordinates]
     │
     ▼
[POST /alerts/panic → backend]
     │
     ▼
[Alert created in DB with GPS tag]
     │
     ├──► [Admin dashboard → alert banner appears in red]
     ├──► [Campus security notified via push/SMS]
     └──► [Bus status updated → "breakdown"]
          │
          ▼
[Alert acknowledged by admin → resolved] ── END
```

---

## 5. Admin — Monitor Fleet in Real Time

**Goal:** Admin watches all active buses from the dashboard.

```
[Admin logs in → Dashboard]
          │
          ▼
[Sidebar loads: list of all buses with status pills]
          │
          ▼
[Map panel shows all bus icons (live via WebSocket)]
          │
          ▼
[Admin clicks a bus in sidebar]
          │
          ▼
[Map centers on that bus, telemetry panel expands]
          │
          ▼
[Telemetry shows: speed, heading, idle time, last update]
          │
     ┌────┴────────────────────┐
     ▼                         ▼
[View Breadcrumb Trail]    [View Alert History]
     │                         │
     ▼                         ▼
[Map draws ghost path      [Alert list with
 of last 1h / 6h / 24h]    timestamps & locations]
     │
     ▼
[Admin resolves any active alerts] ── END
```

---

## 6. Admin — Historical Playback (Time Machine)

**Goal:** Admin replays a bus's exact route from a past date.

```
[Admin Dashboard → Select Bus → "View History"]
          │
          ▼
[Date/Time Picker: Select start and end time]
          │
          ▼
[GET /history/{bus_id}?start=...&end=... called]
          │
          ▼
[Map loads historical GPS points as polyline]
          │
          ▼
[Playback controls appear: ▶ Play | ⏸ Pause | ⏭ Skip]
          │
          ▼
[Bus icon animates along the recorded path at 10× speed]
          │
          ▼
[Admin can pause, scrub, or click on path to see timestamp]
          │
          ▼
[Download report option: CSV of all coordinates] ── END
```

---

## 7. Student — Crowdsourced Location Check-in

**Goal:** Students aboard a bus verify or correct the bus location if driver GPS fails.

```
[Student on Bus → opens app → sees bus not updating]
          │
          ▼
[App shows: "GPS signal lost — Help locate this bus?"]
          │
          ▼
[Student taps "Verify Location"]
          │
          ▼
[App captures student's device GPS]
          │
          ▼
[POST /buses/{bus_id}/checkin with lat/lng]
          │
          ▼
[If 2+ students submit → backend averages coordinates]
          │
          ▼
[Averaged position broadcast to all tracking students]
          │
          ▼
[Map updates with community-sourced location]
          │
          ▼
[Original GPS recovers → system auto-reverts] ── END
```

---

## 8. Authentication Flow (All Roles)

```
[Visit App]
     │
     ▼
[Login Screen]
     │
     ▼
[Submit email + password + role]
     │
     ▼
[POST /auth/login]
     │
  ┌──┴──┐
[200]  [401]
  │      └──► [Show error: "Invalid credentials"]
  ▼
[JWT stored in memory / secure cookie]
  │
  ▼
[Redirect based on role:]
  ├── student → /map
  ├── driver  → /driver
  └── admin   → /dashboard
```
