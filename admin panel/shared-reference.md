# Shared Reference: Types, Database Schema & Config

This file documents shared interfaces, the full database schema across all admin panel features, and consolidated environment variables.

---

## Shared TypeScript Types

Place in `src/types/admin.ts` (or extend existing types file):

```ts
// ─── Bus & Fleet ──────────────────────────────────────────────

export type BusStatus = 'Active' | 'In Depot' | 'Maintenance';

export interface BusRecord {
  id: string;
  busNumber: string;
  routeAssigned: string;
  driverName: string;
  status: BusStatus;
  statusSince: string;   // ISO timestamp
  updatedAt: string;
}

export interface BusLivePosition {
  id: string;
  busNumber: string;
  routeId: string;
  lat: number;
  lng: number;
  speed: number;
  occupancy: number;
  capacity: number;
  status: BusStatus;
  driverId: string;
}

export interface BusTelemetry {
  busId: string;
  speed: number;
  occupancy: number;
  capacity: number;
  status: BusStatus;
  lastStop: string;
  currentRoute: string;
  driver: DriverProfile;
}

// ─── Routes & Stops ───────────────────────────────────────────

export interface Route {
  id: string;
  name: string;
  startStop: string;
  endStop: string;
  stopIds: string[];
  busIds: string[];
}

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

// ─── Schedules & Delays ───────────────────────────────────────

export interface ScheduleEntry {
  stopId: string;
  stopName: string;
  orderIndex: number;
  expectedArrival: string;  // "HH:MM"
}

export type DelayTag = 'On Time' | 'Delayed';

export interface DelayRecord {
  busId: string;
  busNumber: string;
  stopId: string;
  stopName: string;
  scheduledArrival: string;
  actualArrival: string;
  deltaMinutes: number;
  tag: DelayTag;
}

// ─── Communication ────────────────────────────────────────────

export type AnnouncementTarget = 'global' | 'route-specific';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  targetType: AnnouncementTarget;
  routeId?: string;
  recipientCount: number;
  createdAt: string;
}

export interface DispatchMessage {
  id: string;
  driverId: string;
  sender: 'admin' | 'driver';
  text: string;
  sentAt: string;
}

export interface SOSAlert {
  busId: string;
  busNumber: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  routeName: string;
  lat: number;
  lng: number;
  nearestStop: string;
  triggeredAt: string;
}

// ─── Drivers ──────────────────────────────────────────────────

export interface DriverProfile {
  id: string;
  name: string;
  contact: string;
  licenseNumber: string;
}

// ─── Insights ─────────────────────────────────────────────────

export interface BusSnapshot {
  busId: string;
  busNumber: string;
  lat: number;
  lng: number;
  speed: number;
  occupancy: number;
}

export interface StopRidershipData {
  stopId: string;
  stopName: string;
  lat: number;
  lng: number;
  avgOccupancy: number;
  capacity: number;
  peakHour: string;
}

export interface BusEfficiencyRow {
  busId: string;
  busNumber: string;
  driverName: string;
  kmToday: number;
  kmPeriod: number;
  estimatedFuelL: number;
  grade: 'A' | 'B' | 'C' | 'D';
}
```

---

## Complete Database Schema (New Tables Only)

The following tables are new additions. Existing tables (`buses`, `drivers`, `stops`, `users`) are modified via `ALTER TABLE` as described in individual spec files.

