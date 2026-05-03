# Schedule Manager & Delay Engine — Frontend Spec

**File:** `src/app/admin/schedule-manager/page.tsx`  
**Component:** `ScheduleManager`

---

## Layout Overview

Two-panel layout: left for route/stop schedule editor, right for live delay status dashboard.

```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: "Schedule Manager"                             │
├────────────────────────────┬─────────────────────────────────┤
│  Schedule Editor (50%)     │  Live Delay Dashboard (50%)     │
│                            │                                  │
│  [Route Selector dropdown] │  [Delay Status Table]           │
│                            │  Bus | Stop | Delta | Tag       │
│  Stop timing table         │                                  │
│  Stop | Expected Arrival   │  [Auto-refresh every 15s]       │
│  [Edit inline]             │                                  │
│                            │                                  │
│  [Save Schedule button]    │                                  │
└────────────────────────────┴─────────────────────────────────┘
```

---

## Components

### `ScheduleManager` (page root)

**State:**
- `selectedRouteId: string | null`
- `scheduleData: ScheduleEntry[]` — stop-time pairs for selected route
- `delayData: DelayRecord[]` — live delay feed, refreshed on interval
- `isDirty: boolean` — unsaved changes guard

---

### `RouteSelector`

**Location:** `src/app/admin/schedule-manager/components/RouteSelector.tsx`

**Props:**
```ts
interface RouteSelectorProps {
  routes: Route[];
  selectedRouteId: string | null;
  onChange: (routeId: string) => void;
}
```

- Dropdown (use existing `Select` component from design system)
- On change: fetch schedule for selected route, replace `scheduleData`
- If `isDirty`, show confirmation dialog before switching routes

---

### `StopScheduleTable`

**Location:** `src/app/admin/schedule-manager/components/StopScheduleTable.tsx`

**Props:**
```ts
interface StopScheduleTableProps {
  entries: ScheduleEntry[];
  onChange: (updated: ScheduleEntry[]) => void;
}
```

**Columns:**

| Column | Notes |
|---|---|
| Order | Stop sequence number (read-only) |
| Stop Name | Read-only |
| Expected Arrival | Inline editable time input (HH:MM, 24h) |

**Inline editing:** clicking the time cell activates a `<input type="time">` in place; commit on blur or Enter

**Validation:** times must be in ascending order (each stop later than previous); show inline error if violated

**Add row:** not needed — stops are defined by the route; only arrival times are editable here

**Save button:** full-width button at bottom of table; disabled when not dirty; calls `PUT /api/admin/schedules/:routeId`

---

### `DelayDashboard`

**Location:** `src/app/admin/schedule-manager/components/DelayDashboard.tsx`

**Props:**
```ts
interface DelayDashboardProps {
  delayRecords: DelayRecord[];
  isLoading: boolean;
}
```

**Layout:** full-height scrollable table with sticky header

**Columns:**

| Column | Notes |
|---|---|
| Bus # | Link to open BusTelemetryModal (reuse from Active Routes) |
| Stop | Stop name |
| Scheduled | Expected arrival time |
| Actual | Actual arrival timestamp |
| Delta | Computed: `Actual - Scheduled` in minutes, e.g. "+7 min" |
| Tag | `Delayed` badge if delta > 5 min; `On Time` otherwise |

**Auto-refresh:** poll `GET /api/admin/delays/live` every 15 seconds using `setInterval` + cleanup on unmount

**Sorting:** Delayed entries first, then sorted by delta descending

**Empty state:** "No delays detected" placeholder

---

## Delay Tag Display Logic

```ts
function getDelayTag(deltaMinutes: number): 'On Time' | 'Delayed' {
  return deltaMinutes > 5 ? 'Delayed' : 'On Time';
}

function formatDelta(deltaMinutes: number): string {
  const sign = deltaMinutes >= 0 ? '+' : '';
  return `${sign}${deltaMinutes} min`;
}
```

---

## Types

```ts
interface ScheduleEntry {
  stopId: string;
  stopName: string;
  orderIndex: number;
  expectedArrival: string;  // "HH:MM" 24-hour format
}

interface DelayRecord {
  busId: string;
  busNumber: string;
  stopId: string;
  stopName: string;
  scheduledArrival: string;   // ISO timestamp
  actualArrival: string;       // ISO timestamp
  deltaMinutes: number;        // positive = late, negative = early
  tag: 'On Time' | 'Delayed';
}
```

---

## Unsaved Changes Guard

```ts
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isDirty) e.preventDefault();
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [isDirty]);
```

Also intercept Next.js router navigation with `useRouter` `beforePopState` or equivalent.

---

## Error & Loading States

- `StopScheduleTable`: skeleton rows while loading schedule for selected route
- `DelayDashboard`: spinner on first load; silently refresh without spinner on subsequent polls
- Save action: button shows loading state during API call; success/error toast on completion
