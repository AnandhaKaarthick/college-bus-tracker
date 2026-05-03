# CAMPUS_MAP_INTEGRATION.md
## Leaflet Campus Overlay — Integration Guide
### Adding the RIT On-Campus Map Layer to the Existing React App

> **Goal:** When the bus enters the RIT campus geofence, the Leaflet map seamlessly transitions from the city-level view to a detailed campus view with the internal route overlay, building labels, stop pins, and a campus boundary polygon.

---

## 1. What Gets Added to the Map

| Layer | Trigger | Description |
|-------|---------|-------------|
| Campus boundary polygon | Always (when zoom ≥ 15) | Yellow outlined polygon matching the satellite image |
| Internal route polyline | When bus is on campus | Red dashed loop showing the internal bus path |
| Building stop pins | When campus view is active | Labeled pins for each internal drop-off |
| Bus marker (campus mode) | When bus is on campus | Same animated bus icon — smaller scale at zoom 17 |
| Campus label overlay | When zoom ≥ 16 | "RIT Campus" text label + block names |
| Geofence highlight | When bus approaches gate | Glowing border effect on the polygon |

---

## 2. File Structure

```
src/
├── components/
│   ├── map/
│   │   ├── MapContainer.jsx          ← existing, updated
│   │   ├── CampusOverlayLayer.jsx    ← 🆕 new
│   │   ├── CampusBoundaryPolygon.jsx ← 🆕 new
│   │   ├── CampusStopMarkers.jsx     ← 🆕 new
│   │   └── CampusRoutePolyline.jsx   ← 🆕 new
│   └── ...
│
├── data/
│   ├── rit_campus_boundary.json      ← 🆕 GeoJSON polygon
│   ├── rit_campus_stops.json         ← 🆕 internal stop array
│   └── rit_campus_route.json         ← 🆕 loop waypoints
│
└── hooks/
    └── useCampusMode.js              ← 🆕 campus detection hook
```

---

## 3. Campus Data Files

### 3.1 `rit_campus_boundary.json`

```json
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": {
      "type": "Polygon",
      "coordinates": [[
        [80.0024, 13.0158],
        [80.0028, 13.0165],
        [80.0033, 13.0168],
        [80.0040, 13.0167],
        [80.0048, 13.0162],
        [80.0053, 13.0155],
        [80.0056, 13.0145],
        [80.0058, 13.0132],
        [80.0057, 13.0118],
        [80.0055, 13.0105],
        [80.0051, 13.0096],
        [80.0046, 13.0088],
        [80.0042, 13.0082],
        [80.0040, 13.0078],
        [80.0038, 13.0078],
        [80.0036, 13.0080],
        [80.0033, 13.0082],
        [80.0031, 13.0085],
        [80.0028, 13.0090],
        [80.0025, 13.0100],
        [80.0023, 13.0112],
        [80.0022, 13.0125],
        [80.0022, 13.0138],
        [80.0024, 13.0150],
        [80.0024, 13.0158]
      ]]
    },
    "properties": { "name": "RIT Campus", "campus_id": "RIT" }
  }]
}
```

### 3.2 `rit_campus_stops.json`

```json
[
  {
    "stop_id": "RIT-GATE",
    "name": "Main Gate",
    "short_name": "Gate",
    "lat": 13.0097,
    "lng": 80.0040,
    "type": "gate",
    "icon": "🚪",
    "color": "#E63946"
  },
  {
    "stop_id": "RIT-ADMIN",
    "name": "Admin Block",
    "short_name": "Admin",
    "lat": 13.0108,
    "lng": 80.0024,
    "type": "building",
    "icon": "🏛️",
    "color": "#1B263B"
  },
  {
    "stop_id": "RIT-MAIN",
    "name": "Main Block",
    "short_name": "Main Block",
    "lat": 13.0127,
    "lng": 80.0024,
    "type": "building",
    "icon": "🏫",
    "color": "#1B263B"
  },
  {
    "stop_id": "RIT-NGATE",
    "name": "North Gate",
    "short_name": "N. Gate",
    "lat": 13.0165,
    "lng": 80.0036,
    "type": "gate",
    "icon": "🚪",
    "color": "#E63946"
  },
  {
    "stop_id": "RIT-SJB-N",
    "name": "Steve Jobs Block",
    "short_name": "Steve Jobs",
    "lat": 13.0160,
    "lng": 80.0049,
    "type": "building",
    "icon": "💻",
    "color": "#1B263B"
  },
  {
    "stop_id": "RIT-SJB-E",
    "name": "Steve Jobs — East",
    "short_name": "SJB East",
    "lat": 13.0135,
    "lng": 80.0058,
    "type": "building",
    "icon": "💻",
    "color": "#1B263B"
  },
  {
    "stop_id": "RIT-CENT",
    "name": "Central Block",
    "short_name": "Central",
    "lat": 13.0115,
    "lng": 80.0055,
    "type": "building",
    "icon": "🏢",
    "color": "#1B263B"
  }
]
```

