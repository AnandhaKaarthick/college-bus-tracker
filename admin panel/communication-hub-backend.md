# Communication Hub — Backend Spec

---

## REST Endpoints

### `POST /api/admin/announcements`

Creates and broadcasts a new announcement.

**Request body:**
```json
{
  "title": "Route delay alert",
  "message": "Tambaram route will be delayed by 20 minutes today.",
  "targetType": "route-specific",
  "routeId": "route_02"
}
```

**Validation:**
- `title`: required, max 100 chars
- `message`: required, max 500 chars
- `targetType`: must be `"global"` or `"route-specific"`
- `routeId`: required when `targetType = "route-specific"`; must be a valid route ID

**Response (201):**
```json
{
  "id": "ann_001",
  "title": "Route delay alert",
  "message": "Tambaram route will be delayed by 20 minutes today.",
  "targetType": "route-specific",
  "routeId": "route_02",
  "recipientCount": 143,
  "createdAt": "2025-06-01T14:30:00Z"
}
```

**Side effects:**
1. Insert into `announcements` table
2. Determine recipient list:
   - `global`: all student user IDs
   - `route-specific`: student IDs subscribed to `routeId`
3. Push to `Header.tsx` notification channel via `/ws/notifications`
4. Optionally trigger push notifications (if push service integrated)

---

### `GET /api/admin/announcements`

Returns paginated list of past announcements (newest first).

**Query params:** `page`, `limit` (default 20)

**Response:**
```json
{
  "data": [
    {
      "id": "ann_001",
      "title": "Route delay alert",
      "targetType": "route-specific",
      "routeId": "route_02",
      "recipientCount": 143,
      "createdAt": "2025-06-01T14:30:00Z"
    }
  ],
  "total": 87,
  "page": 1
}
```

---

## WebSocket: `/ws/admin`

Admin-facing WebSocket for receiving SOS alerts and system events.

### Message: `panic` (server → client)

Emitted when a driver triggers SOS from the `DriverApp` or `SafetyPage`.

```json
{
  "type": "panic",
  "payload": {
    "busId": "bus_01",
    "busNumber": "TN-01-AB-1234",
    "driverId": "drv_01",
    "driverName": "Ramesh Kumar",
    "driverPhone": "+91-9876543210",
    "routeName": "Main Gate → Porur",
    "lat": 13.0827,
    "lng": 80.2707,
    "nearestStop": "T. Nagar",
    "triggeredAt": "2025-06-01T14:32:07Z"
  }
}
```

**Server behavior on SOS trigger:**
1. Receive `panic` event from `DriverApp` WebSocket connection
2. Persist to `sos_events` table
3. Broadcast `panic` message to all connected admin clients on `/ws/admin`

---

## WebSocket: `/ws/admin/dispatch`

Bidirectional message channel between admins and drivers.

### Client → Server Messages

**Join a driver's thread:**
```json
{ "type": "join_thread", "driverId": "drv_01" }
```
Server responds with message history for this driver (last 50 messages).

**Send a dispatch message:**
```json
{ "type": "dispatch_message", "driverId": "drv_01", "text": "Pull over at the next stop." }
```

### Server → Client Messages

**Message history (on join):**
```json
{
  "type": "thread_history",
  "driverId": "drv_01",
  "messages": [
    {
      "id": "msg_001",
      "sender": "admin",
      "text": "Check your route deviation.",
      "sentAt": "2025-06-01T13:00:00Z"
    }
  ]
}
```

**Incoming driver message:**
```json
{
  "type": "dispatch_message",
  "driverId": "drv_01",
  "sender": "driver",
  "text": "Pulling over now.",
  "sentAt": "2025-06-01T14:33:00Z"
}
```

**Driver online status update:**
```json
{ "type": "driver_status", "driverId": "drv_01", "online": true }
```

---

## WebSocket: `/ws/notifications`

Existing channel used by `Header.tsx`. Extend to accept `announcement_broadcast` events:

```json
{
  "type": "announcement_broadcast",
  "payload": {
    "id": "ann_001",
    "title": "Route delay alert",
    "message": "Tambaram route will be delayed by 20 minutes today.",
    "targetType": "route-specific",
    "routeId": "route_02"
  }
}
```

Client-side: `Header.tsx` should only display if the student is subscribed to the announcement's route (or it's global).

---

## Database

### `announcements` table (new)

```sql
CREATE TABLE announcements (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  target_type     TEXT NOT NULL CHECK (target_type IN ('global', 'route-specific')),
  route_id        TEXT REFERENCES routes(id),
  recipient_count INTEGER,
  created_by      TEXT REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### `dispatch_messages` table (new)

```sql
CREATE TABLE dispatch_messages (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id   TEXT NOT NULL REFERENCES drivers(id),
  sender      TEXT NOT NULL CHECK (sender IN ('admin', 'driver')),
  text        TEXT NOT NULL,
  sent_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dispatch_driver ON dispatch_messages(driver_id, sent_at DESC);
```

### `sos_events` table (new)

```sql
CREATE TABLE sos_events (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id          TEXT NOT NULL REFERENCES buses(id),
  driver_id       TEXT NOT NULL REFERENCES drivers(id),
  lat             DECIMAL(9,6),
  lng             DECIMAL(9,6),
  nearest_stop    TEXT,
  triggered_at    TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_by TEXT REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ
);
```

### `PATCH /api/admin/sos/:eventId/acknowledge`

Marks an SOS event as acknowledged by the admin.

```json
{ "acknowledgedBy": "admin_user_id" }
```

---

## Authorization

All `/api/admin/*` and `/ws/admin*` connections require admin role. The dispatch WebSocket should also verify the connecting client is an admin before relaying messages.
