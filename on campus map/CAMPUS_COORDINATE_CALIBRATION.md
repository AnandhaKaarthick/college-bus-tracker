# CAMPUS_COORDINATE_CALIBRATION.md
## How to Precisely Extract & Verify RIT Campus Coordinates
### Calibrating the Satellite Image to Real-World GPS Points

> **Why this file exists:** The coordinates in `RIT_CAMPUS_MAP_SPEC.md` are carefully estimated from the satellite and road-map images provided. Before going live, every coordinate must be **ground-truthed** against real GPS readings. This file gives you the exact method to do that — using free tools, no code required.

---

## 1. The Calibration Problem

The images you shared are screenshots from Google Maps / satellite view. They are accurate in shape but the exact lat/lng values for specific points (like the Steve Jobs Block entrance or the Admin Block) need to be extracted properly.

**Two methods — both free:**

| Method | Accuracy | Time | Best For |
|--------|----------|------|---------|
| A. Google Maps right-click | ±2m | 5 min | Quick boundary + stop points |
| B. Walk the campus with GPS | ±1m | 30 min | Final production accuracy |
| C. OSRM snap verification | ±5m | 10 min | Road-snapped route points |

---

## 2. Method A — Google Maps Right-Click (Quick)

### Step-by-step:

**Step 1:** Open [maps.google.com](https://maps.google.com)

**Step 2:** Search `"Rajalakshmi Institute of Technology, Kuthambakkam"`

**Step 3:** Zoom to satellite view — switch to satellite in bottom-left

**Step 4:** For each stop/boundary point, **right-click exactly on the spot**

**Step 5:** Google shows coordinates at the top of the context menu — click to copy

```
Example right-click result:
  13.0127° N, 80.0024° E    ← this is your lat, lng
```

**Step 6:** Paste into the appropriate waypoint in `rit_campus_stops.json`

### Points to calibrate in priority order:

| Priority | Point | How to Find It |
|----------|-------|----------------|
| 🔴 1 | Main Gate (entry road) | The vehicle gate visible at south end |
| 🔴 2 | RIT Main Block entrance | The main building front porch visible in satellite |
| 🔴 3 | Steve Jobs Block front | NE quadrant — large building labeled in image 1 |
| 🟡 4 | North-West corner of boundary | Where the road bends at north-west |
| 🟡 5 | North-East corner of boundary | Where the road bends at north-east |
| 🟢 6 | Admin Block entrance | South-west area building |
| 🟢 7 | Central Academic Block | Middle-east building cluster |

---

## 3. Method B — Walk the Campus (Most Accurate)

Walk the actual internal bus route with your phone's GPS app open. Use **"GPS Logger"** (Android, free) or **"GPS Tracker - Route Recorder"** (iOS).

### Walk sequence:

```
START at Main Gate
→ Walk LEFT (west) along the south perimeter
→ Walk NORTH along the west boundary
→ Pause at each building entrance — mark a waypoint
→ Walk along north perimeter heading EAST
→ Walk SOUTH along east boundary
→ Return to Main Gate
STOP recording
```

### Export & use:

1. Export the recorded track as **GPX** or **GeoJSON**
2. Open in [geojson.io](https://geojson.io) — see your path on the map
3. Extract individual coordinates from the GeoJSON coordinates array
4. Replace the estimated values in `rit_campus_route.json`

---

## 4. Method C — OSRM Snap to Road

After getting approximate coordinates, pass them through OSRM to ensure they snap to the actual road network (prevents the bus marker from floating off-road).

### API call for each segment:

```
GET http://router.project-osrm.org/nearest/v1/driving/{lng},{lat}
```

**Example — snap Main Gate coordinate:**
```
GET http://router.project-osrm.org/nearest/v1/driving/80.0040,13.0097

Response:
{
  "waypoints": [{
    "location": [80.0041, 13.0098],   ← use THIS snapped coordinate
    "name": "Sennerkuppam–Kuthambakkam Road"
  }]
}
```

Replace the original estimate with the snapped value.

---

## 5. Campus Boundary Verification Tool

Paste your extracted boundary coordinates here to verify visually before deploying:

**Tool:** [geojson.io](https://geojson.io)

1. Go to geojson.io
2. Click **{} JSON** in the top right panel
3. Paste this template and replace coordinates with your calibrated values:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [80.0024, 13.0158],
          [80.0028, 13.0165],
          [80.0033, 13.0168],
          [YOUR CALIBRATED POINTS HERE],
          [80.0024, 13.0158]
        ]]
      },
      "properties": { "name": "RIT Boundary" }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "MultiPoint",
        "coordinates": [
          [80.0040, 13.0097],
          [80.0024, 13.0108],
          [80.0024, 13.0127],
          [80.0036, 13.0165],
          [80.0049, 13.0160],
          [80.0058, 13.0135],
          [80.0055, 13.0115]
        ]
      },
      "properties": { "name": "Campus Stops" }
    }
  ]
}
```

4. The polygon and stop dots will render on the map
5. Drag points to correct positions visually
6. Export corrected GeoJSON

---

## 6. Coordinate Calibration Sheet

Use this table to record ground-truthed coordinates as you collect them.
Replace the estimated values in the JSON files once confirmed.

| Point | Estimated Lat | Estimated Lng | Calibrated Lat | Calibrated Lng | Method Used | Verified |
|-------|-------------|-------------|---------------|---------------|-------------|---------|
| Main Gate | 13.0097 | 80.0040 | ___ | ___ | ___ | ☐ |
| Admin Block | 13.0108 | 80.0024 | ___ | ___ | ___ | ☐ |
| Main Block | 13.0127 | 80.0024 | ___ | ___ | ___ | ☐ |
| North Gate | 13.0165 | 80.0036 | ___ | ___ | ___ | ☐ |
| Steve Jobs N | 13.0160 | 80.0049 | ___ | ___ | ___ | ☐ |
| Steve Jobs E | 13.0135 | 80.0058 | ___ | ___ | ___ | ☐ |
| Central Block | 13.0115 | 80.0055 | ___ | ___ | ___ | ☐ |
| Boundary NW | 13.0148 | 80.0027 | ___ | ___ | ___ | ☐ |
| Boundary NE | 13.0155 | 80.0054 | ___ | ___ | ___ | ☐ |
| Boundary SW | 13.0100 | 80.0027 | ___ | ___ | ___ | ☐ |
| Boundary SE | 13.0098 | 80.0047 | ___ | ___ | ___ | ☐ |

---

## 7. Simulator Calibration Test

After updating coordinates, run this quick simulator test to verify the campus route looks correct on the map:

```bash
# Run single bus in campus-only mode
python main.py \
  --bus BUS-04 \
  --campus-only \
  --route data/rit_campus_route.json \
  --interval 1 \
  --verbose
```

**What to watch for in the React map:**
- ✅ Bus icon stays on the road (not cutting through buildings)
- ✅ Bus follows the perimeter loop anti-clockwise
- ✅ Bus pauses at each stop for the correct dwell time
- ✅ Campus boundary polygon matches the actual campus shape
- ✅ Stop pins appear at the correct building entrances

---

## 8. Common Calibration Mistakes to Avoid

| Mistake | Problem | Fix |
|---------|---------|-----|
| Using building center coordinates | Bus appears to drive through buildings | Use the road adjacent to the building entrance |
| Copying lat/lng in wrong order | Bus appears in ocean | Google Maps shows "lat, lng" — Leaflet wants `[lat, lng]`, GeoJSON wants `[lng, lat]` |
| Not closing the polygon | Boundary renders as open line | First and last coordinate must be identical |
| Skip OSRM snap | Bus floats off-road | Always run nearest-point snap for route waypoints |
| Single test at zoom 13 | Looks fine until zoom 17 | Always verify at zoom 16–18 where precision matters |