### 3.3 `rit_campus_route.json`

```json
{
  "route_id": "RIT-CAMPUS-LOOP",
  "type": "campus_loop",
  "coordinates": [
    [80.0040, 13.0097],
    [80.0038, 13.0099],
    [80.0027, 13.0100],
    [80.0024, 13.0108],
    [80.0023, 13.0118],
    [80.0024, 13.0127],
    [80.0025, 13.0136],
    [80.0027, 13.0148],
    [80.0030, 13.0158],
    [80.0036, 13.0165],
    [80.0043, 13.0164],
    [80.0049, 13.0160],
    [80.0054, 13.0155],
    [80.0057, 13.0143],
    [80.0058, 13.0135],
    [80.0057, 13.0124],
    [80.0055, 13.0115],
    [80.0052, 13.0106],
    [80.0047, 13.0098],
    [80.0043, 13.0094],
    [80.0040, 13.0097]
  ]
}
```

---

## 4. Campus Detection Hook

```javascript
// hooks/useCampusMode.js

import { useState, useEffect } from "react";
import campusBoundary from "../data/rit_campus_boundary.json";

/**
 * Determines if a given lat/lng is inside the RIT campus polygon.
 * Uses ray-casting algorithm — O(n) per check, fine for <30 polygon points.
 */
function pointInPolygon(lat, lng, polygon) {
  const coords = polygon.features[0].geometry.coordinates[0];
  let inside = false;
  let j = coords.length - 1;

  for (let i = 0; i < coords.length; i++) {
    const [xi, yi] = coords[i]; // [lng, lat]
    const [xj, yj] = coords[j];

    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
    j = i;
  }
  return inside;
}

export function useCampusMode(busLat, busLng) {
  const [isOnCampus,  setIsOnCampus]  = useState(false);
  const [campusZone,  setCampusZone]  = useState(null);

  useEffect(() => {
    if (busLat == null || busLng == null) return;

    const onCampus = pointInPolygon(busLat, busLng, campusBoundary);
    setIsOnCampus(onCampus);
    setCampusZone(onCampus ? "RIT" : null);
  }, [busLat, busLng]);

  return { isOnCampus, campusZone };
}
```

---

## 5. Campus Boundary Polygon Component

```jsx
// components/map/CampusBoundaryPolygon.jsx

import { useEffect, useRef } from "react";
import { useMap }            from "react-leaflet";
import L                     from "leaflet";
import campusBoundary        from "../../data/rit_campus_boundary.json";
import { useTheme }          from "../../context/ThemeContext";

export default function CampusBoundaryPolygon({ isHighlighted = false }) {
  const map        = useMap();
  const layerRef   = useRef(null);
  const { theme }  = useTheme();

  const STYLES = {
    normal: {
      color:       "#E6A817",     // campus boundary gold — matches satellite image
      weight:      3,
      opacity:     0.85,
      fillColor:   theme === "dark" ? "#1B263B" : "#F4F6FA",
      fillOpacity: 0.08,
      dashArray:   null,
    },
    highlighted: {
      color:       "#E63946",     // red glow when bus approaches
      weight:      4,
      opacity:     1.0,
      fillColor:   "#E63946",
      fillOpacity: 0.06,
      dashArray:   null,
    },
  };

  useEffect(() => {
    const style = isHighlighted ? STYLES.highlighted : STYLES.normal;

    // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
    const coords = campusBoundary.features[0].geometry.coordinates[0]
      .map(([lng, lat]) => [lat, lng]);

    if (layerRef.current) {
      layerRef.current.setStyle(style);
      return;
    }

    layerRef.current = L.polygon(coords, style)
      .bindTooltip("RIT Campus", {
        permanent:  false,
        direction:  "center",
        className:  "campus-boundary-tooltip",
      })
      .addTo(map);

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, isHighlighted, theme]);

  return null;
}
```

---

## 6. Campus Route Polyline Component

```jsx
// components/map/CampusRoutePolyline.jsx

import { useEffect, useRef } from "react";
import { useMap }            from "react-leaflet";
import L                     from "leaflet";
import campusRoute           from "../../data/rit_campus_route.json";
import { useTheme }          from "../../context/ThemeContext";

export default function CampusRoutePolyline({ visible }) {
  const map      = useMap();
  const ref      = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!visible) {
      if (ref.current) { map.removeLayer(ref.current); ref.current = null; }
      return;
    }

    const coords = campusRoute.coordinates.map(([lng, lat]) => [lat, lng]);

    ref.current = L.polyline(coords, {
      color:     theme === "dark" ? "#FF6B74" : "#E63946",
      weight:    3,
      opacity:   0.80,
      dashArray: "8, 6",      // dashed — signals campus internal, not public road
      lineCap:   "round",
    }).addTo(map);

    return () => {
      if (ref.current) { map.removeLayer(ref.current); ref.current = null; }
    };
  }, [map, visible, theme]);

  return null;
}
```

