# STUDENT DASHBOARD SPECIFICATION
## Real-Time College Bus Tracking System

> **Design Goal:** A student opens the app and knows exactly how many minutes they have before they need to leave their room — no friction, no confusion.

---

## 0. Dashboard Philosophy

The student dashboard is built around a single principle: **the map IS the interface.** Every component exists either on top of the map or as a contextual layer that slides in when needed. This mimics the Uber/Rapido experience — immersive, predictive, and action-oriented.

**Three questions the dashboard must answer instantly:**
1. 🚌 Where is my bus right now?
2. ⏱️ How many minutes until it reaches my stop?
3. 🪑 Will I get a seat?

---

## 1. Interactive Map Layer (Core UI)

The map occupies **100% of the viewport** — no sidebars, no navbars eating into screen real estate. All controls float on top of the map as translucent overlays.

### 1.1 Real-Time Bus Markers

| Property | Specification |
|----------|--------------|
| Icon | Custom SVG bus icon — color-coded by occupancy |
| Animation | `Leaflet.MovingMarker` — smooth interpolation between GPS coordinates |
| Update Frequency | New position every 3–5 seconds via WebSocket |
| Teleport Prevention | Snap-to-road via OSRM map-matching before rendering |
| Pulse Ring | Animated ripple ring around the bus icon when actively moving |

**Occupancy Color Coding:**

```
🟢  Green  →  Low Occupancy    (seats available)
🟡  Yellow →  Medium Occupancy (limited seats)
🔴  Red    →  Full             (no seats — board at your own risk)
```

### 1.2 User Location — Blue Dot

- Pulsating blue dot representing the student's **live GPS position**
- Shows proximity to their selected boarding stop
- Soft glow effect to distinguish from bus markers
- Falls back to "Last Known Location" if GPS is unavailable

### 1.3 Polyline Route Overlay

- **Semi-transparent colored polyline** drawn along the bus's official route path
- All official college stops marked as numbered pin icons along the polyline
- Student's selected stop highlighted with a **larger, filled pin** in primary blue
- Completed stops (bus has passed them) rendered in a **faded/muted color**
- Upcoming stops remain **bright and solid**

```
Stop 1 ──●── Stop 2 ──●── [YOUR STOP] ──◉── Stop 4 ──●── Stop 5
(passed)      (passed)     (selected)         (upcoming)  (upcoming)
 faded         faded       bright blue         bright      bright
```

### 1.4 Dynamic Auto-Zoom

The map automatically adjusts zoom level to keep **both** the approaching bus and the student's stop within the viewport simultaneously.

| Scenario | Zoom Behavior |
|----------|--------------|
| Bus > 5 km away | Wide zoom — full route visible |
| Bus 1–5 km away | Medium zoom — bus + student area |
| Bus < 1 km away | Close zoom — street-level detail |
| Bus at stop | Maximum zoom — building-level |

**Implementation note:** Use Leaflet's `fitBounds()` with padding to avoid markers touching screen edges.

---

## 2. Predictive Information Panel — Bottom Sheet

A **draggable bottom sheet** that slides up from the bottom of the screen — hidden by default, expanded on bus selection or tap. This keeps the map unobstructed until the student needs details.

### 2.1 Sheet States

```
┌─────────────────────────────────────┐
│  ════  (drag handle)                │  ← COLLAPSED (peek state)
│  🚌 Bus 04 — Arriving in 4 mins    │    Shows only: bus name + ETA
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  ════                               │  ← HALF-EXPANDED
│  Bus 04 — North Campus Route        │    Shows: full bus card + stops
│  ⏱️ Arriving in 4 mins             │
│  🪑 Crowd Level: MEDIUM             │
│  ─────────────────────────────────  │
│  Stop Progress: ● ● ◉ ○ ○ ○        │
│  [📞 Call Driver]   [📍 Track]     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  ════                               │  ← FULL EXPANDED
│  (All above + stop-by-stop list)    │    Shows: complete route stops
└─────────────────────────────────────┘
```

