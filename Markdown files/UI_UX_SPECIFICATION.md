# UI/UX SPECIFICATION
## Real-Time College Bus Tracking System

---

## 1. Design Philosophy

- **Map-First:** The map is the product. Every UI element exists to enhance the map experience, not compete with it.
- **Mobile-First:** Student and driver views are designed for small screens first; admin dashboard targets desktop.
- **Zero Learning Curve:** A student should open the app and understand their bus status within 3 seconds — no tutorial needed.
- **Dark Mode Default:** Premium feel via dark-themed map tiles (Maptiler dark style); reduces eye strain during early morning commutes.

---

## 2. Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#3B82F6` | Buttons, active states, ETA badge |
| `--success` | `#22C55E` | On-track bus status |
| `--warning` | `#F59E0B` | Delayed status |
| `--danger` | `#EF4444` | Idle / breakdown / panic |
| `--bg-dark` | `#0F172A` | Map overlay panels |
| `--text-muted` | `#94A3B8` | Secondary labels |

---

## 3. Typography

- **Font:** Inter (Google Fonts)
- **Headings:** `font-semibold`, sizes `text-xl` to `text-3xl`
- **Body:** `font-normal`, `text-sm` to `text-base`
- **ETA Numbers:** `font-bold text-3xl` — must be legible at a glance

---

## 4. Student Interface (Rider View)

### 4.1 Home Screen — Map View

```
┌─────────────────────────────────┐
│  🔍 Search Stop...        [☰]  │
├─────────────────────────────────┤
│                                 │
│        [ LIVE MAP ]             │
│                                 │
│    🚌 ──────────────>  📍      │
│    (bus icon)         (your stop)│
│                                 │
├─────────────────────────────────┤
│  Bus 04 - North Campus Route    │
│  🟢 On Track  |  ETA: 4 min    │
│  📞 Driver: Ramesh (+91 ...)   │
└─────────────────────────────────┘
```

**Components:**
- Top bar: stop search + hamburger menu
- Full-screen Leaflet map
- Bottom sheet (draggable): bus card with ETA, status badge, driver contact

### 4.2 Route Detail Screen

- Full route polyline drawn on map
- All stops marked with numbered pins
- Active bus position with animated pulse ring
- "Your Stop" highlighted in primary blue

### 4.3 Geofence Alert (Push Notification)

```
📍 Bus 04 is 1 km away — arriving in ~3 min
[View on Map]
```

### 4.4 Driver Contact Modal

```
┌──────────────────────────────┐
│ Driver Information           │
│ Name: Ramesh Kumar           │
│ Phone: +91 98765 43210       │
│ Bus: Route 04 | Vehicle: TN  │
│ [📞 Call]   [✕ Close]       │
└──────────────────────────────┘
```

---

## 5. Driver Interface (Mobile Browser App)

### 5.1 Driver Dashboard

```
┌──────────────────────────────┐
│ Bus 04 — Route: North Campus │
│ Status: ● LIVE               │
│                              │
│   GPS: ✅ Active              │
│   Speed: 32 km/h             │
│   Wake Lock: ✅ Enabled       │
│                              │
│   Occupancy: [LOW] [MED] [FULL]│
│                              │
│   [🔴 PANIC BUTTON]          │
│   [⏹ End Trip]              │
└──────────────────────────────┘
```

**Notes:**
- Screen Wake Lock API enabled automatically on trip start
- Occupancy toggle sends update to student view in real-time
- Panic button triggers GPS-tagged alert to campus security

---

## 6. Admin Dashboard (Desktop)

### 6.1 Layout

```
┌──────────────┬──────────────────────────────────────┐
│  SIDEBAR     │         MAIN MAP PANEL               │
│              │                                      │
│ 🚌 Bus 01   │     [Full-screen Fleet Map]          │
│    On Track  │                                      │
│              │   🚌₁  🚌₂      🚌₄                │
│ 🚌 Bus 02   │          🚌₃                        │
│    Delayed   │                                      │
│              ├──────────────────────────────────────┤
│ 🚌 Bus 03   │  TELEMETRY PANEL (Bus selected)      │
│    On Track  │  Speed: 28 km/h | Idle: 0 min       │
│              │  Last Update: 2s ago                 │
│ 🚌 Bus 04   │  [View History] [📍 Breadcrumb Trail]│
│    Idle ⚠️  │                                      │
└──────────────┴──────────────────────────────────────┘
```

### 6.2 Breadcrumb Trail View

- Toggle: shows ghost path of bus over last 1h / 6h / 24h
- Color gradient: recent = bright, older = faded
- Clickable points on trail show timestamp tooltip

### 6.3 Historical Playback (Time Machine)

- Date/time picker to select a past trip
- Play / Pause / Scrub controls
- Bus icon replays its recorded path at 10× speed

---

## 7. Component Library (Tailwind-based)

| Component | Description |
|-----------|-------------|
| `<BusCard />` | Status badge + ETA + route name |
| `<ETABadge />` | Large countdown number with color coding |
| `<StatusPill />` | Pill badge: On-track / Delayed / Idle |
| `<MapOverlay />` | Transparent bottom sheet over map |
| `<PanicButton />` | Full-width red button with confirmation dialog |
| `<OccupancyToggle />` | Three-state toggle: Low / Med / Full |
| `<BreadcrumbLayer />` | Leaflet polyline layer with timestamp markers |

---

## 8. Responsiveness Breakpoints

| Breakpoint | Width | Target |
|-----------|-------|--------|
| `sm` | < 640px | Student & Driver mobile |
| `md` | 640–1024px | Tablet fallback |
| `lg` | > 1024px | Admin dashboard |

---

## 9. Accessibility

- All interactive elements: minimum 44×44px tap target
- Color is never the sole indicator of status (always paired with text/icon)
- ARIA labels on map controls and dynamic ETA regions
- Font size minimum: 14px body, 12px captions