---

## 7. Campus Stop Markers Component

```jsx
// components/map/CampusStopMarkers.jsx

import { useEffect, useRef } from "react";
import { useMap }            from "react-leaflet";
import L                     from "leaflet";
import campusStops           from "../../data/rit_campus_stops.json";
import { useTheme }          from "../../context/ThemeContext";

function createCampusStopIcon(stop, theme) {
  const bg = theme === "dark" ? "#243347" : "#FFFFFF";

  return L.divIcon({
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    html: `
      <div style="
        width: 32px; height: 32px;
        background: ${bg};
        border: 2px solid ${stop.color};
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 14px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.20);
      ">
        ${stop.icon}
      </div>
    `,
  });
}

export default function CampusStopMarkers({ visible, onStopClick }) {
  const map       = useMap();
  const markersRef = useRef([]);
  const { theme } = useTheme();

  useEffect(() => {
    // Clear old markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    if (!visible) return;

    campusStops.forEach(stop => {
      const icon   = createCampusStopIcon(stop, theme);
      const marker = L.marker([stop.lat, stop.lng], { icon })
        .bindTooltip(stop.name, {
          permanent:  false,
          direction:  "top",
          offset:     [0, -18],
          className:  "campus-stop-tooltip",
        })
        .on("click", () => onStopClick?.(stop))
        .addTo(map);

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach(m => map.removeLayer(m));
      markersRef.current = [];
    };
  }, [map, visible, theme]);

  return null;
}
```

---

## 8. Master Campus Overlay Layer

Wraps all campus components and controls visibility based on bus position and map zoom.

```jsx
// components/map/CampusOverlayLayer.jsx

import { useMapEvents } from "react-leaflet";
import { useState }     from "react";
import CampusBoundaryPolygon from "./CampusBoundaryPolygon";
import CampusRoutePolyline   from "./CampusRoutePolyline";
import CampusStopMarkers     from "./CampusStopMarkers";
import { useCampusMode }     from "../../hooks/useCampusMode";

const CAMPUS_DETAIL_ZOOM = 16;

export default function CampusOverlayLayer({ busLat, busLng, onCampusStopClick }) {
  const [currentZoom,  setCurrentZoom]  = useState(13);
  const { isOnCampus }                  = useCampusMode(busLat, busLng);

  // Track zoom level
  useMapEvents({
    zoomend: (e) => setCurrentZoom(e.target.getZoom()),
  });

  const showDetail   = currentZoom >= CAMPUS_DETAIL_ZOOM;
  const showBoundary = currentZoom >= 14;

  return (
    <>
      {/* Campus boundary — visible at zoom 14+ */}
      {showBoundary && (
        <CampusBoundaryPolygon isHighlighted={isOnCampus} />
      )}

      {/* Internal route dashed line — only when bus is on campus */}
      {isOnCampus && showDetail && (
        <CampusRoutePolyline visible />
      )}

      {/* Stop markers — zoom 16+ */}
      {showDetail && (
        <CampusStopMarkers
          visible
          onStopClick={onCampusStopClick}
        />
      )}
    </>
  );
}
```

---

## 9. Plugging Into MapContainer

```jsx
// components/MapContainer.jsx — UPDATED

import { MapContainer as LeafletMap, TileLayer } from "react-leaflet";
import BusMarkerLayer      from "./map/BusMarkerLayer";
import RoutePolylineLayer  from "./map/RoutePolylineLayer";
import UserLocationDot     from "./map/UserLocationDot";
import CampusOverlayLayer  from "./map/CampusOverlayLayer";  // 🆕
import MapTileLayer        from "./map/MapTileLayer";
import { useBusContext }   from "../../context/BusContext";

export default function MapContainer({ onStopPinTap }) {
  const { activeBus, studentLocation } = useBusContext();

  return (
    <LeafletMap
      center={[13.0500, 80.1200]}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
    >
      {/* Tile layer (theme-aware) */}
      <MapTileLayer />

      {/* City-level route polyline */}
      <RoutePolylineLayer />

      {/* User GPS dot */}
      <UserLocationDot location={studentLocation} />

      {/* Bus marker */}
      <BusMarkerLayer bus={activeBus} />

      {/* 🆕 Campus overlay — boundary + internal route + stop pins */}
      <CampusOverlayLayer
        busLat={activeBus?.lat}
        busLng={activeBus?.lng}
        onCampusStopClick={onStopPinTap}
      />
    </LeafletMap>
  );
}
```

