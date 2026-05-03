# BUS_SIMULATOR_SPEC.md
## Dummy Bus Simulator — Real-Time College Bus Tracking System

> **Purpose:** A software-based bus simulator that mimics real GPS hardware, allowing full end-to-end testing of WebSocket pipelines, React map animations, ETA calculations, occupancy badges, admin telemetry, and breadcrumb trails — without needing a physical bus or driver on campus.

---

## 0. Why a Simulator First

| Problem | Simulator Solution |
|---------|-------------------|
| No real buses available during development | Simulator runs 24/7 on any laptop |
| Can't test edge cases (breakdown, full bus) on demand | Simulator triggers them programmatically |
| WebSocket load testing needs many connections | Spin up 10 simultaneous dummy buses in one command |
| GPS jitter and bad coordinates break map | Simulator feeds clean, road-snapped waypoints |
| Breadcrumb trail needs hours of data | Simulator generates a full day's logs in minutes |

---

## 1. Simulator Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│              BUS SIMULATOR PROCESS                   │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │           SimulatorOrchestrator                 │ │
│  │   Spawns N BusAgent instances (threads/async)   │ │
│  └───────────────────┬─────────────────────────────┘ │
│                      │  spawns                        │
│          ┌───────────┼───────────┐                   │
│          ▼           ▼           ▼                   │
│     BusAgent(1)  BusAgent(2)  BusAgent(N)            │
│          │                                           │
│  Each Agent:                                         │
│  • Loads waypoint route                              │
│  • Maintains internal state                          │
│  • Opens WebSocket to FastAPI                        │
│  • Sends GPS packet every 1–3s                       │
│  • Simulates stops, delays, occupancy changes        │
└──────────────────────────────────────────────────────┘
                      │
                      │  WebSocket (wss://)
                      ▼
         ┌────────────────────────┐
         │   FastAPI Backend      │
         │   /ws/live             │
         └────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
   MySQL DB (live +          React Frontend
   logs tables)              (map, ETA, badges)
```

---

## 2. Waypoint Route System

### 2.1 What Are Waypoints

A **waypoint** is a real lat/long coordinate that sits precisely on a road within or around your campus. The simulator moves the bus from waypoint to waypoint in sequence, looping back to the start when the route is complete.

A route is defined as an ordered JSON array of waypoint objects:

```json
{
  "route_id": "ROUTE-04",
  "route_name": "North Campus Loop",
  "loop": true,
  "waypoints": [
    {
      "id": 1,
      "name": "Main Gate",
      "lat": 13.0418,
      "lng": 80.2337,
      "is_stop": true,
      "stop_dwell_seconds": 45,
      "speed_zone_kmh": 0
    },
    {
      "id": 2,
      "name": "Road bend after gate",
      "lat": 13.0423,
      "lng": 80.2341,
      "is_stop": false,
      "speed_zone_kmh": 20
    },
    {
      "id": 3,
      "name": "Admin Block Junction",
      "lat": 13.0431,
      "lng": 80.2350,
      "is_stop": false,
      "speed_zone_kmh": 15
    },
    {
      "id": 4,
      "name": "Library Stop",
      "lat": 13.0445,
      "lng": 80.2362,
      "is_stop": true,
      "stop_dwell_seconds": 30,
      "speed_zone_kmh": 0
    },
    {
      "id": 5,
      "name": "North Hostel",
      "lat": 13.0460,
      "lng": 80.2375,
      "is_stop": true,
      "stop_dwell_seconds": 60,
      "speed_zone_kmh": 0
    }
  ]
}
```

### 2.2 Waypoint Rules

| Field | Type | Description |
|-------|------|-------------|
| `id` | int | Sequential order along the route |
| `name` | string | Human label (for simulator logs) |
| `lat` / `lng` | float | Must be road-snapped coordinates |
| `is_stop` | bool | If true, bus dwells here before moving on |
| `stop_dwell_seconds` | int | How long the bus sits at this stop (30–90s) |
| `speed_zone_kmh` | int | Max speed the bus travels toward this waypoint |

### 2.3 How to Get Road-Snapped Coordinates

Use one of these free methods to get coordinates that lie exactly on roads:

1. **Google Maps / OpenStreetMap:** Right-click on the road center → copy coordinates
2. **OSRM Map Matching API:** Feed rough GPS points → OSRM returns snapped points on the road network
3. **Geojson.io:** Draw a route on the map → export as GeoJSON → extract coordinate array

> ⚠️ **Important:** Do not use building center coordinates as waypoints — the bus icon will appear to cut through buildings on the map.

---

## 3. BusAgent — Core State Machine

Each BusAgent runs through a continuous state machine loop:

```
                    ┌──────────┐
                    │  MOVING  │◄─────────────────────┐
                    └────┬─────┘                      │
                         │                            │
              Reached next waypoint?                  │
                         │                            │
                    ┌────▼─────┐                      │
                    │ is_stop? │                      │
                    └────┬─────┘                      │
              ┌──────────┴──────────┐                 │
             YES                   NO                 │
              │                    │                  │
         ┌────▼──────┐        ┌────▼──────┐          │
         │  DWELLING │        │ Advance   │──────────►│
         │  at stop  │        │ to next   │
         └────┬──────┘        │ waypoint  │
              │               └───────────┘
   Roll random events:
   • Update occupancy
   • Roll for delay/breakdown
              │
   Dwell timer expires
              │
         ┌────▼──────┐
         │  MOVING   │──────────────────────────────►(loop)
         └───────────┘
```

### 3.1 States

| State | Description | Speed |
|-------|-------------|-------|
| `MOVING` | Bus travelling between waypoints | `speed_zone_kmh` ± jitter |
| `DWELLING` | Bus stopped at a designated stop | `0 km/h` |
| `DELAYED` | Bus stopped unexpectedly (random event) | `0 km/h` |
| `BREAKDOWN` | Bus sends panic/breakdown alert | `0 km/h` |
| `CONGESTED` | Bus in slow-traffic zone | `< 10 km/h` |

---

## 4. Variable Speed & Traffic Simulation

### 4.1 Speed Calculation Logic

```
PSEUDOCODE — calculate_speed(current_waypoint, next_waypoint, state):

  base_speed = next_waypoint.speed_zone_kmh

  IF state == DWELLING:
    RETURN 0

  IF state == DELAYED:
    RETURN 0

  IF state == CONGESTED:
    RETURN random_float(3.0, 9.0)    # crawling

  # Apply ±20% random jitter to simulate real bus behavior
  jitter = random_float(-0.20, +0.20)
  speed = base_speed * (1 + jitter)

  # Clamp to realistic campus bus range
  speed = clamp(speed, min=5.0, max=40.0)

  RETURN round(speed, 1)
```

### 4.2 Traffic Zone Configuration

Define zones in the route file where speed is forcibly reduced:

```json
"traffic_zones": [
  {
    "name": "Main Gate Peak Hours",
    "lat_center": 13.0418,
    "lng_center": 80.2337,
    "radius_m": 100,
    "congested_hours": ["08:00-09:30", "17:00-18:30"],
    "speed_kmh": 5
  },
  {
    "name": "Speed Breaker near Library",
    "lat_center": 13.0445,
    "lng_center": 80.2362,
    "radius_m": 50,
    "congested_hours": ["always"],
    "speed_kmh": 8
  }
]
```

### 4.3 Stop Behavior (Dwell Simulation)

```
PSEUDOCODE — handle_stop_arrival(stop, bus_agent):

  bus_agent.state   = DWELLING
  bus_agent.speed   = 0
  bus_agent.status  = "On Track"

  # Broadcast "bus at stop" packet to backend
  send_ws_packet(bus_agent)

  # --- Random Events at Stop ---
  roll = random_float(0, 1)

  IF roll < 0.60:
    update_occupancy(bus_agent)           # 60% chance occupancy changes
  
  IF roll > 0.90:
    trigger_delay(bus_agent)              # 10% chance of random delay
  
  IF roll > 0.97:
    trigger_breakdown(bus_agent)          # 3% chance of breakdown alert

  # Wait for dwell time
  sleep(stop.stop_dwell_seconds + random_int(-10, +10))

  bus_agent.state = MOVING
```

---

## 5. Dynamic Occupancy & Status Changes

### 5.1 Occupancy Update Logic

```
PSEUDOCODE — update_occupancy(bus_agent):

  current = bus_agent.occupancy

  # Simulate passengers boarding/alighting at each stop
  roll = random_float(0, 1)

  IF current == "Low":
    IF roll < 0.50: new_occupancy = "Low"       # stays low
    IF roll < 0.85: new_occupancy = "Medium"    # fills up
    ELSE:           new_occupancy = "Full"       # packed

  IF current == "Medium":
    IF roll < 0.25: new_occupancy = "Low"        # people got off
    IF roll < 0.70: new_occupancy = "Medium"     # stays same
    ELSE:           new_occupancy = "Full"        # fills up

  IF current == "Full":
    IF roll < 0.40: new_occupancy = "Medium"     # people got off
    IF roll < 0.10: new_occupancy = "Low"        # mostly empty now
    ELSE:           new_occupancy = "Full"        # still packed

  bus_agent.occupancy = new_occupancy
  log("Occupancy changed: {} → {}", current, new_occupancy)
```

### 5.2 Delay Trigger

```
PSEUDOCODE — trigger_delay(bus_agent):

  delay_duration = random_int(60, 300)         # 1–5 minutes

  bus_agent.state   = DELAYED
  bus_agent.status  = "Delayed"
  bus_agent.speed   = 0

  # Sends "Delayed" status to admin dashboard ticker
  send_ws_packet(bus_agent)

  log("BUS {} DELAYED for {}s", bus_agent.bus_id, delay_duration)
  sleep(delay_duration)

  bus_agent.state   = MOVING
  bus_agent.status  = "On Track"
```

### 5.3 Breakdown Trigger

```
PSEUDOCODE — trigger_breakdown(bus_agent):

  bus_agent.state   = BREAKDOWN
  bus_agent.status  = "Breakdown"
  bus_agent.speed   = 0

  # POST to /alerts/panic — management gets emergency notification
  send_alert_to_backend(
    bus_id     = bus_agent.bus_id,
    type       = "breakdown",
    lat        = bus_agent.lat,
    lng        = bus_agent.lng,
    message    = "Simulated breakdown — testing alert pipeline"
  )

  send_ws_packet(bus_agent)

  # Simulate repair time
  repair_time = random_int(120, 600)      # 2–10 minutes
  log("BUS {} BREAKDOWN — repair in {}s", bus_agent.bus_id, repair_time)
  sleep(repair_time)

  bus_agent.state   = MOVING
  bus_agent.status  = "On Track"
```

---

## 6. Heading / Direction Calculation

The bus icon on the Leaflet map must **rotate to face its direction of travel.** The simulator calculates this using the bearing formula between two coordinates.

```
PSEUDOCODE — calculate_heading(lat1, lng1, lat2, lng2):

  # Convert degrees to radians
  φ1 = to_radians(lat1)
  φ2 = to_radians(lat2)
  Δλ = to_radians(lng2 - lng1)

  x = sin(Δλ) * cos(φ2)
  y = cos(φ1) * sin(φ2) - sin(φ1) * cos(φ2) * cos(Δλ)

  bearing_rad = atan2(x, y)
  bearing_deg = to_degrees(bearing_rad)

  # Normalize to 0–360°
  heading = (bearing_deg + 360) % 360

  RETURN round(heading, 1)
```

**Example outputs:**

| Direction | Heading |
|-----------|---------|
| Due North | 0° |
| Due East | 90° |
| Due South | 180° |
| Due West | 270° |

---

## 7. WebSocket Packet — Full JSON Structure

Every 1–3 seconds, each BusAgent sends this packet to the FastAPI `/ws/live` endpoint:

```json
{
  "type":      "gps_update",
  "bus_id":    "BUS-04",
  "lat":       13.0418,
  "lng":       80.2337,
  "speed":     22.5,
  "heading":   180,
  "occupancy": "Medium",
  "status":    "On Track",
  "timestamp": "2026-05-01T15:54:00Z"
}
```

### 7.1 Field Reference

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `type` | string | `"gps_update"` | Identifies this as a GPS packet |
| `bus_id` | string | `"BUS-04"` | Unique simulator bus identifier |
| `lat` | float | `13.0418` | Current latitude (7 decimal places) |
| `lng` | float | `80.2337` | Current longitude (7 decimal places) |
| `speed` | float | `22.5` | Speed in km/h (0 when stopped) |
| `heading` | float | `180` | Direction in degrees (0–360) |
| `occupancy` | string | `"Medium"` | `"Low"` / `"Medium"` / `"Full"` |
| `status` | string | `"On Track"` | `"On Track"` / `"Delayed"` / `"Breakdown"` |
| `timestamp` | string | ISO 8601 UTC | Packet generation time |

### 7.2 Status-Change Packet

When state changes to Delayed or Breakdown, send an extended packet:

```json
{
  "type":      "status_change",
  "bus_id":    "BUS-04",
  "lat":       13.0445,
  "lng":       80.2362,
  "speed":     0,
  "heading":   90,
  "occupancy": "Full",
  "status":    "Delayed",
  "reason":    "Unexpected stop — simulated traffic",
  "eta_delay_seconds": 180,
  "timestamp": "2026-05-01T15:59:30Z"
}
```

---

## 8. Coordinate Interpolation (Smooth Movement)

Rather than jumping the bus from waypoint A to waypoint B in one step, the simulator **interpolates intermediate positions** to generate smooth movement at the configured update frequency.

```
PSEUDOCODE — interpolate_positions(wp_from, wp_to, speed_kmh, interval_seconds):

  # Calculate total distance between waypoints (Haversine formula)
  distance_km = haversine(wp_from.lat, wp_from.lng, wp_to.lat, wp_to.lng)

  # Time to travel this segment at current speed
  travel_time_seconds = (distance_km / speed_kmh) * 3600

  # Number of packets to emit during this segment
  num_steps = ceil(travel_time_seconds / interval_seconds)

  FOR step IN range(0, num_steps):
    fraction = step / num_steps

    # Linear interpolation
    interp_lat = wp_from.lat + fraction * (wp_to.lat - wp_from.lat)
    interp_lng = wp_from.lng + fraction * (wp_to.lng - wp_from.lng)
    interp_heading = calculate_heading(wp_from.lat, wp_from.lng,
                                        wp_to.lat,   wp_to.lng)

    packet = build_gps_packet(interp_lat, interp_lng, speed_kmh, interp_heading)
    send_ws_packet(packet)

    sleep(interval_seconds)
```

---

## 9. Stress Testing — Multiple Simultaneous Buses

### 9.1 Orchestrator Configuration

```json
{
  "simulation_config": {
    "total_buses": 10,
    "update_interval_seconds": 2,
    "routes": [
      { "bus_id": "BUS-01", "route_file": "route_north.json",  "start_waypoint": 0 },
      { "bus_id": "BUS-02", "route_file": "route_south.json",  "start_waypoint": 2 },
      { "bus_id": "BUS-03", "route_file": "route_east.json",   "start_waypoint": 1 },
      { "bus_id": "BUS-04", "route_file": "route_north.json",  "start_waypoint": 4 },
      { "bus_id": "BUS-05", "route_file": "route_west.json",   "start_waypoint": 0 },
      { "bus_id": "BUS-06", "route_file": "route_south.json",  "start_waypoint": 3 },
      { "bus_id": "BUS-07", "route_file": "route_east.json",   "start_waypoint": 0 },
      { "bus_id": "BUS-08", "route_file": "route_north.json",  "start_waypoint": 1 },
      { "bus_id": "BUS-09", "route_file": "route_west.json",   "start_waypoint": 2 },
      { "bus_id": "BUS-10", "route_file": "route_south.json",  "start_waypoint": 0 }
    ]
  }
}
```

> **Note:** `start_waypoint` is staggered so buses don't all begin at the same coordinate — this prevents all 10 markers from stacking on top of each other at launch.

### 9.2 Concurrency Model

```
PSEUDOCODE — SimulatorOrchestrator.run():

  agents = []

  FOR each bus_config IN simulation_config.routes:
    route = load_route(bus_config.route_file)
    agent = BusAgent(
      bus_id         = bus_config.bus_id,
      route          = route,
      start_waypoint = bus_config.start_waypoint,
      ws_url         = "wss://api.campustracker.local/ws/live",
      auth_token     = DRIVER_JWT_TOKEN
    )
    agents.append(agent)

  # Launch all agents concurrently (asyncio or threading)
  run_concurrently(agents)
```

### 9.3 What to Observe During Stress Test

| Test | What to Watch | Pass Condition |
|------|--------------|----------------|
| **WebSocket load** | FastAPI server CPU & memory | No crash or spike > 80% CPU with 10 buses |
| **Packet latency** | Time from simulator send → React map update | < 500ms end-to-end |
| **DB write rate** | MySQL write throughput | 10 buses × 1 packet/2s = 5 inserts/sec to live table |
| **Marker clustering** | Leaflet map with 10 buses near one stop | Markers don't overlap unreadably |
| **ETA accuracy** | Student ETA vs actual simulator arrival | Within ±15 seconds |
| **Geofence trigger** | Geofence alert fires correctly | Alert triggers when bus crosses 1km radius |

---

## 10. Logging & Observability

### 10.1 Simulator Console Log Format

Every packet sent should print a structured log line:

```
[2026-05-01 15:54:02] BUS-04 | MOVING    | lat=13.0418 lng=80.2337 | spd=22.5 kmh | hdg=180° | occ=Medium | status=On Track
[2026-05-01 15:54:04] BUS-04 | MOVING    | lat=13.0421 lng=80.2340 | spd=21.8 kmh | hdg=182° | occ=Medium | status=On Track
[2026-05-01 15:54:46] BUS-04 | DWELLING  | stop=Library | dwell=45s  | occ=Full    | status=On Track
[2026-05-01 15:55:31] BUS-04 | DELAYED   | reason=Random event     | delay=120s   | status=Delayed
[2026-05-01 15:57:31] BUS-04 | MOVING    | lat=13.0448 lng=80.2365 | spd=18.0 kmh | hdg=45°  | occ=Full    | status=On Track
```

### 10.2 Simulator Summary Report (on exit)

When the simulation is stopped (`Ctrl+C`), print a summary:

```
═══════════════════════════════════════════════
  BUS SIMULATOR SESSION REPORT
  Duration: 00:45:12
═══════════════════════════════════════════════
  Bus      Packets Sent  Stops Hit  Delays  Breakdowns  Laps
  ───────  ────────────  ─────────  ──────  ──────────  ────
  BUS-01       1,356         12        2         0        3
  BUS-02       1,298         11        1         1        2
  BUS-03       1,401         13        3         0        3
  ...
  TOTAL       13,214        117       18         3       28
═══════════════════════════════════════════════
  WS Errors: 0 | Reconnections: 2 | Avg Latency: 87ms
═══════════════════════════════════════════════
```

---

## 11. Implementation Specification

### 11.1 Recommended Language & Libraries

**Option A — Python (Recommended)**

| Library | Purpose |
|---------|---------|
| `asyncio` | Concurrent bus agents (async tasks) |
| `websockets` | Async WebSocket client |
| `httpx` | HTTP client for alert POSTs |
| `geopy` | Haversine distance calculations |
| `math` | Bearing/heading calculation |
| `json` | Packet serialization |
| `rich` | Formatted console output / live table |

**Option B — Node.js (Alternative)**

| Library | Purpose |
|---------|---------|
| `ws` | WebSocket client |
| `axios` | HTTP requests for alerts |
| `geolib` | Distance and bearing calculations |
| `chalk` | Colored console output |

### 11.2 File Structure

```
bus_simulator/
│
├── main.py                    # Entry point — SimulatorOrchestrator
├── config.json                # Simulation config (buses, intervals)
│
├── agents/
│   └── bus_agent.py           # BusAgent class (state machine)
│
├── routes/
│   ├── route_north.json       # Waypoint arrays per route
│   ├── route_south.json
│   ├── route_east.json
│   └── route_west.json
│
├── utils/
│   ├── geo.py                 # Haversine, bearing, interpolation
│   ├── packets.py             # JSON packet builders
│   └── logger.py              # Structured console logging
│
└── README.md                  # How to run the simulator
```

### 11.3 How to Run

```bash
# Install dependencies
pip install websockets httpx geopy rich

# Run with default config (10 buses)
python main.py --config config.json

# Run single bus for quick testing
python main.py --bus BUS-04 --route routes/route_north.json

# Run with faster updates for stress testing
python main.py --config config.json --interval 1

# Run with breakdown events more frequent (for testing)
python main.py --config config.json --breakdown-chance 0.2
```

### 11.4 CLI Arguments

| Argument | Default | Description |
|----------|---------|-------------|
| `--config` | `config.json` | Path to simulation config file |
| `--bus` | — | Run only this single bus ID |
| `--route` | — | Route file for single-bus mode |
| `--interval` | `2` | Seconds between GPS packets |
| `--breakdown-chance` | `0.03` | Float 0–1 probability of breakdown per stop |
| `--delay-chance` | `0.10` | Float 0–1 probability of delay per stop |
| `--ws-url` | config value | Override WebSocket server URL |
| `--token` | config value | JWT auth token for driver role |
| `--verbose` | false | Print every packet to console |

---

## 12. Test Scenarios Checklist

Use the simulator to verify each feature before going live:

### Map & Animation Tests
- [ ] Bus marker appears on map when simulator starts
- [ ] Marker glides smoothly (no teleporting) between updates
- [ ] Bus icon rotates to match heading direction
- [ ] Route polyline matches simulator waypoints
- [ ] Completed stop pins turn grey as bus passes them
- [ ] Dynamic auto-zoom keeps bus and student stop in frame

### ETA & Prediction Tests
- [ ] ETA counts down in real time as bus approaches
- [ ] ETA adjusts dynamically when delay event triggers
- [ ] ETA turns amber when < 5 minutes
- [ ] ETA turns red and flashes when < 2 minutes
- [ ] ETA resets correctly when bus loops back to route start

### Occupancy Tests
- [ ] Occupancy badge updates after each stop dwell
- [ ] Bus marker color changes with occupancy level
- [ ] Student bottom sheet reflects latest occupancy in real time

### Alerts & Notifications Tests
- [ ] Delay status triggers admin ticker message
- [ ] Breakdown alert appears as red banner in admin dashboard
- [ ] Breakdown GPS pin appears correctly on admin map
- [ ] Geofence push notification fires when bus crosses 1km radius
- [ ] Panic alert POST reaches `/alerts/panic` successfully

### Admin Dashboard Tests
- [ ] All 10 buses visible simultaneously in sidebar
- [ ] Telemetry panel updates speed and heading in real time
- [ ] Breadcrumb trail renders after simulator runs for > 5 minutes
- [ ] Historical playback works for the simulator's logged data
- [ ] Idle detection flags bus correctly when dwell > 5 minutes

### Stress Tests
- [ ] 10 simultaneous WebSocket connections without server crash
- [ ] MySQL write rate sustainable at 5–10 inserts/sec
- [ ] React map remains responsive with 10 animated markers
- [ ] No memory leak in FastAPI after 30+ minutes of simulation
- [ ] WebSocket auto-reconnects if simulator briefly disconnects