### 2.2 Live ETA — The Hero Metric

The ETA is the most important number on the screen. It must be **immediately readable** — large font, center-aligned, bold.

```
┌───────────────────────────────┐
│       Arriving in             │
│                               │
│         4 mins                │  ← font-bold text-5xl, primary blue
│                               │
│    📍 1.2 km away             │  ← secondary label, muted
└───────────────────────────────┘
```

**ETA Calculation Formula:**

$$ETA = \frac{Distance_{Remaining}}{Velocity_{Average}} + Traffic_{Offset}$$

| Variable | Source |
|----------|--------|
| `Distance_Remaining` | OSRM route distance from current bus GPS to student's stop |
| `Velocity_Average` | Rolling 60-second average of bus speed (from WebSocket telemetry) |
| `Traffic_Offset` | +0 to +2 min buffer based on time-of-day (peak hours) |

**ETA Color States:**

```
> 10 mins  →  Grey    (calm, no urgency)
5–10 mins  →  Blue    (start getting ready)
2–5 mins   →  Amber   (head to stop now!)
< 2 mins   →  Red     (flashing — run!)
```

### 2.3 Bus Identity Card

```
┌───────────────────────────────────────────┐
│  🚌  Bus 04          North Campus Route   │
│  ─────────────────────────────────────    │
│  Driver:  Ramesh Kumar                    │
│  Vehicle: TN 09 AB 1234                   │
│                                           │
│  [📞 Call Driver]    [💬 WhatsApp]        │
└───────────────────────────────────────────┘
```

- Driver name and phone fetched from `GET /buses/{bus_id}`
- "Call Driver" opens native phone dialer via `tel:` URI
- Contact shown only for active, on-route buses

### 2.4 Occupancy Indicator

A **Crowd Level badge** displayed prominently beneath the ETA, updated in real time via WebSocket broadcast.

```
┌─────────────────────────────┐
│  Crowd Level                │
│  ████████░░  MEDIUM         │  ← visual fill bar
│  Seats available            │
└─────────────────────────────┘
```

| Level | Badge Color | Bar Fill | Label |
|-------|------------|----------|-------|
| Low | Green | 33% | "Comfortable — plenty of seats" |
| Medium | Amber | 66% | "Moderate — limited seats" |
| Full | Red | 100% | "Full — next bus recommended" |

### 2.5 Stop Progress Bar

A **vertical stepper** showing the bus's journey through all stops on the route.

```
  ✅  Stop 1: Main Gate         (completed — bus has passed)
  ✅  Stop 2: Admin Block       (completed)
  🔵  Stop 3: Library           ← NEXT STOP (highlighted, pulsing)
  ⬤   Stop 4: YOUR STOP        ← STUDENT'S STOP (distinct icon)
  ○   Stop 5: North Hostel      (upcoming)
  ○   Stop 6: Sports Complex    (upcoming)
```

- Completed stops: grey with ✅ checkmark
- Next stop: animated pulse, blue ring
- Student's stop: filled star/pin icon, primary blue
- Tapping a stop shows its name and estimated arrival time

---

## 3. Search & Route Discovery

### 3.1 Floating Search Bar

A translucent, frosted-glass search bar pinned to the top of the map.

```
┌────────────────────────────────────────┐
│  🔍  Search route or stop...     [≡]  │
└────────────────────────────────────────┘
```

- `backdrop-blur` + `bg-white/70` for the glassmorphism effect
- Supports search by: route number, route name, stop name
- Results appear as a dropdown list below the bar, overlaying the map
- Selecting a result zooms to that route/stop and loads the bus card

### 3.2 Recent Routes — Quick Select

Displayed immediately below the search bar when it is focused (or on a "Home" state with no active selection):

```
┌──────────────────────────────────────────┐
│  ⏱️  Recent Routes                       │
│  ┌─────────────────┐  ┌───────────────┐  │
│  │ 🚌 Route 04     │  │ 🚌 Route 02  │  │
│  │ North Campus    │  │ South Hostel  │  │
│  └─────────────────┘  └───────────────┘  │
└──────────────────────────────────────────┘
```

