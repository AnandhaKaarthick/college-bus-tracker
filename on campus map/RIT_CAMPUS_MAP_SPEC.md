# RIT_CAMPUS_MAP_SPEC.md
## On-Campus Route & Map Specification
### Rajalakshmi Institute of Technology — Internal Bus Drop-off System

> **Purpose:** Defines the complete on-campus road network, internal drop-off stops, campus boundary geofence, and all coordinate waypoints extracted from the satellite and road-map view of RIT Chennai. Used by the bus simulator for the final leg of the Ayapakkam → RIT route, and by the Leaflet map for rendering an enhanced campus overlay.

---

## 0. Campus Identity

| Field | Value |
|-------|-------|
| **Campus Name** | Rajalakshmi Institute of Technology (RIT) |
| **Landmark** | RIT Steve Jobs Block |
| **Main Gate Coordinates** | `13.0097, 80.0040` |
| **Campus Centroid** | `13.0130, 80.0038` |
| **Campus Orientation** | NNW–SSE elongated polygon |
| **Estimated Campus Area** | ~16 hectares |
| **Internal Road Type** | Paved perimeter loop + internal spurs to blocks |
| **Max On-Campus Speed** | 15 km/h |
| **Map Zoom (campus view)** | 17 (street level detail) |

---

## 1. Campus Boundary — Geofence Polygon

The yellow boundary visible in the satellite image. Used to:
- Trigger "Entered Campus" status on the bus tracker
- Switch the map to campus-detail zoom level (17)
- Switch from OSRM road routing to internal waypoint routing

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[
      [80.0024, 13.0158],
      [80.0028, 13.0165],
      [80.0033, 13.0168],
      [80.0040, 13.0167],
      [80.0048, 13.0162],
      [80.0053, 13.0155],
      [80.0056, 13.0145],
      [80.0058, 13.0132],
      [80.0057, 13.0118],
      [80.0055, 13.0105],
      [80.0051, 13.0096],
      [80.0046, 13.0088],
      [80.0042, 13.0082],
      [80.0040, 13.0078],
      [80.0038, 13.0078],
      [80.0036, 13.0080],
      [80.0033, 13.0082],
      [80.0031, 13.0085],
      [80.0028, 13.0090],
      [80.0025, 13.0100],
      [80.0023, 13.0112],
      [80.0022, 13.0125],
      [80.0022, 13.0138],
      [80.0024, 13.0150],
      [80.0024, 13.0158]
    ]]
  },
  "properties": {
    "name": "RIT Campus Boundary",
    "type": "geofence",
    "campus_id": "RIT"
  }
}
```

**Geofence trigger logic:**
```
PSEUDOCODE — check_campus_entry(bus_lat, bus_lng):

  IF point_in_polygon(bus_lat, bus_lng, RIT_BOUNDARY):
    IF bus_state.zone != "on_campus":
      bus_state.zone      = "on_campus"
      bus_state.status    = "On Campus"
      bus_state.speed_cap = 15
      emit_ws({ type: "campus_entry", bus_id, campus: "RIT" })
      zoom_map_to(17, campus_centroid)