---

## 10. Auto-Zoom to Campus on Entry

When the WebSocket fires a `campus_entry` event, the map animates to campus zoom:

```javascript
// Inside BusContext.js — WebSocket message handler

case "campus_entry":
  setCampusMode(true);

  // Animate map to campus view
  mapRef.current?.flyTo(
    [13.0130, 80.0038],   // campus centroid
    17,                    // campus detail zoom
    { duration: 1.8, easeLinearity: 0.3 }
  );

  // Show toast notification
  showToast("🏫 Bus has entered RIT Campus");
  break;

case "campus_exit":
  setCampusMode(false);

  // Zoom back out to city level
  mapRef.current?.flyTo(
    [13.0500, 80.1200],   // city center
    13,
    { duration: 1.5 }
  );
  break;
```

---

## 11. Campus Tooltip CSS

Add to `index.css` for styled map tooltips:

```css
/* Campus boundary label */
.campus-boundary-tooltip {
  background:   var(--bg-secondary);
  border:       1px solid var(--border);
  border-radius: var(--radius-sm);
  color:        var(--text-primary);
  font-family:  var(--font-headline);
  font-size:    12px;
  font-weight:  700;
  padding:      3px 8px;
  box-shadow:   var(--shadow-card);
  white-space:  nowrap;
}

.campus-boundary-tooltip::before {
  border-top-color: var(--border) !important;
}

/* Campus stop pin tooltip */
.campus-stop-tooltip {
  background:    var(--bg-secondary);
  border:        1px solid var(--border);
  border-radius: var(--radius-sm);
  color:         var(--text-primary);
  font-family:   var(--font-body);
  font-size:     12px;
  font-weight:   500;
  padding:       3px 8px;
  box-shadow:    var(--shadow-card);
}
```

---

## 12. Campus Stop Tap — Modal Behavior (On-Campus Mode)

When a student is **already on campus** and taps a stop pin, the modal switches to walking-only mode:

```
WHEN campus mode is active AND student taps a stop pin:

┌────────────────────────────────────────────────────┐
│  📍  Steve Jobs Block — North                      │
│  ─────────────────────────────────────────────     │
│                                                    │
│  🚌  Bus arrives in    3 min                       │
│  🚶  You reach stop in 6 min                       │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  💡 Walk now — bus arrives before you.       │  │
│  │     Take the next lap or wait at Main Gate.  │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  [📍 Navigate (Google Maps)]   [✕ Close]          │
└────────────────────────────────────────────────────┘
```

**"Navigate" button** deep-links into Google Maps walking directions:
```javascript
const googleMapsUrl =
  `https://www.google.com/maps/dir/?api=1` +
  `&origin=${studentLat},${studentLng}` +
  `&destination=${stop.lat},${stop.lng}` +
  `&travelmode=walking`;

window.open(googleMapsUrl, "_blank");
```

---

## 13. Implementation Checklist

### Data Setup
- [ ] Create `src/data/rit_campus_boundary.json` with GeoJSON polygon
- [ ] Create `src/data/rit_campus_stops.json` with 7 stop entries
- [ ] Create `src/data/rit_campus_route.json` with loop coordinates

### Hooks
- [ ] Create `src/hooks/useCampusMode.js` with point-in-polygon function
- [ ] Test geofence detection with simulator at campus coordinates

### Components
- [ ] Build `CampusBoundaryPolygon.jsx` with gold outline + fill
- [ ] Build `CampusRoutePolyline.jsx` with red dashed line
- [ ] Build `CampusStopMarkers.jsx` with emoji icons + tooltips
- [ ] Build `CampusOverlayLayer.jsx` orchestrating all three
- [ ] Update `MapContainer.jsx` to include `<CampusOverlayLayer />`

### WebSocket
- [ ] Add `campus_entry` handler → `flyTo` campus centroid zoom 17
- [ ] Add `campus_exit` handler → `flyTo` city zoom 13
- [ ] Add `campus_entry` toast notification

### Simulator
- [ ] Update dummy bus simulator to switch to campus loop waypoints on entry
- [ ] Set speed cap to 15 km/h for campus packets
- [ ] Include `campus_zone: "RIT"` and `next_campus_stop` in GPS packets

### CSS
- [ ] Add `.campus-boundary-tooltip` and `.campus-stop-tooltip` to `index.css`

### Validation
- [ ] Open map at zoom 14 — boundary polygon visible ✅
- [ ] Zoom to 16 — stop markers and dashed route appear ✅
- [ ] Simulator enters campus — map flies to zoom 17 ✅
- [ ] Tap a campus stop pin — modal shows correct ETA ✅
- [ ] Dark mode — boundary gold, route red, tooltips themed ✅
