# Active Routes Live Monitor — Backend Spec

---

## Endpoints

### `GET /api/routes`

Returns all configured routes with their associated stop IDs and bus IDs.

**Response:**
```json
[
  {
    "id": "route_01",
    "name": "Main Gate → Porur",
    "startStop": "stop_main_gate",
    "endStop": "stop_porur",
    "stopIds": ["stop_main_gate", "stop_t_nagar", "stop_porur"],
    "busIds": ["bus_01", "bus_02"]
  }
]
```

**Notes:**
- Only return routes that have at least one associated bus
- Filter out inactive routes at query level

---

### `GET /api/buses/:busId/telemetry`

Returns live telemetry and driver profile for a specific bus.

**Response:**
```json
{
  "busId": "bus_01",
  "speed": 42,
  "occupancy": 28,
  "capacity": 40,
  "status": "Active",
  "lastStop": "stop_t_nagar",
  "currentRoute": "route_01",
  "driver": {
    "id": "drv_01",
    "name": "Ramesh Kumar",
    "contact": "+91-9876543210",
    "licenseNumber": "TN-1234567890"
  }
}
```

**Notes:**
- Combines data from `bus_location_logs` (latest entry) and `drivers` table
- Cache with short TTL (5–10 seconds) to reduce DB reads during frequent modal opens

---

## WebSocket: `/ws/buses`

### Existing Behavior (extend, do not break)

Currently broadcasts all active bus positions. This endpoint must be modified to:

1. **Filter by status:** Only emit buses where `status = 'Active'`  
2. **Include `routeId`** in each emitted bus object (if not already present)

**Emitted message shape:**
```json
{
  "type": "bus_positions",
  "payload": [
    {
      "id": "bus_01",
      "routeId": "route_01",
      "lat": 13.0827,
      "lng": 80.2707,
      "speed": 42,
      "occupancy": 28,
      "capacity": 40,
      "status": "Active"
    }
  ]
}
```

**Frequency:** every 5 seconds (match existing broadcast interval)

---

## Database

### `routes` table (new)

```sql
CREATE TABLE routes (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  start_stop  TEXT NOT NULL REFERENCES stops(id),
  end_stop    TEXT NOT NULL REFERENCES stops(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

### `route_stops` junction table (new)

```sql
CREATE TABLE route_stops (
  route_id   TEXT REFERENCES routes(id),
  stop_id    TEXT REFERENCES stops(id),
  order_index INTEGER NOT NULL,
  PRIMARY KEY (route_id, stop_id)
);
```

### `route_buses` junction table (new)

```sql
CREATE TABLE route_buses (
  route_id  TEXT REFERENCES routes(id),
  bus_id    TEXT REFERENCES buses(id),
  PRIMARY KEY (route_id, bus_id)
);
```

### `buses` table modification

Add column if not present:

```sql
ALTER TABLE buses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active'
  CHECK (status IN ('Active', 'In Depot', 'Maintenance'));
```

---

## Business Logic

### Route Bus Density

Computed at query time; not stored. For each route, count buses where:
- `bus.routeId = route.id`
- `bus.status = 'Active'`

This is returned in the `GET /api/routes` response as a derived field.

---

## Caching Strategy

| Endpoint | Cache TTL | Invalidation |
|---|---|---|
| `GET /api/routes` | 30 seconds | On route creation/update |
| `GET /api/buses/:id/telemetry` | 5 seconds | Rolling (TTL only) |
| `/ws/buses` broadcast | N/A — push | On each DB poll cycle |
