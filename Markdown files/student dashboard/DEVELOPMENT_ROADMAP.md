# DEVELOPMENT ROADMAP
## Real-Time College Bus Tracking System

---

## Overview

| Phase | Name | Duration | Goal |
|-------|------|----------|------|
| **Phase 1** | Foundation & Live Tracking | Weeks 1–3 | Core GPS pipeline working end-to-end |
| **Phase 2** | Student Experience | Weeks 4–5 | Full student-facing UI with alerts |
| **Phase 3** | Admin Dashboard | Weeks 6–7 | Fleet management + historical data |
| **Phase 4** | Driver App Polish | Week 8 | Stable driver broadcasting experience |
| **Phase 5** | Innovative Features | Weeks 9–12 | Panic button, occupancy, crowdsourcing |
| **Phase 6** | Testing & Launch | Weeks 13–14 | QA, campus pilot, feedback loop |

---

## Phase 1 — Foundation & Live Tracking
**Weeks 1–3**

### Backend
- [ ] Initialize FastAPI project structure with folder layout
- [ ] Set up MySQL database with all tables from schema
- [ ] Implement JWT authentication (`/auth/login`, `/auth/logout`)
- [ ] Create `GET /buses` and `GET /buses/{bus_id}` REST endpoints
- [ ] Build WebSocket endpoint (`/ws/live`) for GPS ingestion
- [ ] Implement `bus_live_positions` upsert logic
- [ ] Add background archival task → `bus_location_logs` (60s tick)
- [ ] Seed database with sample routes, stops, and buses

### Frontend (Driver)
- [ ] Scaffold React app with Tailwind CSS
- [ ] Build driver login page
- [ ] Implement Geolocation API GPS capture in browser
- [ ] Implement Screen Wake Lock API integration
- [ ] Connect driver to WebSocket, send GPS messages every 3–5s
- [ ] Build "Start Trip / End Trip" toggle UI

### Infrastructure
- [ ] Deploy backend to Render.com or Railway (free tier)
- [ ] Deploy frontend to Vercel
- [ ] Set up PlanetScale or Railway MySQL instance
- [ ] Configure CORS and environment variables

**Milestone:** Driver opens browser → GPS broadcasts → coordinates visible in DB ✅

---

## Phase 2 — Student Experience
**Weeks 4–5**

### Frontend (Student)
- [ ] Build home screen with full-screen Leaflet map
- [ ] Integrate OpenStreetMap tiles (free)
- [ ] Add Maptiler dark mode tile layer option
- [ ] Connect student to WebSocket, receive `bus_position` messages
- [ ] Render animated bus markers using `Leaflet.MovingMarker`
- [ ] Draw route polylines and stop markers on map
- [ ] Build draggable bottom sheet: bus name, status badge, ETA
- [ ] Implement OSRM API call for real-time ETA calculation
- [ ] Build stop selection screen with route dropdown
- [ ] Build driver contact modal (name + phone)
- [ ] Implement geofence alert logic on the backend
- [ ] Register student push token → Firebase Cloud Messaging
- [ ] Test push notification on geofence trigger

**Milestone:** Student opens app → sees live bus → receives notification when bus is 1 km away ✅

---

## Phase 3 — Admin Dashboard
**Weeks 6–7**

### Frontend (Admin)
- [ ] Build sidebar layout with bus list and StatusPill components
- [ ] Real-time fleet status updates via WebSocket telemetry messages
- [ ] Clickable bus cards → map centers + telemetry panel opens
- [ ] Display speed, heading, idle time, last-updated timestamp
- [ ] Implement `GET /history/{bus_id}` query with date/time picker
- [ ] Render breadcrumb trail as fading Leaflet polyline
- [ ] Build Historical Playback UI with Play/Pause/Scrub controls
- [ ] Animate bus replay at 10× speed using recorded coordinates
- [ ] Build emergency alerts panel with active alert banners
- [ ] Admin `PATCH` to acknowledge/resolve alerts

**Milestone:** Admin views all buses live, replays any past route, manages alerts ✅

---

## Phase 4 — Driver App Polish
**Week 8**

- [ ] Improve driver dashboard UI/UX (clean, dark, minimal)
- [ ] Add occupancy toggle (Low / Medium / Full) with backend sync
- [ ] Handle GPS loss gracefully — show warning, retry automatically
- [ ] Handle WebSocket disconnection with auto-reconnect logic
- [ ] Test Wake Lock behavior across Chrome Android versions
- [ ] Snap-to-road integration (OSRM map matching endpoint)
- [ ] Add "Delay Report" button — sends delay alert to admin

**Milestone:** Driver app is stable, handles edge cases, looks professional ✅

---

## Phase 5 — Innovative Features
**Weeks 9–12**

### Week 9 — Panic Button
- [ ] Build 🔴 Panic Button component with confirmation modal
- [ ] Backend: `POST /alerts/panic` with GPS tagging
- [ ] Push alert to admin dashboard in real time
- [ ] Notify campus security contact via email/SMS (Twilio free tier)
- [ ] Show GPS pin on admin map at panic location

### Week 10 — Crowdsourced Check-ins
- [ ] Build "Verify Location" prompt when bus GPS is stale (>30s)
- [ ] `POST /buses/{bus_id}/checkin` endpoint
- [ ] Average coordinates from 2+ check-ins → broadcast as fallback
- [ ] Auto-revert to driver GPS when it recovers

### Week 11 — Occupancy Display for Students
- [ ] Student map: show Low / Medium / Full badge on bus card
- [ ] Color-coded bus icon: green (low) → yellow (med) → red (full)
- [ ] Update in real time via WebSocket broadcast

### Week 12 — Historical Playback Enhancements
- [ ] CSV export of historical route data
- [ ] Playback speed controls (5× / 10× / 20×)
- [ ] Timestamp tooltip on path click
- [ ] Idle time highlighted as red segment in breadcrumb

**Milestone:** All innovative features live and demo-ready ✅

---

## Phase 6 — Testing & Launch
**Weeks 13–14**

### Testing
- [ ] Unit tests for all FastAPI endpoints (pytest)
- [ ] WebSocket load test — simulate 20 concurrent drivers
- [ ] End-to-end test: GPS → WebSocket → map update latency < 5s
- [ ] Mobile browser testing: Chrome Android, Safari iOS
- [ ] Admin dashboard cross-browser testing (Chrome, Firefox, Edge)
- [ ] Geofence alert accuracy testing on campus grounds

### Launch
- [ ] Campus pilot with 2–3 real buses and volunteer drivers
- [ ] Student feedback form embedded in app
- [ ] Monitor DB growth: alert if logs table > 500k rows
- [ ] Write post-pilot report with metrics

**Milestone:** Live campus pilot running with real users ✅

---

## Tech Debt / Backlog (Post-Launch)

- [ ] Redis Pub/Sub for multi-instance WebSocket scaling
- [ ] Rate limiting middleware on all endpoints
- [ ] MySQL table partitioning by month on `bus_location_logs`
- [ ] Self-hosted OSM tile server for offline resilience
- [ ] Native mobile apps (React Native) for push notification reliability
- [ ] CI/CD pipeline (GitHub Actions → auto-deploy to Render)
- [ ] Centralized logging (Loki / Grafana free tier)
