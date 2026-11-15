# 🚌 College Bus Tracker Map
### Real-Time Fleet & Campus Transit Intelligence System
**Executive One-Pager | Project Summary & Impact Document**

---

## 1. Problem Statement
Every day, thousands of students and faculty experience severe commute friction due to a complete lack of visibility into institutional transit schedules:
* **Commuter Anxiety & Lost Time:** Students endure prolonged, unpredictable wait times at bus stops with zero real-time location data, frequently leading to missed classes and safety risks during early-morning or late-evening commutes.
* **Administrative Blind Spots:** Fleet managers have no automated mechanisms to verify whether buses run on schedule, adhere to designated routes, or experience mechanical breakdowns and traffic bottlenecks.
* **Emergency Response Delays:** In instances of accidents, route deviations, or medical emergencies, communication is manual, fragmented, and slow.
* **Environmental & Resource Inefficiencies:** Inefficient route allocation and vehicle idling result in excessive fuel consumption and carbon emissions, while unreliable buses force students to rely on private two-wheelers and cabs, worsening localized congestion.

---

## 2. The Solution
**College Bus Tracker Map** is a full-stack, zero-hardware-cost transit platform designed with a **"Map-First"** philosophy—bringing the seamless experience of consumer ride-hailing platforms (like Uber) into institutional transit operations.

The ecosystem connects three distinct stakeholders into a single unified platform:
* **👨‍🎓 Student Rider Interface (Mobile-First):** Live interactive map featuring smooth coordinate interpolation (eliminating GPS jump/jitter), accurate dynamic ETAs calculated via OSRM, route path overlays, geofence radius arrival alerts, and bus attendance check-ins.
* **🚛 Driver Telemetry Portal (Zero-Install Browser App):** Lightweight mobile web console utilizing the HTML5 Geolocation API and Screen Wake Lock API to broadcast real-time GPS coordinates, speed, and status without requiring expensive custom GPS hardware. Includes an integrated one-tap **SOS Emergency Hub**.
* **📊 Administrative Command Center (Desktop Dashboard):** Centralized oversight system displaying active fleet statuses, minute-by-minute historical route playback ("Time Machine"), ridership density heatmaps, and predictive accuracy tracking using Mean Absolute Error (MAE) and Root Mean Squared Error (RMSE) metrics.

**Core Technology Stack:**
* **Frontend:** React 19, Vite, Tailwind CSS v4, Leaflet.js, React-Leaflet, Framer Motion, Lucide React.
* **Backend:** Python (FastAPI), WebSockets (sub-second bi-directional streaming), SQLAlchemy, SQLite / MySQL.
* **Routing & Spatial Services:** OSRM (Open Source Routing Machine), OpenStreetMap (OSM).

---

## 3. UN Sustainable Development Goals (SDGs) Alignment

| SDG Goal | Target Alignment | Direct Project Contribution |
| :--- | :--- | :--- |
| **SDG 11: Sustainable Cities & Communities** *(Primary)* | **Target 11.2:** Safe, accessible, and sustainable public transit systems for all. | Transforms fragmented campus shuttle services into reliable shared transit, reducing private vehicle dependency and optimizing campus mobility. |
| **SDG 9: Industry, Innovation & Infrastructure** | **Target 9.1 & 9.c:** Resilient digital infrastructure & widespread ICT access. | Demonstrates cost-effective digital infrastructure using open-source mapping, WebSockets, and commodity smartphones instead of proprietary telematics. |
| **SDG 13: Climate Action** | **Target 13.2:** Integration of climate change measures and emission reduction. | Decreases vehicle idle times and empty runs through ridership heatmaps and optimized scheduling, cutting localized CO₂ emissions. |
| **SDG 4: Quality Education** | **Target 4.a:** Safe, inclusive, and effective learning environments. | Removes transportation uncertainty as a barrier to education, ensuring punctual arrival for lectures, lab sessions, and exams. |
| **SDG 3: Good Health & Well-Being** | **Target 3.6:** Prevention of road traffic incidents and enhanced safety. | Real-time driver speed tracking, route deviation detection, and immediate GPS-tagged SOS alerts to campus security. |

---

## 4. Expected Project Outcomes & Impact

1. **Measurable Transit Efficiency:**
   * **Wait-Time Reduction:** Reduces student waiting time at bus stops by an estimated **60–80%** through accurate, dynamic ETAs and geofenced proximity alerts.
   * **Sub-Second Telemetry:** Delivers live bus location updates with **< 2-second latency** over lightweight WebSocket connections.
2. **Zero-Hardware Capital Expenditure (CapEx):**
   * Eliminates the need for expensive onboard GPS trackers ($100–$250 per vehicle) by turning existing driver smartphones into smart telemetry beacons.
3. **Data-Driven Fleet Optimization:**
   * Empowers campus administrators to reallocate buses to high-demand stops based on historical ridership heatmaps, eliminating bus overcrowding and empty runs.
4. **Enhanced Student & Driver Safety:**
   * Establishes a verified digital audit trail of vehicle movements and guarantees instantaneous emergency broadcast capabilities for accidents or breakdowns.
5. **Environmental Sustainability:**
   * Lowers campus commuter carbon footprint by incentivizing collective transit adoption over private motorized vehicles.

---
*Developed by Anandha Kaarthick S & Team | [GitHub Repository](https://github.com/AnandhaKaarthick/college-bus-tracker)*
