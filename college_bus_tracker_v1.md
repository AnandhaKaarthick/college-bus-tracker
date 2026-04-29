# Project Documentation: Real-Time College Bus Tracking System

## 1. Project Overview
A real-time transit application designed for college campuses to bridge the communication gap between students, drivers, and management. The app focuses on a "Map-First" interface, mimicking the user experience of ride-hailing giants like Uber and Rapido.

### Primary Objectives
* **For Students:** Minimize wait times by providing high-accuracy live locations and ETAs.
* **For Management:** Provide a fleet oversight dashboard with historical data logs for accountability and safety.

---

## 2. Functional Requirements

### A. Student Interface (Rider View)
* **Live Map Tracking:** Real-time visualization of bus movement using a "smooth marker" system.
* **ETA (Estimated Time of Arrival):** Dynamic time calculation based on distance and average route speed.
* **Route Visualization:** Clear overlays of the bus's intended path and stop markers.
* **Geofence Alerts:** Push notifications or alerts when the bus is within a specific radius (e.g., 1km) of the student's stop.
* **Driver Information:** Access to driver contact details for emergencies or missed stops.

### B. Management Interface (Admin Dashboard)
* **Fleet Oversight:** A sidebar or list view showing all active buses and their current status (On-track, Delayed, Idle).
* **Location History (Minute-by-Minute):** A database-driven record of exactly where a particular bus was at any given time.
* **Breadcrumb Trails:** Visual map path showing the actual route taken by a bus in the last hour/day.
* **Telemetry Monitoring:** Real-time speed and stationary time monitoring to ensure driver safety and efficiency.
* **Emergency Alerts:** A centralized notification system for bus breakdowns or delays.

---

## 3. Technical Architecture (Proposed)

| Layer | Technology | Reason for Selection |
| :--- | :--- | :--- |
| **Frontend** | React.js & Tailwind CSS | Rapid development of modern, responsive, and mobile-first UI components. |
| **Backend** | FastAPI (Python) | High-performance asynchronous framework ideal for handling multiple WebSocket connections. |
| **Database** | MySQL | Robust handling of structured data (Student IDs, Schedules) and historical logs. |
| **Real-Time Layer**| WebSockets | Low-latency, two-way communication for live GPS updates (vs. slow HTTP polling). |
| **Map Engine** | Leaflet / Mapbox | Flexible map rendering with support for custom tiles and marker animation. |

---

## 4. Implementation Strategy & "Pro-Tips"

### Real-Time GPS Logistics
* **Data Collection:** GPS data is collected via mobile browsers on the driver's device.
* **Screen Wake Lock API:** Use this to prevent the driver's phone from "sleeping" or pausing GPS transmission when the browser tab is in the background.
* **Snap-to-Road Logic:** Use map-matching algorithms to ensure the bus icon stays on the road rather than "teleporting" through buildings due to GPS jitter.
* **Marker Interpolation:** Use plugins like `Leaflet.MovingMarker` to slide the bus icon smoothly between coordinate updates for a "Rapido" feel.

### Database Optimization
* **Dual Table Strategy:**
    * **Live Table:** Stores only the *current* lat/long for each bus (updated every 3-5 seconds).
    * **Logs Table:** Stores historical coordinates for management playback (archived periodically).
* **Indexing:** Essential indexing on `bus_id` and `timestamp` columns to ensure historical queries remain fast.

---

## 5. Prototype Tools (Free/Student Tier)
To build a functional prototype without a credit card or high costs:

* **Leaflet + OpenStreetMap (OSM):** 100% free open-source map tiles and engine.
* **LocationIQ:** Provides 5,000 free requests/day for Geocoding and Routing (ETA) without a credit card.
* **OSRM (Open Source Routing Machine):** For free route calculations and distance data.
* **Maptiler:** Offers a generous free tier for "Dark Mode" or custom-styled map tiles to get that premium app look.

---

## 6. Innovative Features Roadmap
* **Occupancy Sensing:** A simple "Low / Medium / Full" toggle for drivers so students know if the bus has available seating.
* **Crowdsourced Check-ins:** Allow students on the bus to "verify" the location if the driver's GPS fails.
* **Panic Button:** Immediate GPS-tagged alert to campus security for both students and drivers.
* **Historical Playback:** A "Time Machine" feature for management to re-watch a bus route from a specific date.
