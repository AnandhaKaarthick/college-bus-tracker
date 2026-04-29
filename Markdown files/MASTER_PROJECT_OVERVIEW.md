# MASTER PROJECT OVERVIEW
## Real-Time College Bus Tracking System

---

### Vision Statement

A real-time transit application designed for college campuses to bridge the communication gap between students, drivers, and management. The app adopts a **"Map-First"** interface philosophy, mirroring the experience of ride-hailing platforms like Uber and Rapido — making bus tracking feel instant, familiar, and reliable.

---

### Problem Statement

College bus systems suffer from:
- Zero visibility into bus location for waiting students
- No accountability mechanism for management to track driver behavior
- Communication breakdowns during emergencies or delays
- Wasted time at bus stops due to unpredictable ETAs

---

### Solution Summary

A three-sided platform with role-based interfaces:

| Role | Interface | Core Need |
|------|-----------|-----------|
| **Student** | Rider View (Mobile-first) | Know exactly when the bus arrives |
| **Driver** | Driver App (Mobile browser) | Broadcast live GPS with minimal friction |
| **Admin** | Dashboard (Desktop) | Oversee fleet, logs, and emergencies |

---

### Primary Objectives

- **For Students:** Minimize wait times via high-accuracy live locations and ETAs
- **For Drivers:** Simple, low-friction GPS broadcasting from a mobile browser
- **For Management:** Fleet oversight dashboard with historical data logs for accountability and safety

---

### Key Differentiators

1. **Smooth Marker Animation** — Bus icon glides across the map (no teleporting)
2. **Geofence Alerts** — Push notifications when the bus is 1 km away
3. **Dual Table DB Strategy** — Separate live and historical tables for performance
4. **Prototype-Ready Stack** — Fully functional with free/student-tier tools
5. **Innovative Roadmap** — Panic button, occupancy sensing, crowdsourced check-ins

---

### Tech Stack at a Glance

| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Tailwind CSS |
| Backend | FastAPI (Python) |
| Database | MySQL |
| Real-Time | WebSockets |
| Maps | Leaflet + OpenStreetMap |
| Routing/ETA | OSRM + LocationIQ |

---

### Project Phases

| Phase | Milestone | Target |
|-------|-----------|--------|
| 1 | Prototype (Student View + Live GPS) | Month 1 |
| 2 | Admin Dashboard + Historical Logs | Month 2 |
| 3 | Alerts, Notifications, Driver App Polish | Month 3 |
| 4 | Innovative Features (Panic Button, Occupancy) | Month 4+ |

---

### Stakeholders

- **Students** — Primary end users
- **Bus Drivers** — GPS data providers
- **College Management / Admin** — Fleet operators and safety monitors
- **Campus Security** — Panic alert recipients

---

### Success Metrics

- Reduction in average student wait time at stops
- 95%+ GPS uptime during active bus hours
- Sub-5-second location update latency
- Zero missed emergency alerts