```

---

## 2. Campus Internal Route — Perimeter Loop

The yellow route traced in both satellite and road-map views forms a **one-way anti-clockwise loop** around the campus perimeter, with spur roads going into the building clusters.

### 2.1 Perimeter Loop Waypoints (ordered, anti-clockwise)

Starting from Main Gate and completing the full loop:

```json
{
  "route_id": "RIT-CAMPUS-LOOP",
  "route_name": "RIT Internal Campus Loop",
  "type": "campus_internal",
  "direction": "anti-clockwise",
  "loop": true,
  "max_speed_kmh": 15,
  "waypoints": [

    {
      "id": 1,
      "name": "Main Gate — Entry",
      "lat": 13.0097,
      "lng": 80.0040,
      "is_stop": true,
      "stop_type": "entry_gate",
      "dwell_seconds": 20,
      "description": "Primary campus entry/exit — external route terminus"
    },

    {
      "id": 2,
      "name": "Gate Security Post",
      "lat": 13.0099,
      "lng": 80.0038,
      "is_stop": false,
      "description": "Left turn just inside gate — begin west perimeter"
    },

    {
      "id": 3,
      "name": "South-West Corner",
      "lat": 13.0100,
      "lng": 80.0027,
      "is_stop": false,
      "description": "Corner turn — road curves north along west boundary"
    },

    {
      "id": 4,
      "name": "Admin Block Drop-off",
      "lat": 13.0108,
      "lng": 80.0024,
      "is_stop": true,
      "stop_type": "building_drop",
      "dwell_seconds": 30,
      "building": "Administrative Block",
      "description": "Primary admin and reception drop-off"
    },

    {
      "id": 5,
      "name": "West Road — Mid Point",
      "lat": 13.0118,
      "lng": 80.0023,
      "is_stop": false,
      "description": "Continuing north along west perimeter"
    },

    {
      "id": 6,
      "name": "Rajalakshmi Main Block Stop",
      "lat": 13.0127,
      "lng": 80.0024,
      "is_stop": true,
      "stop_type": "building_drop",
      "dwell_seconds": 45,
      "building": "Rajalakshmi Institute of Technology — Main Block",
      "description": "Central drop-off — highest passenger density"
    },

    {
      "id": 7,
      "name": "West Perimeter — Upper",
      "lat": 13.0136,
      "lng": 80.0025,
      "is_stop": false,
      "description": "Road bends slightly right following boundary"
    },

    {
      "id": 8,
      "name": "North-West Bend",
      "lat": 13.0148,
      "lng": 80.0027,
      "is_stop": false,
      "description": "Corner turn — transitioning to north perimeter road"
    },

    {
      "id": 9,
      "name": "North Road — West Section",
      "lat": 13.0158,
      "lng": 80.0030,
      "is_stop": false,
      "description": "North boundary road heading east"
    },

    {
      "id": 10,
      "name": "North Gate / Staff Entry",
      "lat": 13.0165,
      "lng": 80.0036,
      "is_stop": true,
      "stop_type": "staff_gate",
      "dwell_seconds": 20,
      "description": "Staff vehicle entry point — north end of campus"
    },

    {
      "id": 11,
      "name": "North Road — East Section",
      "lat": 13.0164,
      "lng": 80.0043,
      "is_stop": false,
      "description": "North boundary continuing east"
    },

    {
      "id": 12,
      "name": "Steve Jobs Block — North Drop",
      "lat": 13.0160,
      "lng": 80.0049,
      "is_stop": true,
      "stop_type": "building_drop",
      "dwell_seconds": 45,
      "building": "RIT Steve Jobs Block",
      "description": "Engineering/IT block drop-off — north-east quadrant"
    },

    {
      "id": 13,
      "name": "North-East Corner",
      "lat": 13.0155,
      "lng": 80.0054,
      "is_stop": false,
      "description": "Corner turn — begin east perimeter going south"
    },

    {
      "id": 14,
      "name": "East Perimeter — Upper",
      "lat": 13.0143,
      "lng": 80.0057,
      "is_stop": false,
      "description": "East boundary road heading south"
    },

    {
      "id": 15,
      "name": "Steve Jobs Block — East Drop",
      "lat": 13.0135,
      "lng": 80.0058,
      "is_stop": true,
      "stop_type": "building_drop",
      "dwell_seconds": 30,
      "building": "RIT Steve Jobs Block — East Entrance",
      "description": "Alternative east-side drop for Steve Jobs Block"
    },

    {
      "id": 16,
      "name": "East Perimeter — Mid",
      "lat": 13.0124,
      "lng": 80.0057,
      "is_stop": false,
      "description": "Continuing south along east boundary"
    },

    {
      "id": 17,
      "name": "Central Block — East Drop",
      "lat": 13.0115,
      "lng": 80.0055,
      "is_stop": true,
      "stop_type": "building_drop",
      "dwell_seconds": 35,
      "building": "Central Academic Block",
      "description": "East-facing drop for central teaching blocks"
    },

    {
      "id": 18,
      "name": "East Perimeter — Lower",
      "lat": 13.0106,
      "lng": 80.0052,
      "is_stop": false,
      "description": "Approaching south-east corner"
    },

    {
      "id": 19,
      "name": "South-East Corner",
      "lat": 13.0098,
      "lng": 80.0047,
      "is_stop": false,
      "description": "Corner turn — transition to south road back to gate"
    },

    {
      "id": 20,
      "name": "South Road — Junction",
      "lat": 13.0094,
      "lng": 80.0043,
      "is_stop": false,
      "description": "South perimeter road heading west to main gate"
    },

    {
      "id": 1,
      "name": "Main Gate — Exit",
      "lat": 13.0097,
      "lng": 80.0040,
      "is_stop": true,
      "stop_type": "entry_gate",
      "dwell_seconds": 0,
      "description": "Loop complete — bus exits campus back to public road"
    }
  ]
}
```

---

## 3. Internal Spur Roads (to Building Clusters)

Spur roads branch off the perimeter loop to reach building entrances directly. The bus takes these when a particular block is the final destination.

### 3.1 Spur — Main Block Courtyard

```json
{
  "spur_id": "SPUR-MAIN-COURT",
  "branch_from_waypoint": 6,
  "name": "Main Block Inner Courtyard",
  "waypoints": [
    { "id": "MC-1", "lat": 13.0127, "lng": 80.0030, "name": "Courtyard Entry" },
    { "id": "MC-2", "lat": 13.0130, "lng": 80.0034, "name": "Main Block Front Porch" },
    { "id": "MC-3", "lat": 13.0133, "lng": 80.0037, "name": "Canteen Drop" }
  ],
  "return_to_waypoint": 7
}
```

### 3.2 Spur — Steve Jobs Block Internal

```json
{
  "spur_id": "SPUR-SJB",
  "branch_from_waypoint": 12,
  "name": "Steve Jobs Block Internal Drive",
  "waypoints": [
    { "id": "SJB-1", "lat": 13.0155, "lng": 80.0047, "name": "SJB Main Entrance" },
    { "id": "SJB-2", "lat": 13.0150, "lng": 80.0048, "name": "SJB Lab Wing" }
  ],
  "return_to_waypoint": 13
}
```

### 3.3 Spur — South Entry Road (from Main Gate inward)

```json
{
  "spur_id": "SPUR-SOUTH-ENTRY",
  "branch_from_waypoint": 1,
  "name": "South Entry Road — Internal",
  "waypoints": [
    { "id": "SE-1", "lat": 13.0097, "lng": 80.0040, "name": "Main Gate" },
    { "id": "SE-2", "lat": 13.0100, "lng": 80.0040, "name": "Guard Post Road" },
    { "id": "SE-3", "lat": 13.0103, "lng": 80.0039, "name": "South Entry Straight" },
    { "id": "SE-4", "lat": 13.0107, "lng": 80.0038, "name": "South T-Junction" }
  ],
  "return_to_waypoint": 4
}
```

---

## 4. Key Campus Stops — Master Table

| Stop ID | Name | Lat | Lng | Type | Dwell |
|---------|------|-----|-----|------|-------|
| `RIT-GATE` | Main Gate | 13.0097 | 80.0040 | Entry Gate | 20s |
| `RIT-ADMIN` | Admin Block Drop-off | 13.0108 | 80.0024 | Building Drop | 30s |
| `RIT-MAIN` | Rajalakshmi Main Block | 13.0127 | 80.0024 | Building Drop | 45s |
| `RIT-NGATE` | North Gate / Staff Entry | 13.0165 | 80.0036 | Staff Gate | 20s |
| `RIT-SJB-N` | Steve Jobs Block — North | 13.0160 | 80.0049 | Building Drop | 45s |
| `RIT-SJB-E` | Steve Jobs Block — East | 13.0135 | 80.0058 | Building Drop | 30s |
| `RIT-CENT` | Central Academic Block | 13.0115 | 80.0055 | Building Drop | 35s |

---

## 5. Campus Buildings Reference Map

Key landmarks visible in the satellite image:

```
CAMPUS MAP (schematic — not to scale)

         NORTH
           ↑
  ┌────────────────────────┐
  │   ●  North Gate         │
  │                        │
  │  [STEVE JOBS BLOCK]    │  ← NE quadrant
  │   ●  SJB North Drop    │
  │   ●  SJB East Drop     │
  │                        │
  │  [CENTRAL ACADEMIC]    │  ← Middle east
  │   ●  Central East Drop │
  │                        │
  │  [MAIN BLOCK / RIT]    │  ← Centre west
  │   ●  Main Block Stop   │
  │                        │
  │  [ADMIN BLOCK]         │  ← SW
  │   ●  Admin Drop        │
  │                        │
  │   ●  MAIN GATE         │  ← South entry
  └────────────────────────┘
         SOUTH