- Stored in `localStorage` — last 2 routes tracked
- One tap loads the full bus card and map tracking for that route

### 3.3 Stop-Based Filtering

Students can filter by their **boarding stop** to see only buses serving that stop.

```
Showing buses for: [Main Gate ▾]
─────────────────────────────────
🚌  Bus 04 — North Campus  →  4 min
🚌  Bus 07 — East Block    →  11 min
🚌  Bus 02 — South Loop    →  18 min
```

- Dropdown populated from `GET /routes` stop data
- Results sorted by ascending ETA
- Each result tappable to switch tracking to that bus

---

## 4. Notifications & Alerts

### 4.1 Geofence "Wake Up" Alert

A persistent toggle in Settings (accessible from the ≡ menu):

```
┌──────────────────────────────────────────┐
│  🔔  Alert me when my bus is...          │
│                                          │
│  ○  1 km away                            │
│  ○  2 stops away                         │
│  ○  Both                                 │
│                                          │
│  [Save Preferences]                      │
└──────────────────────────────────────────┘
```

**Push notification format:**
```
📍  Bus 04 is 1 km away — arriving in ~3 min
    [Open App]
```

- Delivered via **Firebase Cloud Messaging (FCM)**
- Push token stored in `student_stop_preferences` table
- Works even when the app is in the background

### 4.2 Status Ticker — Announcement Marquee

A thin scrolling banner beneath the search bar for **management broadcasts:**

```
╔═══════════════════════════════════════════╗
║  📢  Bus 04 delayed ~10 min — tire issue  ║  ← scrolls horizontally
╚═══════════════════════════════════════════╝
```

- Background: `bg-amber-400` for delays, `bg-red-500` for emergencies
- Tap to expand full announcement text
- Fetched from a `/announcements` endpoint, updated every 60 seconds
- Dismissible with an ✕ button (stores dismissal in session)

### 4.3 Emergency SOS Button

A **discreet but accessible** panic button available to students at all times.

**Location:** Floating action button in the bottom-right corner of the map (always visible, not inside the bottom sheet).

```
                                       ┌─────┐
                                       │ SOS │  ← floating, bottom-right
                                       └─────┘
```

**Confirmation dialog on tap:**
```
┌─────────────────────────────────────────────┐
│  🚨  Send Emergency Alert?                  │
│                                             │
│  Your current GPS location will be shared   │
│  with campus security immediately.          │
│                                             │
│  [Cancel]            [YES, SEND ALERT]      │
└─────────────────────────────────────────────┘
```

- Sends `POST /alerts/panic` with student's GPS coordinates
- Notifies campus security via push + email
- Student's location pin appears on admin/security map instantly

---

## 5. Technical Requirements

### 5.1 Component Architecture (React)

```
<StudentDashboard>
  ├── <MapContainer />                  ← Full-screen Leaflet map
  │     ├── <BusMarkerLayer />          ← Animated bus icons
  │     ├── <UserLocationDot />         ← Pulsating blue dot
  │     ├── <RoutePolylineLayer />      ← Route path + stop pins
  │     └── <DynamicZoomController />  ← Auto-zoom logic
  │
  ├── <FloatingSearchBar />             ← Top overlay
  │     ├── <RecentRoutes />
  │     └── <StopFilterDropdown />
  │
  ├── <StatusTicker />                  ← Announcement marquee
  │
  ├── <BottomSheet />                   ← Framer Motion animated
  │     ├── <ETADisplay />              ← Hero countdown
  │     ├── <BusIdentityCard />         ← Bus + driver info
  │     ├── <OccupancyBadge />          ← Crowd level
  │     └── <StopProgressStepper />    ← Route stop list
  │
  └── <SOSButton />                     ← Floating action button
```

### 5.2 Technology Matrix

