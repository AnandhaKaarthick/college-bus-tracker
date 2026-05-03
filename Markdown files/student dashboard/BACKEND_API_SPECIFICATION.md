# BACKEND API SPECIFICATION
## Real-Time College Bus Tracking System

**Framework:** FastAPI (Python)  
**Base URL:** `https://api.campustracker.local/v1`  
**Authentication:** JWT Bearer Token  
**Real-Time:** WebSocket (`wss://api.campustracker.local/ws`)

---

## 1. Authentication Endpoints

### `POST /auth/login`
Authenticate a user (student, driver, or admin).

**Request Body:**
```json
{
  "email": "student@college.edu",
  "password": "••••••••",
  "role": "student"
}
```

**Response `200`:**
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "role": "student",
  "user_id": 42
}
```

**Error `401`:**
```json
{ "detail": "Invalid credentials" }
```

---

### `POST /auth/logout`
Invalidate the current session token.

**Headers:** `Authorization: Bearer <token>`

**Response `200`:**
```json
{ "message": "Logged out successfully" }
```

---

## 2. Bus Endpoints

### `GET /buses`
Returns all registered buses and their current status.

**Headers:** `Authorization: Bearer <token>`

**Response `200`:**
```json
[
  {
    "bus_id": 1,
    "route_name": "North Campus",
    "driver_name": "Ramesh Kumar",
    "driver_phone": "+91 98765 43210",
    "status": "on_track",
    "current_lat": 13.0827,
    "current_lng": 80.2707,
    "speed_kmh": 32,
    "last_updated": "2025-04-29T08:34:01Z",
    "occupancy": "medium"
  }
]
```

**Status Values:** `on_track` | `delayed` | `idle` | `offline`

---

### `GET /buses/{bus_id}`
Fetch details for a single bus.

**Response `200`:** Single bus object (same schema as above)

**Error `404`:**
```json
{ "detail": "Bus not found" }
```

---

### `PATCH /buses/{bus_id}/occupancy`
Driver updates the bus occupancy level.

**Roles Allowed:** `driver`

**Request Body:**
```json
{ "occupancy": "full" }
```

**Occupancy Values:** `low` | `medium` | `full`

**Response `200`:**
```json
{ "message": "Occupancy updated", "bus_id": 1, "occupancy": "full" }
```

---

## 3. Route Endpoints

### `GET /routes`
Returns all available routes with stop metadata.

**Response `200`:**
```json
[
  {
    "route_id": 1,
    "route_name": "North Campus",
    "stops": [
      { "stop_id": 1, "name": "Main Gate", "lat": 13.0827, "lng": 80.2707, "order": 1 },
      { "stop_id": 2, "name": "Library", "lat": 13.0831, "lng": 80.2715, "order": 2 }
    ],
    "polyline": [[13.0827, 80.2707], [13.0831, 80.2715]]
  }
]
```

---

### `GET /routes/{route_id}/eta`
Returns ETA for a bus to reach a specific stop.

**Query Params:** `?stop_id=2&bus_id=1`

**Response `200`:**
```json
{
  "bus_id": 1,
  "stop_id": 2,
  "eta_seconds": 240,
  "eta_minutes": 4,
  "distance_km": 1.2
}
```

---

## 4. Location History Endpoints

### `GET /history/{bus_id}`
Returns minute-by-minute location logs for a bus.

**Roles Allowed:** `admin`

**Query Params:**
- `start` — ISO 8601 datetime (required)
- `end` — ISO 8601 datetime (required)

**Example:** `GET /history/1?start=2025-04-29T07:00:00Z&end=2025-04-29T09:00:00Z`

**Response `200`:**
```json
{
  "bus_id": 1,
  "points": [
    { "lat": 13.0827, "lng": 80.2707, "speed_kmh": 0, "timestamp": "2025-04-29T07:00:00Z" },
    { "lat": 13.0830, "lng": 80.2710, "speed_kmh": 25, "timestamp": "2025-04-29T07:01:00Z" }
  ]
}
```

---

### `GET /history/{bus_id}/breadcrumb`
Returns a simplified polyline for map rendering (last N hours).

**Query Params:** `?hours=1`

**Response `200`:**
```json
{
  "bus_id": 1,
  "breadcrumb": [[13.0827, 80.2707], [13.0830, 80.2710]]
}
```

---

## 5. Alert Endpoints

### `POST /alerts/panic`
Driver or student triggers a panic/emergency alert.

**Request Body:**
```json
{
  "bus_id": 1,
  "triggered_by": "driver",
  "lat": 13.0827,
  "lng": 80.2707,
  "message": "Bus breakdown on NH48"
}
```

**Response `201`:**
```json
{ "alert_id": 99, "status": "dispatched", "notified": ["security", "admin"] }
```

---

### `GET /alerts`
Returns active and recent alerts.

**Roles Allowed:** `admin`

**Response `200`:**
```json
[
  {
    "alert_id": 99,
    "bus_id": 1,
    "type": "panic",
    "triggered_by": "driver",
    "lat": 13.0827,
    "lng": 80.2707,
    "message": "Bus breakdown on NH48",
    "status": "active",
    "created_at": "2025-04-29T08:45:00Z"
  }
]
```

---

## 6. WebSocket — Real-Time GPS

### `WS /ws/live`

**Purpose:** Bi-directional channel for live GPS broadcast and student tracking.

**Connection:** `wss://api.campustracker.local/ws/live?token=<jwt>`

---

### Driver → Server (GPS Push)

```json
{
  "type": "gps_update",
  "bus_id": 1,
  "lat": 13.0835,
  "lng": 80.2718,
  "speed_kmh": 28,
  "heading": 45,
  "timestamp": "2025-04-29T08:34:05Z"
}
```

**Frequency:** Every 3–5 seconds

---

### Server → Student (Live Broadcast)

```json
{
  "type": "bus_position",
  "bus_id": 1,
  "lat": 13.0835,
  "lng": 80.2718,
  "speed_kmh": 28,
  "eta_to_stop": {
    "stop_id": 3,
    "eta_seconds": 180
  },
  "timestamp": "2025-04-29T08:34:05Z"
}
```

---

### Server → Student (Geofence Alert)

```json
{
  "type": "geofence_alert",
  "bus_id": 1,
  "stop_id": 3,
  "distance_km": 0.95,
  "eta_seconds": 195,
  "message": "Your bus is less than 1 km away!"
}
```

---

### Server → Admin (Telemetry Push)

```json
{
  "type": "telemetry",
  "bus_id": 1,
  "lat": 13.0835,
  "lng": 80.2718,
  "speed_kmh": 28,
  "stationary_seconds": 0,
  "status": "on_track"
}
```

---

## 7. Error Codes

| Code | Meaning |
|------|---------|
| `400` | Bad Request — missing or invalid fields |
| `401` | Unauthorized — invalid/expired JWT |
| `403` | Forbidden — insufficient role permissions |
| `404` | Resource not found |
| `422` | Validation error — wrong data type |
| `500` | Internal server error |

---

## 8. Rate Limits

| Endpoint Group | Limit |
|---------------|-------|
| Auth endpoints | 10 req/min per IP |
| GPS WebSocket | 1 message / 3 sec per driver |
| History queries | 60 req/min per admin token |
| General REST | 120 req/min per token |
