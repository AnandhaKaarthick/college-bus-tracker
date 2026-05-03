# AYAPAKKAM_TO_RIT_ROUTE_SPEC.md
## Real-World Route Specification — Dummy Bus Simulator
### Ayapakkam → RIT Chennai (West Chennai Corridor)

> **Purpose:** This file defines the complete real-road route, OSRM road-point expansion strategy, per-stop ETA logic, and the student dashboard "tap-a-stop" interaction that shows live ETA from the student's current GPS position to any upcoming stop.

---

## 0. Route Identity

| Field | Value |
|-------|-------|
| **Route ID** | `ROUTE-AYP-RIT-01` |
| **Route Name** | Ayapakkam → RIT Express |
| **Direction** | One-way (AM inbound) |
| **Total Distance** | ~28 km |
| **Estimated Travel Time** | ~55–70 min (with traffic) |
| **Operating Hours** | 07:00 – 09:30 (morning), 16:30 – 19:00 (evening) |
| **Bus ID (Simulator)** | `BUS-04` |
| **Simulator Mode** | One-shot (start → end, no loop) |

---

## 1. Master Waypoint Array

These are the 9 key anchor stops. The simulator uses OSRM to **expand** these into hundreds of road-level micro-points between each pair.

```json
[
  {
    "stop_order": 1,
    "stop_id": "AYP",
    "name": "Ayapakkam Bus Stand",
    "lat": 13.1044,
    "lng": 80.1417,
    "is_stop": true,
    "dwell_seconds": 60,
    "speed_zone_kmh": 0,
    "occupancy_on_depart": "Low",
    "zone_type": "origin",
    "traffic_multiplier": 1.0,
    "cumulative_distance_km": 0.0,
    "scheduled_departure": "07:00:00"
  },
  {
    "stop_order": 2,
    "stop_id": "AMB",
    "name": "Ambattur OT",
    "lat": 13.1114,
    "lng": 80.1554,
    "is_stop": true,
    "dwell_seconds": 30,
    "speed_zone_kmh": 12,
    "occupancy_on_depart": "Medium",
    "zone_type": "high_traffic",
    "traffic_multiplier": 0.5,
    "cumulative_distance_km": 3.4,
    "scheduled_departure": "07:09:00"
  },
  {
    "stop_order": 3,
    "stop_id": "TMV",
    "name": "Thirumullaivoyal",
    "lat": 13.1311,
    "lng": 80.1332,
    "is_stop": true,
    "dwell_seconds": 30,
    "speed_zone_kmh": 25,
    "occupancy_on_depart": "Medium",
    "zone_type": "mid_route",
    "traffic_multiplier": 0.8,
    "cumulative_distance_km": 7.1,
    "scheduled_departure": "07:18:00"
  },
  {
    "stop_order": 4,
    "stop_id": "AVD",
    "name": "Avadi Bus Stand",
    "lat": 13.1143,
    "lng": 80.1070,
    "is_stop": true,
    "dwell_seconds": 45,
    "speed_zone_kmh": 20,
    "occupancy_on_depart": "Full",
    "zone_type": "major_junction",
    "traffic_multiplier": 0.6,
    "cumulative_distance_km": 12.3,
    "scheduled_departure": "07:31:00"
  },
  {
    "stop_order": 5,
    "stop_id": "PPT",
    "name": "Paruthipattu",
    "lat": 13.1027,
    "lng": 80.0883,
    "is_stop": true,
    "dwell_seconds": 30,
    "speed_zone_kmh": 35,
    "occupancy_on_depart": "Full",
    "zone_type": "residential",
    "traffic_multiplier": 1.0,
    "cumulative_distance_km": 16.0,
    "scheduled_departure": "07:40:00"
  },
  {
    "stop_order": 6,
    "stop_id": "SNK",
    "name": "Sennerkuppam",
    "lat": 13.0645,
    "lng": 80.1065,
    "is_stop": true,
    "dwell_seconds": 20,
    "speed_zone_kmh": 30,
    "occupancy_on_depart": "Full",
    "zone_type": "bypass_approach",
    "traffic_multiplier": 0.9,
    "cumulative_distance_km": 20.5,
    "scheduled_departure": "07:50:00"
  },
  {
    "stop_order": 7,
    "stop_id": "PNM",
    "name": "Poonamallee Bus Stand",
    "lat": 13.0473,
    "lng": 80.0945,
    "is_stop": true,
    "dwell_seconds": 60,
    "speed_zone_kmh": 10,
    "occupancy_on_depart": "Medium",
    "zone_type": "heavy_traffic",
    "traffic_multiplier": 0.4,
    "triggers_delay_alert": true,
    "delay_message": "Heavy traffic at Poonamallee — expect 5–10 min delay",
    "cumulative_distance_km": 23.8,
    "scheduled_departure": "08:05:00"
  },
  {
    "stop_order": 8,
    "stop_id": "KTB",
    "name": "Kuthambakkam",
    "lat": 13.0245,
    "lng": 80.0156,
    "is_stop": true,
    "dwell_seconds": 20,
    "speed_zone_kmh": 40,
    "occupancy_on_depart": "Medium",
    "zone_type": "industrial",
    "traffic_multiplier": 1.0,
    "cumulative_distance_km": 26.2,
    "scheduled_departure": "08:17:00"
  },
  {
    "stop_order": 9,
    "stop_id": "RIT",
    "name": "RIT Chennai — Main Gate",
    "lat": 13.0097,
    "lng": 80.0040,
    "is_stop": true,
    "dwell_seconds": 0,
    "speed_zone_kmh": 0,
    "occupancy_on_depart": "Low",
    "zone_type": "destination",
    "traffic_multiplier": 1.0,
    "cumulative_distance_km": 28.0,
    "scheduled_arrival": "08:25:00"
  }
]
```

