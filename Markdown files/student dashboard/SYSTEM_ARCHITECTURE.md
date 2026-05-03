# SYSTEM ARCHITECTURE
## Real-Time College Bus Tracking System

---

## 1. High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│                                                                  │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │  Student App    │  │   Driver App      │  │  Admin Panel  │  │
│  │  (React.js)     │  │  (Mobile Browser) │  │  (React.js)   │  │
│  │  Leaflet Map    │  │  Geolocation API  │  │  Dashboard    │  │
│  └────────┬────────┘  └────────┬─────────┘  └──────┬────────┘  │
└───────────┼─────────────────────┼───────────────────┼───────────┘
            │                     │                   │
            │     HTTPS / WSS     │                   │
            ▼                     ▼                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                        BACKEND LAYER                             │
│                                                                  │
│   ┌───────────────────────────────────────────────────────────┐  │
│   │               FastAPI Application Server                  │  │
│   │                                                           │  │
│   │  ┌────────────────┐   ┌──────────────────────────────┐   │  │
│   │  │  REST Router   │   │    WebSocket Manager         │   │  │
│   │  │  /auth         │   │    - Driver GPS ingestion    │   │  │
│   │  │  /buses        │   │    - Student broadcast       │   │  │
│   │  │  /routes       │   │    - Admin telemetry         │   │  │
│   │  │  /history      │   │    - Geofence evaluation     │   │  │
│   │  │  /alerts       │   └──────────────────────────────┘   │  │
│   │  └────────────────┘                                       │  │
│   │                                                           │  │
│   │  ┌────────────────────────────────────────────────────┐   │  │
│   │  │             Background Task Runner                 │   │  │
│   │  │  - Archive live positions → logs table (60s tick) │   │  │
│   │  │  - Idle bus detection (speed = 0 for > 5 min)     │   │  │
│   │  │  - Push notification dispatcher                   │   │  │
│   │  └────────────────────────────────────────────────────┘   │  │
│   └───────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
            │                     │                   │
            ▼                     ▼                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                               │
│                                                                  │
│   ┌──────────────────────────┐   ┌────────────────────────────┐  │
│   │    MySQL Database        │   │    External Services       │  │
│   │                          │   │                            │  │
│   │  • users                 │   │  ┌──────────────────────┐  │  │
│   │  • buses                 │   │  │ OSRM (Routing/ETA)   │  │  │
│   │  • routes                │   │  └──────────────────────┘  │  │
│   │  • stops                 │   │  ┌──────────────────────┐  │  │
│   │  • bus_live_positions ⚡ │   │  │ LocationIQ (Geocode) │  │  │
│   │  • bus_location_logs 📦  │   │  └──────────────────────┘  │  │
│   │  • alerts                │   │  ┌──────────────────────┐  │  │
│   │  • student_stop_prefs    │   │  │ OpenStreetMap Tiles  │  │  │
│   └──────────────────────────┘   │  └──────────────────────┘  │  │
│                                  │  ┌──────────────────────┐  │  │
│                                  │  │ Maptiler (Dark Tiles)│  │  │
│                                  │  └──────────────────────┘  │  │
│                                  └────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Real-Time Data Flow

```
Driver Phone (GPS)
        │
        │  WebSocket (gps_update message, every 3–5s)
        ▼
FastAPI WebSocket Manager
        │
        ├──► [Write] bus_live_positions (upsert)
        │
        ├──► [Geofence Check] — is bus within radius of any subscribed stop?
        │           │
        │           └──► YES: dispatch push notification to matching students
        │
        └──► [Broadcast] bus_position message to all watching students
                    │
                    ▼
           Student App (Leaflet Map)
                    │
                    └──► Marker interpolates smoothly to new coordinates
```

---

## 3. Archival Pipeline

```
FastAPI Background Task (every 60 seconds)
        │
        ▼
SELECT all rows from bus_live_positions
        │
        ▼
INSERT into bus_location_logs with current timestamp
        │
        ▼
Admin can now query historical data for any time range
        │
        ▼
Logs older than 90 days → export to CSV / cold storage
```

---

## 4. Component Responsibilities

| Component | Responsibility |
|-----------|---------------|
| **React (Student)** | Render Leaflet map, consume WebSocket, show ETA/alerts |
| **React (Admin)** | Fleet sidebar, breadcrumb layers, historical playback UI |
| **Mobile Browser (Driver)** | GPS capture, Wake Lock, occupancy toggle, panic button |
| **FastAPI REST** | Auth, CRUD for buses/routes, history queries, alert management |
| **FastAPI WebSocket** | Real-time GPS ingestion, broadcast, geofence evaluation |
| **Background Task** | Log archival, idle detection, push notification dispatch |
| **MySQL (Live Table)** | Single-row per bus, ultra-fast GPS upsert reads |
| **MySQL (Log Table)** | Append-only archive, indexed for time-range history queries |
| **OSRM** | Calculate road-distance and ETA between bus and stop |
| **LocationIQ** | Reverse geocoding (coordinates → human-readable address) |
| **Leaflet + OSM** | Free, open-source map rendering |
| **Maptiler** | Dark-mode custom tile overlay for premium UI feel |

---

## 5. GPS Data Lifecycle

```
[Raw GPS from Device]
        │
        ▼
[Snap-to-Road via Map Matching]   ← removes GPS jitter / building teleports
        │
        ▼
[WebSocket → FastAPI]
        │
        ├──► [bus_live_positions: upsert current]   ← always fresh, 1 row/bus
        │
        └──► [bus_location_logs: archived every 60s] ← permanent record
                    │
                    ▼
            [Admin Breadcrumb / Historical Playback]
```

---

## 6. Security Architecture

| Concern | Mechanism |
|---------|-----------|
| Authentication | JWT Bearer tokens, 24h expiry |
| Role enforcement | FastAPI `Depends()` role guards on every endpoint |
| WebSocket auth | JWT passed as query param on connection |
| Driver GPS trust | Only authenticated driver tokens can push GPS to their assigned bus |
| Admin isolation | History and telemetry endpoints require `role == admin` |
| Panic alert trust | Both driver and student tokens can trigger alerts |

---

## 7. Scalability Considerations (Future)

| Bottleneck | Mitigation |
|-----------|------------|
| Many concurrent WebSocket connections | Horizontal scaling with Redis Pub/Sub as shared broker |
| Heavy history queries | MySQL partitioning by month on `bus_location_logs` |
| Push notification volume | Queue via Celery + Redis for async dispatch |
| Map tile rate limits | Self-host OSM tiles via `tileserver-gl` for large campus fleets |
| GPS storage growth | Auto-archive policy: compress logs older than 30 days |

---

## 8. Prototype Deployment (Free Tier)

| Service | Tool | Cost |
|---------|------|------|
| Frontend hosting | Vercel / Netlify | Free |
| Backend hosting | Render.com / Railway | Free tier |
| MySQL database | PlanetScale / Railway MySQL | Free tier |
| Map tiles | OpenStreetMap + Maptiler | Free |
| Routing | OSRM public instance | Free |
| Geocoding | LocationIQ | 5,000 req/day free |
| Push notifications | Firebase Cloud Messaging (FCM) | Free |
