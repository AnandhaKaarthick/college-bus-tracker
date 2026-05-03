# Active Routes Live Monitor — Frontend Spec

**File:** `src/app/admin/active-routes/page.tsx`  
**Component:** `ActiveRoutesMonitor`

---

## Layout Overview

Split-panel layout: left sidebar for route list, right panel for full-height live map.

```
┌─────────────────────────────────────────────────────────────┐
│  [Sidebar: 320px fixed]  │  [Map Panel: flex-1]             │
│                          │                                   │
│  Route Grid (Bento)      │  LiveMap (filtered/full view)    │
│  - Route cards           │                                   │
│  - Bus density badges    │  Quick-Action Popup (modal)      │
│                          │                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Components

### `ActiveRoutesMonitor` (page root)

```tsx
// src/app/admin/active-routes/page.tsx
export default function ActiveRoutesMonitor()
```

**State:**
- `selectedRouteId: string | null` — currently focused route
- `selectedBusId: string | null` — bus clicked on map (triggers modal)
- `routes: Route[]` — fetched from REST on mount
- `buses: BusLivePosition[]` — from WebSocket `/ws/buses`

**Layout classes (Tailwind):**
```
flex h-screen overflow-hidden
```

---

### `RouteGrid` (left sidebar)

**Location:** `src/app/admin/active-routes/components/RouteGrid.tsx`

**Props:**
```ts
interface RouteGridProps {
  routes: Route[];
  selectedRouteId: string | null;
  onRouteSelect: (routeId: string) => void;
}
```

**Layout:**
- Scrollable vertical list inside a `w-[320px] flex-col border-r` container
- Each route card: `Bento Grid` style card using existing design tokens
- Card content:
  - Route name (bold heading)
  - Start → End label (muted text)
  - Bus density badge: active bus count / total buses on route
  - Live indicator dot (pulsing animation) if any bus is active

**Selected state:** highlighted card border using existing active/selected style token

**Empty state:** "No active routes" placeholder centered in panel

---

### `LiveMapPanel` (right panel)

**Location:** `src/app/admin/active-routes/components/LiveMapPanel.tsx`

**Props:**
```ts
interface LiveMapPanelProps {
  buses: BusLivePosition[];
  selectedRouteId: string | null;
  onBusClick: (busId: string) => void;
}
```

**Behavior:**
- When `selectedRouteId` is null: show all buses and all stops across all routes
- When `selectedRouteId` is set: auto-zoom map to that route's bounding box and filter displayed buses/stops to only that route
- Use existing `LiveMap` component, pass filtered data as props

**Map filtering logic (in component, not in LiveMap itself):**
```ts
const filteredBuses = selectedRouteId
  ? buses.filter(b => b.routeId === selectedRouteId)
  : buses;
```

**Bus icon click:** calls `onBusClick(bus.id)` → triggers `BusTelemetryModal`

---

### `BusTelemetryModal`

**Location:** `src/app/admin/active-routes/components/BusTelemetryModal.tsx`

**Props:**
```ts
interface BusTelemetryModalProps {
  busId: string | null;
  onClose: () => void;
}
```

**Layout:** centered modal overlay, card with two-column inner layout

**Content:**
- Left column: Driver profile (avatar placeholder, name, contact, license number)
- Right column: Live telemetry data grid
  - Speed (km/h)
  - Occupancy (e.g., "28 / 40 seats")
  - Current stop / last stop
  - Status badge (Active / Delayed)
  - Route assigned

**Data source:** REST call to `/api/buses/:busId/telemetry` on `busId` change

**Close:** backdrop click or explicit close button

---

## Data Flow

```
WebSocket /ws/buses
       │
       ▼
  [ActiveRoutesMonitor state: buses]
       │
       ├──► RouteGrid (derives density per route from buses array)
       │
       └──► LiveMapPanel (filtered by selectedRouteId)
                  │
                  └──► BusTelemetryModal (fetches on busId select)
```

---

## Types (extend existing models)

```ts
interface Route {
  id: string;
  name: string;         // e.g., "Main Gate → Porur"
  startStop: string;
  endStop: string;
  stopIds: string[];
  busIds: string[];
}

// BusLivePosition already exists — ensure routeId field is present
interface BusLivePosition {
  id: string;
  routeId: string;
  lat: number;
  lng: number;
  speed: number;
  occupancy: number;
  capacity: number;
  status: 'Active' | 'Delayed' | 'In Depot' | 'Maintenance';
  driverId: string;
}
```

---

## Accessibility

- Route cards: `role="button"` with `aria-selected`
- Modal: `role="dialog"` with `aria-modal="true"`, focus trap on open
- Map markers: `aria-label` with bus number and route name

---

## Error & Loading States

- Sidebar: skeleton cards (3–4) while routes load
- Map: existing `LiveMap` loading state
- Modal: spinner while telemetry fetches; error message if fetch fails
