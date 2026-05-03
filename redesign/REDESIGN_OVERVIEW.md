# REDESIGN_OVERVIEW.md
## App Redesign — Existing App → Stitch Design System
### Campus Bus Tracker · Complete Upgrade Guide

> **What this document covers:** A full diff between the existing app and the new Stitch redesign, a map of every new .md specification file, and the recommended implementation order.

---

## 1. Why the Redesign

The existing app has a solid real-time technical foundation — WebSockets, OSRM road-snapping, live GPS, and a Leaflet map. What it lacks is **utility depth and safety infrastructure.** The new Stitch design upgrades the app from a "map viewer" into a full campus transit platform.

---

## 2. What's Changing — Full Diff

| Area | Existing App | Stitch Redesign |
|------|-------------|-----------------|
| **Entry Screen** | Opens directly to map | Opens to Bento Dashboard (info hub) |
| **Navigation** | Basic sidebar / hamburger | Unified 5-tab bottom bar |
| **Student Dashboard** | None — only map | Bento layout: ETA card + stats + alerts + mini-map |
| **Safety** | Single SOS button | Full Safety Hub with 5 features |
| **Stop List** | Simple vertical list | Vertical stepper with timestamps + feature badges |
| **Stop Tap** | Bus ETA only | Bus ETA + Walking ETA + buffer recommendation |
| **Typography** | Default Tailwind sans | Manrope (headings) + Inter (body) |
| **Color Palette** | Standard Blue / Dark | Deep Navy `#1B263B` + Vibrant Red `#E63946` |
| **Corner Radius** | Standard Tailwind | Soft Institutional — `1rem` / 16px everywhere |
| **Alert Types** | `panic`, `breakdown`, `delay` | + `accident`, `suspicious_activity`, `overcrowding` |
| **Theme Toggle** | ☀️ / 🌙 button (existing) | Retained — extended to new color tokens |
| **Occupancy Badge** | Low / Medium / Full | Retained + "Low Density" / "High Density" labels |
| **Driver Contact** | Modal with phone | Retained in My Bus Card |
| **Breadcrumb Trail** | Admin only | Retained in admin — no student change |

---

## 3. New Pages / Screens Introduced

| Screen | Route | Status |
|--------|-------|--------|
| Dashboard (Bento) | `/dashboard` | 🆕 New |
| Safety Hub | `/safety` | 🆕 New |
| Live Tracking (enhanced) | `/tracking` | ♻️ Upgraded from existing map |
| Full Map View | `/map` | ♻️ Upgraded (now tab 2) |
| Profile | `/profile` | 🆕 New (stub) |

---

## 4. Complete .md File Index

This redesign is documented across **7 specification files:**

| # | File | Covers |
|---|------|--------|
| 1 | `REDESIGN_OVERVIEW.md` ← *this file* | Master diff, file index, implementation order |
| 2 | `DESIGN_SYSTEM.md` | Colors, typography, spacing, corner radius, component tokens |
| 3 | `NAVIGATION.md` | Unified bottom bar — tabs, routing, active states, badges |
| 4 | `DASHBOARD_PAGE.md` | Bento layout, My Bus Card, Stats Cards, Alerts Feed, Mini-Map |
| 5 | `LIVE_TRACKING_PAGE.md` | Vertical stop stepper, feature badges, enhanced stop modal |
| 6 | `SAFETY_HUB_PAGE.md` | SOS hold, journey sharing, escort, incident form, directory |
| 7 | `BACKEND_UPGRADE.md` | FastAPI model changes, new endpoints, alert type expansion |

---

## 5. Component Inventory — New vs Retained

### New Components to Build

| Component | File | Page |
|-----------|------|------|
| `<BentoDashboard />` | `Dashboard.jsx` | Dashboard |
| `<MyBusCard />` | `MyBusCard.jsx` | Dashboard |
| `<StatsCard />` | `StatsCard.jsx` | Dashboard |
| `<AlertsFeed />` | `AlertsFeed.jsx` | Dashboard |
| `<MiniMapWidget />` | `MiniMapWidget.jsx` | Dashboard |
| `<BottomNavBar />` | `BottomNavBar.jsx` | Global |
| `<SafetyHub />` | `SafetyHub.jsx` | Safety |
| `<SOSHoldButton />` | `SOSHoldButton.jsx` | Safety |
| `<JourneySharePanel />` | `JourneySharePanel.jsx` | Safety |
| `<VirtualEscortRequest />` | `VirtualEscortRequest.jsx` | Safety |
| `<IncidentReportForm />` | `IncidentReportForm.jsx` | Safety |
| `<EmergencyDirectory />` | `EmergencyDirectory.jsx` | Safety |
| `<StopStepper />` | `StopStepper.jsx` | Live Tracking |
| `<StopDetailModal />` | `StopDetailModal.jsx` | Live Tracking (upgrade) |
| `<FeatureBadge />` | `FeatureBadge.jsx` | Live Tracking |

