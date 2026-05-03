# Vehicle Maintenance & Depot Log — Backend Spec

---

## Endpoints

### `GET /api/admin/buses`

Returns the full fleet including non-active buses (admin-only; requires auth middleware).

**Response:**
```json
[
  {
    "id": "bus_01",
    "busNumber": "TN-01-AB-1234",
    "routeAssigned": "Main Gate → Porur",
    "driverName": "Ramesh Kumar",
    "status": "Active",
    "statusSince": "2025-06-01T08:00:00Z",
    "updatedAt": "2025-06-01T08:00:00Z"
  },
  {
    "id": "bus_03",
    "busNumber": "TN-01-CD-5678",
    "routeAssigned": "Tambaram → Main Gate",
    "driverName": "Murugan S",
    "status": "Maintenance",
    "statusSince": "2025-05-30T10:30:00Z",
    "updatedAt": "2025-05-30T10:30:00Z"
  }
]
```

**Notes:**
- Does NOT filter by status — returns all buses
- Joins `buses`, `drivers`, and `routes` tables
- Route name is a denormalized string for display; not an ID

---

### `PATCH /api/admin/buses/:busId/status`

Updates the status of a specific bus.

**Request body:**
```json
{
  "status": "Maintenance"
}
```

**Validation:**
- `status` must be one of: `Active`, `In Depot`, `Maintenance`
- If status is unchanged from current: return 200 with no DB write (idempotent)

**Response (200):**
```json
{
  "id": "bus_03",
  "status": "Maintenance",
  "statusSince": "2025-06-01T14:22:00Z",
  "updatedAt": "2025-06-01T14:22:00Z"
}
```

**Side effect:** When status changes, update `status_since` to `NOW()` in the DB.

---

## Database

### `buses` table modifications

```sql
ALTER TABLE buses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active'
  CHECK (status IN ('Active', 'In Depot', 'Maintenance'));

ALTER TABLE buses ADD COLUMN IF NOT EXISTS status_since TIMESTAMPTZ DEFAULT now();
```

### Trigger: auto-update `status_since` on status change

```sql
CREATE OR REPLACE FUNCTION update_status_since()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status <> OLD.status THEN
    NEW.status_since = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER buses_status_change
BEFORE UPDATE ON buses
FOR EACH ROW EXECUTE FUNCTION update_status_since();
```

Using a DB trigger ensures `status_since` is always accurate even if updated from outside the API (e.g., admin DB access, scripts).

---

## WebSocket Filter Integration

The existing `/ws/buses` broadcast must exclude any bus where `status != 'Active'`.

**Change in broadcast query:**
```sql
-- Before (emits all buses)
SELECT * FROM buses;

-- After (only emit active buses)
SELECT * FROM buses WHERE status = 'Active';
```

This is the only change required to the WebSocket handler. The student-facing map will automatically stop showing non-active buses.

---

## Maintenance Alert: Server-Side Option

Optionally, alerts can be computed server-side and pushed via WebSocket or a polling endpoint:

### `GET /api/admin/buses/maintenance-alerts`

Returns buses currently in Maintenance status that have exceeded the threshold.

**Query:**
```sql
SELECT id, bus_number, status_since
FROM buses
WHERE status = 'Maintenance'
  AND status_since < NOW() - INTERVAL '48 hours';
```

**Response:**
```json
[
  {
    "busId": "bus_03",
    "busNumber": "TN-01-CD-5678",
    "hoursInMaintenance": 51.3
  }
]
```

**Notes:**
- The 48-hour threshold should be configurable via environment variable: `MAINTENANCE_ALERT_THRESHOLD_HOURS=48`
- Frontend can also compute this client-side from `statusSince`; this endpoint is optional but useful for server-side alerting (email, push notifications)

---

## Authorization

All `/api/admin/*` endpoints require:
- Valid session cookie or Bearer token
- User role: `admin` or `super_admin`

Return `403 Forbidden` if a non-admin attempts access.

---

## Indexes

```sql
-- Speed up status-filtered queries (used by WebSocket broadcast)
CREATE INDEX IF NOT EXISTS idx_buses_status ON buses(status);

-- Speed up maintenance alert queries
CREATE INDEX IF NOT EXISTS idx_buses_maintenance ON buses(status, status_since)
  WHERE status = 'Maintenance';
```