---

## 2. Scheduled ETA Table (No-Traffic Baseline)

This table is the ground truth for ETA calculations. The simulator uses it as a baseline and adjusts dynamically based on `traffic_multiplier` and current bus speed.

| Stop | Scheduled Time | From Ayapakkam | Segment Distance | Segment Time |
|------|---------------|----------------|-----------------|-------------|
| Ayapakkam | 07:00 | 0 min | — | — |
| Ambattur OT | 07:09 | 9 min | 3.4 km | ~9 min |
| Thirumullaivoyal | 07:18 | 18 min | 3.7 km | ~9 min |
| Avadi Bus Stand | 07:31 | 31 min | 5.2 km | ~13 min |
| Paruthipattu | 07:40 | 40 min | 3.7 km | ~9 min |
| Sennerkuppam | 07:50 | 50 min | 4.5 km | ~10 min |
| Poonamallee | 08:05 | 65 min | 3.3 km | ~15 min (traffic) |
| Kuthambakkam | 08:17 | 77 min | 2.4 km | ~12 min |
| RIT Chennai | 08:25 | 85 min | 1.8 km | ~8 min |

---

## 3. OSRM Road-Point Expansion

The 9 anchor stops above are just waypoints. For real road movement, the simulator calls OSRM to get the actual road geometry between each pair.

### 3.1 OSRM API Call Format

```
GET http://router.project-osrm.org/route/v1/driving/
  {lng1},{lat1};{lng2},{lat2}
  ?overview=full&geometries=geojson&steps=true
```

**Example — Ayapakkam to Ambattur OT:**
```
GET http://router.project-osrm.org/route/v1/driving/
  80.1417,13.1044;80.1554,13.1114
  ?overview=full&geometries=geojson
```

**Response (simplified):**
```json
{
  "routes": [{
    "distance": 3412.3,
    "duration": 524.1,
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [80.1417, 13.1044],
        [80.1421, 13.1046],
        [80.1429, 13.1051],
        [80.1438, 13.1057],
        ...
        [80.1554, 13.1114]
      ]
    }
  }]
}
```

### 3.2 Expansion Pseudocode