```sql
-- Routes
CREATE TABLE routes (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  start_stop  TEXT NOT NULL REFERENCES stops(id),
  end_stop    TEXT NOT NULL REFERENCES stops(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Route ↔ Stop mapping (ordered)
CREATE TABLE route_stops (
  route_id    TEXT REFERENCES routes(id) ON DELETE CASCADE,
  stop_id     TEXT REFERENCES stops(id),
  order_index INTEGER NOT NULL,
  PRIMARY KEY (route_id, stop_id)
);

-- Route ↔ Bus mapping
CREATE TABLE route_buses (
  route_id    TEXT REFERENCES routes(id) ON DELETE CASCADE,
  bus_id      TEXT REFERENCES buses(id) ON DELETE CASCADE,
  PRIMARY KEY (route_id, bus_id)
);

-- Master schedule (expected arrival times)
CREATE TABLE route_schedules (
  id               SERIAL PRIMARY KEY,
  route_id         TEXT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  stop_id          TEXT NOT NULL REFERENCES stops(id),
  expected_arrival TIME NOT NULL,
  UNIQUE (route_id, stop_id)
);

-- Actual bus arrivals at stops
CREATE TABLE bus_stop_arrivals (
  id          SERIAL PRIMARY KEY,
  bus_id      TEXT NOT NULL REFERENCES buses(id),
  stop_id     TEXT NOT NULL REFERENCES stops(id),
  arrived_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_arrivals_date ON bus_stop_arrivals(bus_id, arrived_at);

-- Delay notification deduplication
CREATE TABLE delay_notifications_sent (
  bus_id   TEXT,
  stop_id  TEXT,
  date     DATE,
  sent_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (bus_id, stop_id, date)
);

-- Announcements
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

-- Driver dispatch messages
CREATE TABLE dispatch_messages (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id   TEXT NOT NULL REFERENCES drivers(id),
  sender      TEXT NOT NULL CHECK (sender IN ('admin', 'driver')),
  text        TEXT NOT NULL,
  sent_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_dispatch_driver ON dispatch_messages(driver_id, sent_at DESC);

-- SOS events
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

-- Daily bus stats (pre-aggregated for efficiency reports)
CREATE TABLE bus_daily_stats (
  bus_id   TEXT NOT NULL REFERENCES buses(id),
  date     DATE NOT NULL,
  km_today DECIMAL(8,2) DEFAULT 0,
  PRIMARY KEY (bus_id, date)
);
```

---

## Consolidated Environment Variables

```env
# Delay & Maintenance Thresholds
DELAY_THRESHOLD_MINUTES=5
MAINTENANCE_ALERT_THRESHOLD_HOURS=48

# Arrival Detection
ARRIVAL_DETECTION_RADIUS_METERS=50

# Fuel Estimation
FUEL_RATE_L_PER_100KM=25

# Data Retention
HISTORY_RETENTION_MONTHS=6

# WebSocket
WS_BUS_BROADCAST_INTERVAL_MS=5000
```

---

## Suggested File Structure

```
src/
├── app/
│   └── admin/
│       ├── active-routes/
│       │   ├── page.tsx
│       │   └── components/
│       │       ├── RouteGrid.tsx
│       │       ├── LiveMapPanel.tsx
│       │       └── BusTelemetryModal.tsx
│       ├── fleet-maintenance/
│       │   ├── page.tsx
│       │   └── components/
│       │       ├── MaintenanceAlertBanner.tsx
│       │       ├── FleetSummaryBar.tsx
│       │       ├── FleetFilterTabs.tsx
│       │       ├── FleetTable.tsx
│       │       └── StatusToggle.tsx
│       ├── schedule-manager/
│       │   ├── page.tsx
│       │   └── components/
│       │       ├── RouteSelector.tsx
│       │       ├── StopScheduleTable.tsx
│       │       └── DelayDashboard.tsx
│       ├── communication/
│       │   ├── page.tsx
│       │   └── components/
│       │       ├── AnnouncementForm.tsx
│       │       ├── DriverDispatchPanel.tsx
│       │       └── SOSResponseOverlay.tsx
│       └── insights/
│           ├── page.tsx
│           └── components/
│               ├── HistoricalMap.tsx
│               ├── RidershipHeatmap.tsx
│               └── FuelKMReport.tsx
├── types/
│   └── admin.ts           ← all shared types (this file)
└── lib/
    └── admin/
        ├── useAdminWS.ts  ← shared WebSocket hook for /ws/admin
        └── formatters.ts  ← formatDuration, formatDelta, getGrade, etc.
```

---

## Shared Utility Functions

Place in `src/lib/admin/formatters.ts`:

```ts
export function formatDuration(statusSince: string): string {
  const diffMs = Date.now() - new Date(statusSince).getTime();
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  return `${hours}h ${minutes}m`;
}

export function formatDelta(deltaMinutes: number): string {
  const sign = deltaMinutes >= 0 ? '+' : '';
  return `${sign}${deltaMinutes} min`;
}

export function getDelayTag(deltaMinutes: number): 'On Time' | 'Delayed' {
  return deltaMinutes > 5 ? 'Delayed' : 'On Time';
}

export function getEfficiencyGrade(busKm: number, avgKm: number): 'A' | 'B' | 'C' | 'D' {
  const ratio = busKm / avgKm;
  if (ratio >= 1.1) return 'A';
  if (ratio >= 0.9) return 'B';
  if (ratio >= 0.7) return 'C';
  return 'D';
}

export function minuteOfDayToTime(minute: number): string {
  const h = Math.floor(minute / 60).toString().padStart(2, '0');
  const m = (minute % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}
```
