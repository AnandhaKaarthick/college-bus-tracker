# Advanced Insights: "Time Machine" — Backend Spec

---

## Endpoints

### `GET /api/admin/history/snapshots`

Returns historical bus positions for a given date, grouped by minute of day.

**Query params:**
- `date` (required): `YYYY-MM-DD`
- `routeId` (optional): filter to a specific route

**Response:**
```json
{
  "date": "2025-05-30",
  "snapshots": {
    "480": [
      { "busId": "bus_01", "busNumber": "TN-01-AB-1234", "lat": 13.0827, "lng": 80.2707, "speed": 35, "occupancy": 22 }
    ],
    "481": [
      { "busId": "bus_01", "busNumber": "TN-01-AB-1234", "lat": 13.0831, "lng": 80.2715, "speed": 38, "occupancy": 22 }
    ]
  }
}
```

Keys are `minuteOfDay` integers (0–1439).

**Query:**
```sql
SELECT
  bus_id,
  b.bus_number,
  lat, lng, speed, occupancy,
  EXTRACT(HOUR FROM recorded_at) * 60 + EXTRACT(MINUTE FROM recorded_at) AS minute_of_day
FROM bus_location_logs bll
JOIN buses b ON bll.bus_id = b.id
WHERE DATE(recorded_at) = $1
  AND ($2::text IS NULL OR b.route_id = $2)
ORDER BY recorded_at ASC;
```

**Notes:**
- Group by `minute_of_day` in application layer after DB query
- For large datasets (many buses, full day), paginate by time window or use a streaming response
- Consider pre-aggregating into a `bus_snapshots_daily` materialized view for performance

---

### `GET /api/admin/insights/ridership`

Returns per-stop average and peak occupancy for a given week.

**Query params:**
- `weekStart` (required): `YYYY-MM-DD` (Monday of the week)
- `routeId` (optional)

**Response:**
```json
[
  {
    "stopId": "stop_t_nagar",
    "stopName": "T. Nagar",
    "lat": 13.0500,
    "lng": 80.2341,
    "avgOccupancy": 31,
    "capacity": 40,
    "peakHour": "08:00"
  }
]
```

**Query logic:**
```sql
SELECT
  bsa.stop_id,
  s.name AS stop_name,
  s.lat, s.lng,
  b.capacity,
  ROUND(AVG(bll.occupancy)) AS avg_occupancy,
  -- Peak hour: mode of hour across arrivals
  MODE() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM bsa.arrived_at)) AS peak_hour
FROM bus_stop_arrivals bsa
JOIN buses b ON bsa.bus_id = b.id
JOIN stops s ON bsa.stop_id = s.id
JOIN bus_location_logs bll
  ON bll.bus_id = bsa.bus_id
  AND ABS(EXTRACT(EPOCH FROM (bll.recorded_at - bsa.arrived_at))) < 120  -- within 2 min
WHERE bsa.arrived_at >= $weekStart
  AND bsa.arrived_at < $weekStart + INTERVAL '7 days'
  AND ($routeId IS NULL OR b.route_id = $routeId)
GROUP BY bsa.stop_id, s.name, s.lat, s.lng, b.capacity
ORDER BY avg_occupancy DESC;
```

---

### `GET /api/admin/insights/fuel-km`

Returns per-bus KM and efficiency data for a given date range.

**Query params:**
- `from` (required): `YYYY-MM-DD`
- `to` (required): `YYYY-MM-DD`

**Response:**
```json
[
  {
    "busId": "bus_01",
    "busNumber": "TN-01-AB-1234",
    "driverName": "Ramesh Kumar",
    "kmToday": 42,
    "kmPeriod": 284,
    "estimatedFuelL": 71.0
  }
]
```

**KM calculation:**
- Sum `km_today` values from `bus_daily_stats` table (see below)
- If `bus_daily_stats` table doesn't exist yet, sum GPS-based odometer deltas from `bus_location_logs`

**Fuel estimation:**
```sql
-- estimatedFuelL = kmPeriod * FUEL_RATE / 100
-- FUEL_RATE is a server config constant, e.g., 25 L/100km
```

**Notes:**
- `estimatedFuelL` is an approximation; label it clearly in the response and UI as an estimate
- Return `kmToday` from the most recent daily record within the range

---

## Database

### `bus_location_logs` — ensure indexes for playback queries

```sql
-- Index for date-range queries (Time Machine)
CREATE INDEX IF NOT EXISTS idx_location_logs_date ON bus_location_logs(bus_id, recorded_at);

-- Partial index for single-day queries
CREATE INDEX IF NOT EXISTS idx_location_logs_day ON bus_location_logs(DATE(recorded_at), bus_id);
```

### `bus_daily_stats` table (new, optional — improves performance)

Pre-aggregated daily summary per bus, populated by a nightly job.

```sql
CREATE TABLE bus_daily_stats (
  bus_id     TEXT NOT NULL REFERENCES buses(id),
  date       DATE NOT NULL,
  km_today   DECIMAL(8,2) DEFAULT 0,
  PRIMARY KEY (bus_id, date)
);
```

**Nightly job (runs at 00:05):**
```sql
INSERT INTO bus_daily_stats (bus_id, date, km_today)
SELECT
  bus_id,
  CURRENT_DATE - 1 AS date,
  -- Approximate KM from GPS point deltas using haversine sum
  SUM(haversine_km(lat, lng, prev_lat, prev_lng)) AS km_today
FROM (
  SELECT bus_id, lat, lng,
    LAG(lat) OVER (PARTITION BY bus_id ORDER BY recorded_at) AS prev_lat,
    LAG(lng) OVER (PARTITION BY bus_id ORDER BY recorded_at) AS prev_lng
  FROM bus_location_logs
  WHERE DATE(recorded_at) = CURRENT_DATE - 1
) sub
WHERE prev_lat IS NOT NULL
GROUP BY bus_id
ON CONFLICT (bus_id, date) DO UPDATE SET km_today = EXCLUDED.km_today;
```

### Haversine function in PostgreSQL

```sql
CREATE OR REPLACE FUNCTION haversine_km(
  lat1 FLOAT, lon1 FLOAT, lat2 FLOAT, lon2 FLOAT
) RETURNS FLOAT AS $$
DECLARE
  r FLOAT := 6371;
  dlat FLOAT := RADIANS(lat2 - lat1);
  dlon FLOAT := RADIANS(lon2 - lon1);
  a FLOAT;
BEGIN
  a := SIN(dlat/2)^2 + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlon/2)^2;
  RETURN r * 2 * ASIN(SQRT(a));
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

## Data Retention Policy

Historical `bus_location_logs` can grow very large. Define a retention policy:

```sql
-- Partition by month (if not already)
-- Or schedule cleanup of logs older than N months

-- Example: delete logs older than 6 months
DELETE FROM bus_location_logs
WHERE recorded_at < NOW() - INTERVAL '6 months';
```

Recommend: schedule as a monthly maintenance job. Adjust retention period based on storage capacity.

---

## Environment Variables

```env
FUEL_RATE_L_PER_100KM=25
HISTORY_RETENTION_MONTHS=6
```