```
PSEUDOCODE — expand_route_with_osrm(waypoints):

  full_road_points = []

  FOR i IN range(0, len(waypoints) - 1):
    wp_from = waypoints[i]
    wp_to   = waypoints[i + 1]

    response = osrm_route(wp_from.lng, wp_from.lat,
                           wp_to.lng,   wp_to.lat)

    road_coords = response.geometry.coordinates

    FOR each coord IN road_coords:
      full_road_points.append({
        "lat":               coord[1],
        "lng":               coord[0],
        "segment_from":      wp_from.stop_id,
        "segment_to":        wp_to.stop_id,
        "next_stop":         wp_to,
        "speed_zone_kmh":    wp_to.speed_zone_kmh,
        "traffic_multiplier":wp_to.traffic_multiplier
      })

  RETURN full_road_points
```

### 3.3 Expected Road Point Counts (Per Segment)

| Segment | Approx Road Points |
|---------|--------------------|
| Ayapakkam → Ambattur OT | ~85 points |
| Ambattur OT → Thirumullaivoyal | ~95 points |
| Thirumullaivoyal → Avadi | ~130 points |
| Avadi → Paruthipattu | ~90 points |
| Paruthipattu → Sennerkuppam | ~110 points |
| Sennerkuppam → Poonamallee | ~80 points |
| Poonamallee → Kuthambakkam | ~60 points |
| Kuthambakkam → RIT | ~45 points |
| **TOTAL** | **~695 road points** |

The simulator streams through all ~695 points, one every 2 seconds = ~23 minutes of raw streaming. Traffic multipliers slow it further to reach the realistic 85-minute journey.

---

## 4. Dynamic ETA Calculation

### 4.1 ETA Formula

At any moment, the backend computes:

```
ETA_to_stop = (remaining_road_points × interval_seconds) × traffic_multiplier
            + dwell_time_at_intermediate_stops
```

In code:
```
PSEUDOCODE — compute_eta(bus_agent, target_stop_id):

  # Find bus's current position in the full road point array
  current_index = bus_agent.current_point_index

  # Find the index where target_stop's road segment ends
  target_index = find_last_index_for_stop(target_stop_id)

  remaining_points = target_index - current_index

  # Base travel time (seconds)
  base_seconds = remaining_points × bus_agent.interval_seconds

  # Apply traffic multiplier for segments ahead
  adjusted_seconds = apply_traffic_multipliers(
      bus_agent, current_index, target_index, base_seconds
  )

  # Add dwell times at any stops between bus and target
  dwell_seconds = sum_dwell_times_between(
      bus_agent.next_stop_index, target_stop_id
  )

  total_eta_seconds = adjusted_seconds + dwell_seconds

  RETURN {
      "eta_seconds": round(total_eta_seconds),
      "eta_minutes": ceil(total_eta_seconds / 60),
      "distance_km": haversine_remaining(current_index, target_index)
  }
```

### 4.2 ETA Per Stop — Broadcast Packet

The backend sends this to the student's WebSocket every time the bus moves:

```json
{
  "type": "eta_update",
  "bus_id": "BUS-04",
  "current_lat": 13.1200,
  "current_lng": 80.1250,
  "current_segment": "Thirumullaivoyal → Avadi",
  "next_stop": {
    "stop_id": "AVD",
    "name": "Avadi Bus Stand",
    "lat": 13.1143,
    "lng": 80.1070,
    "eta_seconds": 340,
    "eta_minutes": 6,
    "distance_km": 2.1
  },
  "all_upcoming_stops": [
    { "stop_id": "AVD", "name": "Avadi Bus Stand",      "eta_minutes": 6  },
    { "stop_id": "PPT", "name": "Paruthipattu",          "eta_minutes": 15 },
    { "stop_id": "SNK", "name": "Sennerkuppam",          "eta_minutes": 25 },
    { "stop_id": "PNM", "name": "Poonamallee Bus Stand", "eta_minutes": 40 },
    { "stop_id": "KTB", "name": "Kuthambakkam",          "eta_minutes": 52 },
    { "stop_id": "RIT", "name": "RIT Chennai",           "eta_minutes": 60 }
  ],
  "timestamp": "2026-05-01T07:22:14Z"
}
```

