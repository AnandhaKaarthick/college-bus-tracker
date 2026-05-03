# Schedule Manager & Delay Engine — Backend Spec

---

## Endpoints

### `GET /api/admin/schedules/:routeId`

Returns the master schedule (expected arrival times per stop) for a given route.

**Response:**
```json
[
  {
    "stopId": "stop_main_gate",
    "stopName": "Main Gate",
    "orderIndex": 1,
    "expectedArrival": "08:00"
  },
  {
    "stopId": "stop_t_nagar",
    "stopName": "T. Nagar",
    "orderIndex": 2,
    "expectedArrival": "08:22"
  },
  {
    "stopId": "stop_porur",
    "stopName": "Porur",
    "orderIndex": 3,
    "expectedArrival": "08:45"
  }
]
```

---

### `PUT /api/admin/schedules/:routeId`

Replaces the full schedule for a route (upsert all stop times).

**Request body:**
```json
[
  { "stopId": "stop_main_gate", "expectedArrival": "08:00" },
  { "stopId": "stop_t_nagar",   "expectedArrival": "08:22" },
  { "stopId": "stop_porur",     "expectedArrival": "08:45" }
]
```

**Validation:**
- `stopId` must belong to the specified route
- `expectedArrival` must match `HH:MM` format
- Times must be strictly ascending by `order_index` of each stop

**Response (200):** updated schedule array (same shape as GET response)

**Behavior:** use a transaction — delete all existing entries for `routeId`, then insert new entries.

---

### `GET /api/admin/delays/live`

Returns real-time delay records computed by comparing live bus position logs against the master schedule.

**Response:**
```json
[
  {
    "busId": "bus_01",
    "busNumber": "TN-01-AB-1234",
    "stopId": "stop_t_nagar",
    "stopName": "T. Nagar",
    "scheduledArrival": "2025-06-01T08:22:00Z",
    "actualArrival": "2025-06-01T08:29:00Z",
    "deltaMinutes": 7,
    "tag": "Delayed"
  }
]
```

**Query logic:**

```sql
-- Get latest bus arrival per stop from live logs
-- Compare against master schedule
SELECT
  bl.bus_id,
  b.bus_number,
  bl.stop_id,
  s.name AS stop_name,
  -- Combine today's date with scheduled HH:MM time
  (CURRENT_DATE + rs.expected_arrival::time) AS scheduled_arrival,
  bl.arrived_at AS actual_arrival,
  ROUND(
    EXTRACT(EPOCH FROM (bl.arrived_at - (CURRENT_DATE + rs.expected_arrival::time))) / 60
  ) AS delta_minutes
FROM bus_stop_arrivals bl
JOIN buses b ON bl.bus_id = b.id
JOIN stops s ON bl.stop_id = s.id
JOIN route_schedules rs ON (rs.route_id = b.route_id AND rs.stop_id = bl.stop_id)
WHERE bl.arrived_at >= CURRENT_DATE
ORDER BY delta_minutes DESC;
```

**Tagging:** `tag = 'Delayed'` if `delta_minutes > 5`, else `'On Time'`

**Threshold:** configurable via `DELAY_THRESHOLD_MINUTES=5` environment variable

---

## Auto-Delay Notification (Background Job)

When a bus is tagged `Delayed`, the system must notify affected students.

### Trigger

Run as part of the same job that computes delay records. After writing a delay tag:
1. Look up all students subscribed to that route
2. Send a push notification or in-app notification via the notification service

### Notification Payload

```json
{
  "type": "delay_alert",
  "routeId": "route_01",
  "busId": "bus_01",
  "stopId": "stop_t_nagar",
  "stopName": "T. Nagar",
  "deltaMinutes": 7,
  "message": "Bus TN-01-AB-1234 is delayed by 7 minutes at T. Nagar"
}
```

### Deduplication

Track sent notifications to avoid repeated alerts for the same delay event:

```sql
CREATE TABLE delay_notifications_sent (
  bus_id     TEXT,
  stop_id    TEXT,
  date       DATE,
  sent_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (bus_id, stop_id, date)
);
```

Only send a notification if no row exists for `(bus_id, stop_id, CURRENT_DATE)`.

---

## Database

### `route_schedules` table (new)

```sql
CREATE TABLE route_schedules (
  id              SERIAL PRIMARY KEY,
  route_id        TEXT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  stop_id         TEXT NOT NULL REFERENCES stops(id),
  expected_arrival TIME NOT NULL,   -- e.g., '08:22:00'
  UNIQUE (route_id, stop_id)
);
```

### `bus_stop_arrivals` table (new)

Records when a bus physically arrives at a stop (derived from GPS proximity or manual trigger).

```sql
CREATE TABLE bus_stop_arrivals (
  id          SERIAL PRIMARY KEY,
  bus_id      TEXT NOT NULL REFERENCES buses(id),
  stop_id     TEXT NOT NULL REFERENCES stops(id),
  arrived_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_arrivals_date ON bus_stop_arrivals(bus_id, arrived_at);
```

### Arrival Detection Logic

A background worker polls `bus_location_logs` and writes to `bus_stop_arrivals` when:
- A bus GPS coordinate comes within a configurable radius (e.g., 50 meters) of a stop
- The bus has not already been recorded as arriving at that stop today

```ts
// Pseudo-code for worker
const ARRIVAL_RADIUS_METERS = 50;

for (const bus of activeBuses) {
  for (const stop of bus.routeStops) {
    const distance = haversine(bus.lat, bus.lng, stop.lat, stop.lng);
    if (distance <= ARRIVAL_RADIUS_METERS && !alreadyArrived(bus.id, stop.id)) {
      insertArrival(bus.id, stop.id);
    }
  }
}
```

---

## Environment Variables

```env
DELAY_THRESHOLD_MINUTES=5
MAINTENANCE_ALERT_THRESHOLD_HOURS=48
ARRIVAL_DETECTION_RADIUS_METERS=50
```
