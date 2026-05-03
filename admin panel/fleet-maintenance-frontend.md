# Vehicle Maintenance & Depot Log — Frontend Spec

**File:** `src/app/admin/fleet-maintenance/page.tsx`  
**Component:** `FleetMaintenance`

---

## Layout Overview

Full-width table view with a sticky top summary bar.

```
┌─────────────────────────────────────────────────────────┐
│  Summary Bar: Active | In Depot | Maintenance counts    │
├─────────────────────────────────────────────────────────┤
│  Filter Tabs: All | Active | In Depot | Maintenance     │
├─────────────────────────────────────────────────────────┤
│  Fleet Table (full width, scrollable)                   │
│  Bus# | Route | Driver | Status Toggle | In Status For  │
│  ...                                                    │
└─────────────────────────────────────────────────────────┘

[Maintenance Alert Banner — conditionally shown at top]
```

---

## Components

### `FleetMaintenance` (page root)

**State:**
- `buses: BusRecord[]`
- `filterStatus: 'All' | 'Active' | 'In Depot' | 'Maintenance'`
- `maintenanceAlerts: BusRecord[]` — buses exceeding threshold

**On mount:** fetch `GET /api/admin/buses` (full fleet including non-active)

---

### `MaintenanceAlertBanner`

**Location:** `src/app/admin/fleet-maintenance/components/MaintenanceAlertBanner.tsx`

**Props:**
```ts
interface MaintenanceAlertBannerProps {
  alertedBuses: { busId: string; busNumber: string; hoursInMaintenance: number }[];
}
```

**Behavior:**
- Renders only when `alertedBuses.length > 0`
- Displayed as a full-width banner at the top of the page, above the summary bar
- Lists each alerted bus with bus number and how many hours it has been in maintenance
- Uses existing warning/alert style tokens (no new colors)

---

### `FleetSummaryBar`

**Location:** `src/app/admin/fleet-maintenance/components/FleetSummaryBar.tsx`

**Props:**
```ts
interface FleetSummaryBarProps {
  total: number;
  active: number;
  inDepot: number;
  maintenance: number;
}
```

**Layout:** horizontal flex row, three stat cards side-by-side  
**Each stat card:** label + large number, uses existing card/bento style

---

### `FleetFilterTabs`

**Location:** `src/app/admin/fleet-maintenance/components/FleetFilterTabs.tsx`

**Props:**
```ts
interface FleetFilterTabsProps {
  current: FilterStatus;
  onChange: (status: FilterStatus) => void;
}
```

Uses existing `Tabs` component from design system.

---

### `FleetTable`

**Location:** `src/app/admin/fleet-maintenance/components/FleetTable.tsx`

**Props:**
```ts
interface FleetTableProps {
  buses: BusRecord[];
  onStatusChange: (busId: string, newStatus: BusStatus) => void;
}
```

**Columns:**

| Column | Notes |
|---|---|
| Bus # | Identifier, bold |
| Route Assigned | Route name string |
| Driver | Driver name |
| Status | `StatusToggle` component (see below) |
| In Status For | Duration string (e.g., "2h 14m" or "3d 5h") |
| Last Updated | Relative timestamp |

**Sorting:** default by status (Maintenance → In Depot → Active), then by duration desc

---

### `StatusToggle`

**Location:** `src/app/admin/fleet-maintenance/components/StatusToggle.tsx`

**Props:**
```ts
interface StatusToggleProps {
  busId: string;
  current: BusStatus;
  onChange: (busId: string, newStatus: BusStatus) => void;
}
```

**Behavior:**
- Renders a dropdown/select or segmented control with three options: `Active`, `In Depot`, `Maintenance`
- On change: calls `PATCH /api/admin/buses/:busId/status` then calls `onChange` callback
- Optimistic update: immediately reflect new status in UI; revert on API error with toast notification
- Use existing form/select component from design system

---

## Duration Display Logic

Computed on the frontend from `statusSince` timestamp:

```ts
function formatDuration(statusSince: string): string {
  const diffMs = Date.now() - new Date(statusSince).getTime();
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${minutes}m`;
}
```

---

## Alert Threshold Logic

Computed on the frontend after data fetch:

```ts
const MAINTENANCE_THRESHOLD_HOURS = 48;

const maintenanceAlerts = buses.filter(bus => {
  if (bus.status !== 'Maintenance') return false;
  const hours = (Date.now() - new Date(bus.statusSince).getTime()) / 3600000;
  return hours > MAINTENANCE_THRESHOLD_HOURS;
});
```

**Threshold constant:** externalize to a config file or environment variable so it can be adjusted without code changes.

---

## Types

```ts
type BusStatus = 'Active' | 'In Depot' | 'Maintenance';

interface BusRecord {
  id: string;
  busNumber: string;
  routeAssigned: string;
  driverName: string;
  status: BusStatus;
  statusSince: string;   // ISO timestamp of last status change
  updatedAt: string;
}
```

---

## Error & Loading States

- Table: skeleton rows (5–8) while loading
- Status toggle: disabled state during in-flight PATCH request
- Alert banner: not shown until data loads (avoid flash)