---

## 5. Student Dashboard — Stop List & ETA Display

### 5.1 Next Stop Banner (Always Visible in Bottom Sheet)

The bottom sheet's **collapsed state** always shows the immediate next stop with a live countdown:

```
┌─────────────────────────────────────────────┐
│  ════  (drag handle)                        │
│                                             │
│  🚌  BUS-04 · Ayapakkam → RIT              │
│                                             │
│  Next Stop:  Avadi Bus Stand                │
│              ⏱️  Arriving in  6 mins        │
│                                             │
│  🟡  FULL  ·  On Track                     │
└─────────────────────────────────────────────┘
```

The "Next Stop" and ETA update automatically as each `eta_update` WebSocket packet arrives.

---

### 5.2 Full Stop Progress List (Expanded Bottom Sheet)

When the student swipes the sheet up, the **complete stop-by-stop progress list** appears:

```
┌────────────────────────────────────────────────┐
│  ════                                          │
│  BUS-04 — Ayapakkam → RIT Express             │
│  🟡 On Track  ·  Full  ·  ~60 min to RIT      │
│  ─────────────────────────────────────────     │
│                                                │
│  ✅  Ayapakkam Bus Stand       DEPARTED 07:00  │
│  ✅  Ambattur OT               DEPARTED 07:09  │
│  ✅  Thirumullaivoyal          DEPARTED 07:18  │
│                                                │
│  🔵  Avadi Bus Stand      ──── NEXT · 6 min   │  ← pulsing blue
│                                                │
│  ○   Paruthipattu              ~15 min         │  ← tappable
│  ○   Sennerkuppam              ~25 min         │  ← tappable
│  ○   Poonamallee Bus Stand     ~40 min         │  ← tappable
│  ○   Kuthambakkam              ~52 min         │  ← tappable
│  ⭐  RIT Chennai — Main Gate   ~60 min         │  ← destination
│                                                │
└────────────────────────────────────────────────┘
```

**Stop Row Visual States:**

| State | Icon | Color | Label |
|-------|------|-------|-------|
| Bus has passed | ✅ | Muted grey | `DEPARTED HH:MM` |
| Next stop (bus en route) | 🔵 pulsing | Primary blue | `NEXT · X min` |
| Upcoming (tappable) | ○ | Body text | `~X min` |
| Student's selected stop | ⭐ | Accent gold/blue | `~X min` |
| Destination | 🏁 | Success green | `~X min` |

---

### 5.3 Tap-a-Stop → ETA from Student's Live Location