| Feature | Technical Component | Notes |
|---------|-------------------|-------|
| Map Rendering | `Leaflet.js` + OpenStreetMap | Free, open-source |
| Dark Map Tiles | `Maptiler` dark style | Free tier |
| Bus Marker Animation | `Leaflet.MovingMarker` plugin | Smooth interpolation |
| Real-Time Data | WebSocket (`useWebSocket` hook) | FastAPI backend |
| State Management | React Context API | `BusContext` + `UserContext` |
| Bottom Sheet Animation | `Framer Motion` | `drag`, `dragConstraints` |
| Push Notifications | Firebase Cloud Messaging (FCM) | Free tier |
| ETA Calculation | OSRM API | Free, self-hostable |
| Geocoding | LocationIQ | 5,000 req/day free |

### 5.3 WebSocket Event Handling

```javascript
// BusContext.js — Global WebSocket state
const ws = new WebSocket(`wss://api.campustracker.local/ws/live?token=${jwt}`);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case "bus_position":
      updateBusMarker(data.bus_id, data.lat, data.lng);
      recalculateETA(data.bus_id);
      break;

    case "geofence_alert":
      triggerPushNotification(data.message, data.eta_seconds);
      break;

    case "occupancy_update":
      updateOccupancyBadge(data.bus_id, data.occupancy);
      break;

    case "status_change":
      updateBusStatus(data.bus_id, data.status);
      showStatusTicker(data.message);
      break;
  }
};
```

### 5.4 Performance Considerations

| Concern | Strategy |
|---------|----------|
| GPS updates flooding React re-renders | Debounce marker updates to max 1 re-render per second |
| Map lag on low-end phones | Use `Leaflet.Canvas` renderer instead of SVG for many markers |
| WebSocket reconnection | Auto-reconnect with exponential backoff (1s → 2s → 4s → max 30s) |
| ETA API calls | Cache OSRM response for 5 seconds; don't call on every GPS tick |
| Bundle size | Lazy-load Leaflet and Framer Motion — not needed on login page |

---

## 6. Screen Layout — Final Wireframe

```
┌─────────────────────────────────────────┐
│ 🔍  Search route or stop...      [≡]   │  ← Floating search bar
├─────────────────────────────────────────┤
│ 📢  Bus 04 delayed ~10 min — tire...   │  ← Status ticker (conditional)
├─────────────────────────────────────────┤
│                                         │
│                                         │
│         F U L L - S C R E E N          │
│              M A P                      │
│                                         │
│   🚌 ────────────────────>  📍        │
│   (bus, animated)          (your stop) │
│                                         │
│          🔵 (your location)             │
│                                         │
│                              ┌──────┐  │
│                              │ SOS  │  │  ← Floating action button
│                              └──────┘  │
├────────────╦════════════════════════════╣
│            ║  drag handle              │  ← Bottom sheet (collapsed)
│  🚌 Bus 04 ║  Arriving in  4 mins      │
│            ║  🟡 MEDIUM                │
├────────────╩════════════════════════════╣
│  (expanded bottom sheet on swipe up)   │
│  ┌──────────────────────────────────┐  │
│  │ Bus 04 — North Campus Route      │  │
│  │ Driver: Ramesh  [📞 Call]        │  │
│  │                                  │  │
│  │ ✅ Main Gate                     │  │
│  │ ✅ Admin Block                   │  │
│  │ 🔵 Library ← NEXT               │  │
│  │ ⭐ YOUR STOP                     │  │
│  │ ○  North Hostel                  │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 7. Edge Cases & Error States

| Scenario | UI Response |
|----------|------------|
| Bus GPS signal lost > 30s | Show "📡 Signal lost — last seen X mins ago" on bus card |
| No buses currently active | Empty state: "No active buses on this route right now" |
| Student GPS unavailable | Hide blue dot; disable distance-based features gracefully |
| WebSocket disconnected | Show reconnecting spinner in top-right corner |
| Bus marked as "Full" | Show red banner: "This bus is full — view next bus" |
| Network offline | Show offline toast; display last cached bus positions |
| ETA calculation failed | Show "ETA unavailable" instead of breaking the UI |