### Retained & Upgraded Components

| Component | Change |
|-----------|--------|
| `<MapContainer />` | Retiled with new map style; now used in both Map tab and Mini-Map widget |
| `<BusMarkerLayer />` | Marker border color updated to use new palette tokens |
| `<ETADisplay />` | Font changed to Manrope Bold; color tokens updated |
| `<OccupancyBadge />` | Labels updated to "Low Density" / "High Density" style |
| `<ThemeToggleButton />` | Color tokens updated to new palette |
| `<BottomSheet />` | Corner radius updated to 1rem; header typography updated |

---

## 6. Design Token Changes Summary

```
OLD → NEW

Font:
  Default sans       →  Manrope (700, 800) for headings
                        Inter (400, 500, 600) for body/labels

Primary Accent:
  #2563EB (blue-600) →  #E63946 (Vibrant Red) — CTAs, active nav, ETA badge
  #60A5FA (blue-400) →  #FF6B74 (Red-light)   — Dark mode accent

Background (Dark):
  #0B1120            →  #1B263B (Deep Navy)

Background (Light):
  #F8FAFC            →  #F4F6FA (slightly warmer off-white)

Corner Radius:
  Varied             →  Unified 1rem (16px) on all cards, modals, sheets

Navigation:
  Sidebar/hamburger  →  5-tab bottom bar (fixed, always visible)
```

---

## 7. Recommended Implementation Order

Follow this sequence to avoid breaking existing functionality while adding new screens:

```
PHASE A — Design System (no UI changes yet)
  Step 1 │ Update index.css with new CSS tokens (colors, fonts)
  Step 2 │ Import Manrope + Inter from Google Fonts
  Step 3 │ Update ThemeToggleButton tokens
  Step 4 │ Update all existing components to use new tokens
          │ (BusCard, ETADisplay, BottomSheet, OccupancyBadge)

PHASE B — Navigation
  Step 5 │ Build BottomNavBar.jsx with 5 tabs
  Step 6 │ Set up React Router with /dashboard, /map,
          │ /tracking, /safety, /profile routes
  Step 7 │ Wrap App.jsx with BottomNavBar layout

PHASE C — Dashboard Page
  Step 8  │ Build MyBusCard.jsx (ETA + driver info)
  Step 9  │ Build StatsCard.jsx
  Step 10 │ Build AlertsFeed.jsx
  Step 11 │ Build MiniMapWidget.jsx
  Step 12 │ Assemble Dashboard.jsx (Bento grid)

PHASE D — Live Tracking Upgrade
  Step 13 │ Upgrade StopRow → StopStepper with timestamps
  Step 14 │ Add FeatureBadge (WiFi, density)
  Step 15 │ Upgrade StopDetailModal with Walking ETA panel

PHASE E — Safety Hub
  Step 16 │ Build SOSHoldButton (3s press-and-hold)
  Step 17 │ Build JourneySharePanel
  Step 18 │ Build VirtualEscortRequest
  Step 19 │ Build IncidentReportForm
  Step 20 │ Build EmergencyDirectory
  Step 21 │ Assemble SafetyHub.jsx

PHASE F — Backend
  Step 22 │ Expand Alert model in models.py
  Step 23 │ Add new alert endpoints
  Step 24 │ Add journey-sharing endpoint
  Step 25 │ Add escort request endpoint
```

---

## 8. File-to-Developer Assignment (Suggested)

| File | Suggested Owner | Dependency |
|------|----------------|------------|
| `DESIGN_SYSTEM.md` | Lead Frontend | Must be done first — all others depend on it |
| `NAVIGATION.md` | Lead Frontend | After design system |
| `DASHBOARD_PAGE.md` | Frontend Dev 1 | After navigation |
| `LIVE_TRACKING_PAGE.md` | Frontend Dev 2 | Can parallel with dashboard |
| `SAFETY_HUB_PAGE.md` | Frontend Dev 1 | After dashboard complete |
| `BACKEND_UPGRADE.md` | Backend Dev | Can parallel with all frontend |