When a student taps any **upcoming stop** in the list, a modal pops up showing:
1. Bus ETA to that stop (from bus's current position)
2. Walking ETA from student's live GPS to that stop
3. Recommendation: whether to board there or wait at the current stop

#### 5.3.1 Stop Detail Modal — UI

```
┌──────────────────────────────────────────────┐
│  📍  Poonamallee Bus Stand                   │
│  ────────────────────────────────────────    │
│                                              │
│  🚌  Bus arrives in      40 min              │
│       (2.1 km remaining for bus)             │
│                                              │
│  🚶  You reach stop in   12 min              │
│       (850m from your location)              │
│                                              │
│  ────────────────────────────────────────    │
│  💡  You have 28 min buffer. Walk comfortably│
│      or wait for pickup at Sennerkuppam.     │
│                                              │
│  [📍 Show on Map]   [🔔 Alert Me]  [✕ Close]│
└──────────────────────────────────────────────┘
```

#### 5.3.2 Three-Part ETA Calculation

When a stop is tapped, the frontend computes three values simultaneously:

```
PSEUDOCODE — on_stop_tap(tapped_stop, student_location, bus_agent):

  # --- Part 1: Bus ETA to tapped stop ---
  bus_eta = compute_eta(bus_agent, tapped_stop.stop_id)
  # Returns eta_minutes from BUS current position to the tapped stop

  # --- Part 2: Student walking ETA to tapped stop ---
  student_distance_km = haversine(
    student_location.lat, student_location.lng,
    tapped_stop.lat,      tapped_stop.lng
  )
  walk_speed_kmh = 5.0
  walk_eta_minutes = (student_distance_km / walk_speed_kmh) * 60

  # --- Part 3: Buffer calculation ---
  buffer_minutes = bus_eta.eta_minutes - ceil(walk_eta_minutes)

  # --- Part 4: Recommendation logic ---
  IF buffer_minutes > 15:
    recommendation = "You have plenty of time. Walk comfortably."
    recommendation_type = "safe"

  ELIF buffer_minutes > 5:
    recommendation = "Start walking now to reach the stop with time to spare."
    recommendation_type = "moderate"

  ELIF buffer_minutes >= 0:
    recommendation = "Walk quickly! Bus arrives at the stop soon."
    recommendation_type = "urgent"

  ELSE:
    recommendation = "Bus reaches this stop before you can walk there."
                   + " Board at your nearest stop instead."
    recommendation_type = "impossible"

  RETURN {
    "bus_eta_minutes":   bus_eta.eta_minutes,
    "bus_distance_km":   bus_eta.distance_km,
    "walk_eta_minutes":  ceil(walk_eta_minutes),
    "walk_distance_km":  round(student_distance_km, 2),
    "buffer_minutes":    buffer_minutes,
    "recommendation":    recommendation,
    "recommendation_type": recommendation_type
  }
```

#### 5.3.3 Recommendation Color Coding

| Buffer | Banner Color | Icon | Message Tone |
|--------|-------------|------|-------------|
| > 15 min | Green | 😌 | Calm — plenty of time |
| 5–15 min | Amber | 🚶 | Moderate — start walking |
| 0–5 min | Orange | 🏃 | Urgent — walk quickly |
| Negative | Red | ❌ | Not reachable — board at nearest stop |

#### 5.3.4 "Alert Me" Button Behavior

If the student taps **[🔔 Alert Me]** on the modal:

```
PSEUDOCODE — set_stop_alert(student, tapped_stop, bus_eta):

  # Calculate the moment to send the notification
  # Notify when bus is (walk_eta_minutes + 2) minutes from the stop

  trigger_at_bus_eta = walk_eta_minutes + 2   # 2 min buffer

  schedule_notification(
    student_id   = student.user_id,
    stop_id      = tapped_stop.stop_id,
    notify_when  = "bus_eta_to_stop <= trigger_at_bus_eta",
    message      = f"🚌 Bus 04 reaches {tapped_stop.name} in {trigger_at_bus_eta} min — leave now!"
  )
```

---

## 6. Simulator — State Events Per Stop

This table defines exactly what the dummy bus simulator **triggers** at each stop:

| Stop | Occupancy Change | Status Event | Ticker Message | Geofence Alert |
|------|-----------------|-------------|----------------|----------------|
| **Ayapakkam** (depart) | → Low | On Track | — | — |
| **Ambattur OT** | → Medium | On Track | — | Students near AMB alerted |
| **Thirumullaivoyal** | → Medium | On Track | — | Students near TMV alerted |
| **Avadi** | → Full | On Track | — | Students near AVD alerted |
| **Paruthipattu** | stays Full | On Track | — | Students near PPT alerted |
| **Sennerkuppam** | stays Full | On Track | — | Students near SNK alerted |
| **Poonamallee** | → Medium | ⚠️ Delayed | "Heavy traffic at Poonamallee — 5–10 min delay" | Students near PNM alerted |
| **Kuthambakkam** | stays Medium | On Track | Ticker cleared | Students near KTB alerted |
| **RIT** (arrive) | → Low | Arrived | "Bus 04 has arrived at RIT" | All remaining students notified |

---

## 7. React Implementation — Stop List Component

### 7.1 Component Structure

```jsx
// components/StopProgressList.jsx

export default function StopProgressList({ stops, busState, studentLocation }) {
  return (
    <div className="flex flex-col gap-1 px-4 pb-4">
      {stops.map((stop, index) => (
        <StopRow
          key={stop.stop_id}
          stop={stop}
          status={getStopStatus(stop, busState)}  // passed | next | upcoming | destination
          eta={busState.all_upcoming_stops
                 .find(s => s.stop_id === stop.stop_id)?.eta_minutes}
          onTap={() => openStopModal(stop, studentLocation, busState)}
        />
      ))}
    </div>
  );
}
```

### 7.2 Stop Row Component

```jsx
// components/StopRow.jsx

function StopRow({ stop, status, eta, onTap }) {
  const isUpcoming = status === "upcoming" || status === "destination";

  return (
    <button
      onClick={isUpcoming ? onTap : undefined}
      disabled={!isUpcoming}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-xl w-full text-left
        transition-colors duration-200
        ${isUpcoming
          ? "hover:bg-[var(--bg-tertiary)] cursor-pointer active:scale-[0.98]"
          : "cursor-default opacity-60"}
      `}
    >
      {/* Stop icon */}
      <StopIcon status={status} />

      {/* Stop name + ETA */}
      <div className="flex-1">
        <p className={`text-sm font-medium ${
          status === "next" ? "text-[var(--accent-primary)]" : "text-[var(--text-primary)]"
        }`}>
          {stop.name}
        </p>
        {status === "passed" && (
          <p className="text-xs text-[var(--text-muted)]">
            Departed {stop.actual_departure_time}
          </p>
        )}
        {status === "next" && (
          <p className="text-xs text-[var(--accent-primary)] font-semibold animate-pulse">
            NEXT · {eta} min
          </p>
        )}
        {(status === "upcoming" || status === "destination") && (
          <p className="text-xs text-[var(--text-secondary)]">~{eta} min</p>
        )}
      </div>

      {/* Tap hint for upcoming stops */}
      {isUpcoming && (
        <ChevronRightIcon className="w-4 h-4 text-[var(--text-muted)]" />
      )}
    </button>
  );
}
```

### 7.3 Stop Detail Modal

```jsx
// components/StopDetailModal.jsx
import { motion, AnimatePresence } from "framer-motion";