```

---

## 6. Campus Entry Event — Simulator Behavior

When the dummy bus simulator crosses the campus geofence boundary:

```
PSEUDOCODE — on_campus_entry(bus_agent):

  # Switch routing mode
  bus_agent.routing_mode  = "campus_internal"
  bus_agent.speed_cap     = 15        # km/h max on campus
  bus_agent.route         = CAMPUS_LOOP_WAYPOINTS

  # Update status
  bus_agent.status        = "On Campus"
  bus_agent.occupancy     = "Low"    # students have alighted at RIT gate

  # Broadcast campus arrival to all tracking students
  ws.send({
    "type":      "campus_entry",
    "bus_id":    bus_agent.bus_id,
    "campus":    "RIT",
    "message":   "Bus 04 has entered RIT campus",
    "timestamp": utc_now()
  })

  # Student dashboard: switch to campus zoom
  ws.send({
    "type":      "map_zoom_hint",
    "zoom":      17,
    "center_lat": 13.0130,
    "center_lng": 80.0038,
    "overlay":   "campus_detail"
  })

  # Start campus loop
  simulate_campus_loop(bus_agent, CAMPUS_LOOP_WAYPOINTS)
```

---

## 7. Campus Simulator Packet — On-Campus Format

When on campus, the GPS packet adds a `campus_zone` field:

```json
{
  "type":         "gps_update",
  "bus_id":       "BUS-04",
  "lat":          13.0127,
  "lng":          80.0024,
  "speed":        12.5,
  "heading":      5,
  "occupancy":    "Low",
  "status":       "On Campus",
  "campus_zone":  "RIT",
  "next_campus_stop": {
    "stop_id":   "RIT-SJB-N",
    "name":      "Steve Jobs Block — North",
    "eta_seconds": 85
  },
  "timestamp":    "2026-05-01T08:26:15Z"
}
```

---

## 8. Campus Speed Zone Map

Different sections of the campus perimeter enforce different speed limits:

| Zone | Waypoints | Max Speed | Reason |
|------|-----------|-----------|--------|
| Gate approach | 1 → 2 | 5 km/h | Pedestrian crossing |
| South-West loop | 3 → 5 | 15 km/h | Open road |
| Main Block area | 5 → 7 | 8 km/h | Student density |
| North perimeter | 8 → 11 | 15 km/h | Open perimeter road |
| Steve Jobs Block | 12 → 13 | 8 km/h | Building approach |
| East perimeter | 14 → 18 | 15 km/h | Open road |
| South return | 19 → 20 | 10 km/h | Approaching gate |

---

## 9. Campus Geofence Alert Logic

When a student is **inside the campus** (walking from hostel to block), the stop-tap modal changes:

```
PSEUDOCODE — campus_eta_modal(student, tapped_stop):

  # Student is already on campus — walking only (no bus transit)
  student_distance_m = haversine_meters(student.lat, student.lng,
                                         tapped_stop.lat,  tapped_stop.lng)

  walk_minutes = student_distance_m / 83    # 83 m/min walking speed

  bus_eta = get_campus_bus_eta(tapped_stop.stop_id)

  RETURN {
    "mode":           "campus_walking",
    "walk_eta_min":   ceil(walk_minutes),
    "walk_distance_m": student_distance_m,
    "bus_eta_min":    bus_eta,
    "recommendation": "Bus arrives in X min. Walk takes Y min."
  }
```
