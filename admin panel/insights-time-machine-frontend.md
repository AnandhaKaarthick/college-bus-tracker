# Advanced Insights: "Time Machine" — Frontend Spec

**File:** `src/app/admin/insights/page.tsx`  
**Component:** `InsightsDashboard`

---

## Layout Overview

Tabbed interface with three insight views.

```
┌─────────────────────────────────────────────────────────────┐
│  Tabs: [Time Machine]  [Ridership Heatmap]  [Fuel/KM Report]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Active Tab Panel                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Tab 1: Time Machine Playback

**Component:** `HistoricalMap`  
**File:** `src/app/admin/insights/components/HistoricalMap.tsx`

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Controls Bar (top)                                         │
│  [Date Picker]  [Route Filter]  [Play] [Pause] [Speed: 1x]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Map Panel (full height, reuses LiveMap in playback mode)   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Timeline Slider (bottom, sticky)                           │
│  |────────●────────────────────────────|                    │
│  00:00                              23:59                   │
└─────────────────────────────────────────────────────────────┘
```

### State

- `selectedDate: Date` — default: yesterday
- `selectedRouteId: string | null`
- `timeValue: number` — minutes from midnight (0–1439), drives slider
- `isPlaying: boolean`
- `playbackSpeed: 1 | 2 | 5 | 10` — multiplier for playback interval
- `playbackFrame: BusSnapshot[] | null` — bus positions for current `timeValue`

### Playback Controls

**Date picker:** calendar input, max = yesterday (no future dates), min = earliest log date

**Play/Pause button:** toggles `isPlaying`

**Speed selector:** dropdown: 1×, 2×, 5×, 10×

**Timeline slider:** `<input type="range" min={0} max={1439} step={1}>`  
Display current time as label above thumb (e.g., `08:22`)

### Playback Loop

```ts
useEffect(() => {
  if (!isPlaying) return;
  const interval = setInterval(() => {
    setTimeValue(prev => {
      if (prev >= 1439) { setIsPlaying(false); return 1439; }
      return prev + 1;
    });
  }, 1000 / playbackSpeed);
  return () => clearInterval(interval);
}, [isPlaying, playbackSpeed]);
```

### Data Fetching

Fetch a batch of snapshots for the selected date/route on date change; do not fetch per-tick.

```ts
// On date or route change:
const snapshots = await fetch(
  `/api/admin/history/snapshots?date=YYYY-MM-DD&routeId=xxx`
);
// Returns: { [minuteOfDay: number]: BusSnapshot[] }
```

Interpolate between available snapshots for smooth playback if needed.

### Map Display

Pass `playbackFrame` (current minute's bus positions) to `LiveMap` component with a `mode="playback"` prop that disables live WebSocket updates.

---

## Tab 2: Ridership Heatmap

**Component:** `RidershipHeatmap`  
**File:** `src/app/admin/insights/components/RidershipHeatmap.tsx`

### Layout

```
┌────────────────────────────────────────────────────────────┐
│  Controls: [Week Picker]  [Route Filter]                   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Map with heatmap overlay (stops color-coded by load)      │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  Top 5 Crowded Stops table (below map)                     │
│  Rank | Stop | Avg Occupancy | Peak Hour                   │
└────────────────────────────────────────────────────────────┘
```

### Heatmap Overlay

- Each stop rendered as a circle on the map
- Circle radius and intensity (opacity or size) proportional to average occupancy ratio (`avgOccupancy / capacity`)
- Use a single accent color from the existing design system with variable opacity (not a rainbow scale)

### Data Source

`GET /api/admin/insights/ridership?weekStart=YYYY-MM-DD&routeId=xxx`

Returns per-stop average and peak occupancy for the selected week.

### Top Stops Table

Static table below map. Derived from the same API response, sorted by average occupancy desc, show top 5.

---

## Tab 3: Fuel/KM Efficiency Report

**Component:** `FuelKMReport`  
**File:** `src/app/admin/insights/components/FuelKMReport.tsx`

### Layout

```
┌────────────────────────────────────────────────────────────┐
│  Controls: [Date Range Picker]  [Export CSV button]        │
├────────────────────────────────────────────────────────────┤
│  Summary Cards: Total KM | Avg KM/Bus | Est. Fuel Used     │
├────────────────────────────────────────────────────────────┤
│  Per-Bus Efficiency Table (full width)                     │
│  Bus# | Driver | KM Today | KM Period | Est. Fuel | Grade  │
└────────────────────────────────────────────────────────────┘
```

### Summary Cards

Three stat cards in a row (reuse existing card component):
- **Total Fleet KM** (sum of all buses in period)
- **Average KM per Bus** (total / active bus count)
- **Estimated Fuel Used** (total KM × estimated consumption rate)

Fuel rate: configurable constant, e.g., `FUEL_RATE_L_PER_100KM = 25`

### Per-Bus Table

| Column | Notes |
|---|---|
| Bus # | Identifier |
| Driver | Driver name |
| KM Today | From existing `kmToday` field |
| KM (Period) | Sum over selected date range |
| Est. Fuel (L) | `kmPeriod * FUEL_RATE / 100` |
| Efficiency Grade | A/B/C/D based on KM vs fleet average |

**Efficiency Grade logic:**
```ts
function getGrade(busKm: number, avgKm: number): 'A' | 'B' | 'C' | 'D' {
  const ratio = busKm / avgKm;
  if (ratio >= 1.1) return 'A';
  if (ratio >= 0.9) return 'B';
  if (ratio >= 0.7) return 'C';
  return 'D';
}
```

### CSV Export

Client-side export from current table data:

```ts
function exportCSV(rows: BusEfficiencyRow[]) {
  const csv = [headers, ...rows.map(rowToCSV)].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  // trigger download
}
```

---

## Types

```ts
interface BusSnapshot {
  busId: string;
  busNumber: string;
  lat: number;
  lng: number;
  speed: number;
  occupancy: number;
}

interface StopRidershipData {
  stopId: string;
  stopName: string;
  lat: number;
  lng: number;
  avgOccupancy: number;
  capacity: number;
  peakHour: string;   // "HH:00"
}

interface BusEfficiencyRow {
  busId: string;
  busNumber: string;
  driverName: string;
  kmToday: number;
  kmPeriod: number;
  estimatedFuelL: number;
  grade: 'A' | 'B' | 'C' | 'D';
}
```