export default function StopDetailModal({ stop, etaData, onClose, onSetAlert }) {
  const { bus_eta_minutes, walk_eta_minutes, buffer_minutes,
          recommendation, recommendation_type, walk_distance_km } = etaData;

  const bgColor = {
    safe:       "bg-green-50  border-green-200  dark:bg-[#052E16] dark:border-green-900",
    moderate:   "bg-amber-50  border-amber-200  dark:bg-[#1C1200] dark:border-amber-900",
    urgent:     "bg-orange-50 border-orange-200 dark:bg-[#1C0A00] dark:border-orange-900",
    impossible: "bg-red-50    border-red-200    dark:bg-[#2D0000] dark:border-red-900",
  }[recommendation_type];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{    opacity: 0, y: 80 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-x-4 bottom-4 z-[200] rounded-2xl
                   bg-[var(--bg-secondary)] border border-[var(--border)]
                   shadow-2xl p-5"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Stop Info</p>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">{stop.name}</h3>
          </div>
          <button onClick={onClose}
            className="p-1 rounded-full hover:bg-[var(--bg-tertiary)]">
            <XIcon className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        {/* ETA Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Bus ETA */}
          <div className="rounded-xl bg-[var(--accent-primary-light)] p-3">
            <div className="flex items-center gap-1 mb-1">
              <BusIcon className="w-4 h-4 text-[var(--accent-primary)]" />
              <p className="text-xs text-[var(--accent-primary)] font-medium">Bus arrives</p>
            </div>
            <p className="text-3xl font-black text-[var(--accent-primary)]">
              {bus_eta_minutes}
              <span className="text-sm font-normal ml-1">min</span>
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {etaData.bus_distance_km} km remaining
            </p>
          </div>

          {/* Walk ETA */}
          <div className="rounded-xl bg-[var(--bg-tertiary)] p-3">
            <div className="flex items-center gap-1 mb-1">
              <WalkIcon className="w-4 h-4 text-[var(--text-secondary)]" />
              <p className="text-xs text-[var(--text-secondary)] font-medium">You arrive</p>
            </div>
            <p className="text-3xl font-black text-[var(--text-primary)]">
              {walk_eta_minutes}
              <span className="text-sm font-normal ml-1">min</span>
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {walk_distance_km} km away
            </p>
          </div>
        </div>

        {/* Recommendation Banner */}
        <div className={`rounded-xl border px-4 py-3 mb-4 ${bgColor}`}>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            💡 {recommendation}
          </p>
          {buffer_minutes > 0 && (
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {buffer_minutes} min buffer available
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button onClick={() => focusStopOnMap(stop)}
            className="flex-1 py-2.5 rounded-xl border border-[var(--border)]
                       text-sm font-medium text-[var(--text-primary)]
                       hover:bg-[var(--bg-tertiary)]">
            📍 Show on Map
          </button>
          <button onClick={() => onSetAlert(stop, etaData)}
            className="flex-1 py-2.5 rounded-xl
                       bg-[var(--accent-primary)] text-white
                       text-sm font-medium hover:bg-[var(--accent-hover)]">
            🔔 Alert Me
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## 8. Simulator Script Behavior Summary

```
PSEUDOCODE — simulate_ayapakkam_rit():

  # Step 1: Load waypoints
  waypoints = load_json("ayapakkam_rit_stops.json")

  # Step 2: Expand with OSRM road points
  road_points = expand_route_with_osrm(waypoints)
  log(f"Route expanded: {len(road_points)} road points generated")

  # Step 3: Connect WebSocket
  ws = connect_websocket(WS_URL, token=DRIVER_JWT)

  # Step 4: Stream road points
  FOR i, point IN enumerate(road_points):

    # Calculate heading from this point to next
    heading = calculate_heading(point, road_points[i+1]) if i+1 < len else 0

    # Apply traffic speed multiplier
    speed = point.speed_zone_kmh * point.traffic_multiplier
    speed = apply_jitter(speed)

    # Build and send packet
    packet = {
      "type":      "gps_update",
      "bus_id":    "BUS-04",
      "lat":       point.lat,
      "lng":       point.lng,
      "speed":     speed,
      "heading":   heading,
      "occupancy": bus_state.occupancy,
      "status":    bus_state.status,
      "timestamp": utc_now()
    }
    ws.send(json(packet))

    # If this point is a stop, handle stop events
    IF point is stop_arrival:
      handle_stop(point.next_stop, bus_state)

    # Interval scaled by traffic
    interval = BASE_INTERVAL / point.traffic_multiplier
    sleep(clamp(interval, 1, 5))

  # Step 5: End of route
  log("Simulation complete. Bus has arrived at RIT Chennai.")
  ws.close()
```

---

## 9. Quick Reference — All Stop Coordinates

```
STOP ID   NAME                       LAT         LNG        DWELL
────────  ─────────────────────────  ──────────  ─────────  ──────
AYP       Ayapakkam Bus Stand        13.1044     80.1417    60s
AMB       Ambattur OT                13.1114     80.1554    30s
TMV       Thirumullaivoyal           13.1311     80.1332    30s
AVD       Avadi Bus Stand            13.1143     80.1070    45s
PPT       Paruthipattu               13.1027     80.0883    30s
SNK       Sennerkuppam               13.0645     80.1065    20s
PNM       Poonamallee Bus Stand      13.0473     80.0945    60s ⚠️ delay zone
KTB       Kuthambakkam               13.0245     80.0156    20s
RIT       RIT Chennai — Main Gate    13.0097     80.0040    —  🏁
```
