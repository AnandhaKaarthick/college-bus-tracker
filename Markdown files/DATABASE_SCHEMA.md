# DATABASE SCHEMA
## Real-Time College Bus Tracking System

**RDBMS:** MySQL 8.x  
**Character Set:** `utf8mb4`  
**Collation:** `utf8mb4_unicode_ci`

---

## 1. Entity Relationship Overview

```
users ──────────── drivers (1:1)
                      │
buses ────────────────┘  (driver_id FK)
  │
  ├─── routes (1:1 active route)
  │       └─── stops (1:N)
  │
  ├─── bus_live_positions (1:1 live snapshot)
  ├─── bus_location_logs (1:N historical)
  └─── alerts (1:N)
```

---

## 2. Table Definitions

---

### 2.1 `users`

Stores all system users: students, drivers, and admins.

```sql
CREATE TABLE users (
    user_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100)        NOT NULL,
    email         VARCHAR(150)        NOT NULL UNIQUE,
    password_hash VARCHAR(255)        NOT NULL,
    role          ENUM('student', 'driver', 'admin') NOT NULL,
    phone         VARCHAR(20),
    created_at    DATETIME            DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME            DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Indexes:** `email` (UNIQUE), `role`

---

### 2.2 `buses`

Registered campus buses with their assigned route and driver.

```sql
CREATE TABLE buses (
    bus_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    vehicle_number VARCHAR(20)  NOT NULL UNIQUE,
    route_id       INT UNSIGNED,
    driver_id      INT UNSIGNED UNIQUE,
    status         ENUM('on_track', 'delayed', 'idle', 'offline') DEFAULT 'offline',
    occupancy      ENUM('low', 'medium', 'full')                  DEFAULT 'low',
    is_active      BOOLEAN                                         DEFAULT TRUE,
    created_at     DATETIME     DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (route_id)  REFERENCES routes(route_id)  ON DELETE SET NULL,
    FOREIGN KEY (driver_id) REFERENCES users(user_id)    ON DELETE SET NULL
);
```

---

### 2.3 `routes`

Predefined campus bus routes.

```sql
CREATE TABLE routes (
    route_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    route_name  VARCHAR(100) NOT NULL,
    description TEXT,
    is_active   BOOLEAN      DEFAULT TRUE,
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP
);
```

---

### 2.4 `stops`

Individual stops along a route, ordered sequentially.

```sql
CREATE TABLE stops (
    stop_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    route_id   INT UNSIGNED NOT NULL,
    stop_name  VARCHAR(100) NOT NULL,
    lat        DECIMAL(10, 7) NOT NULL,
    lng        DECIMAL(10, 7) NOT NULL,
    stop_order TINYINT UNSIGNED NOT NULL,
    geofence_radius_m INT UNSIGNED DEFAULT 1000,

    FOREIGN KEY (route_id) REFERENCES routes(route_id) ON DELETE CASCADE,
    INDEX idx_route_order (route_id, stop_order)
);
```

---

### 2.5 `bus_live_positions` ⚡ (Hot Table)

Stores only the **current** position of each bus. Updated every 3–5 seconds.  
This table is always a single row per bus for maximum read speed.

```sql
CREATE TABLE bus_live_positions (
    bus_id      INT UNSIGNED PRIMARY KEY,
    lat         DECIMAL(10, 7) NOT NULL,
    lng         DECIMAL(10, 7) NOT NULL,
    speed_kmh   DECIMAL(5, 2)  DEFAULT 0,
    heading_deg SMALLINT       DEFAULT 0,
    updated_at  DATETIME(3)    DEFAULT CURRENT_TIMESTAMP(3)
                ON UPDATE CURRENT_TIMESTAMP(3),

    FOREIGN KEY (bus_id) REFERENCES buses(bus_id) ON DELETE CASCADE
);
```

**Strategy:** Use `INSERT ... ON DUPLICATE KEY UPDATE` for upsert behavior.

---

### 2.6 `bus_location_logs` 📦 (Cold/Archive Table)

Stores minute-by-minute historical GPS data for every bus. Used for admin playback and breadcrumb trails.

```sql
CREATE TABLE bus_location_logs (
    log_id      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    bus_id      INT UNSIGNED   NOT NULL,
    lat         DECIMAL(10, 7) NOT NULL,
    lng         DECIMAL(10, 7) NOT NULL,
    speed_kmh   DECIMAL(5, 2)  DEFAULT 0,
    heading_deg SMALLINT       DEFAULT 0,
    recorded_at DATETIME(3)    NOT NULL,

    FOREIGN KEY (bus_id) REFERENCES buses(bus_id) ON DELETE CASCADE,
    INDEX idx_bus_time (bus_id, recorded_at)
);
```

**Notes:**
- `idx_bus_time` is critical — all history/breadcrumb queries filter by `bus_id` + `recorded_at` range
- Consider MySQL table partitioning by month for long-term deployments
- Archive logs older than 90 days to cold storage

---

### 2.7 `alerts`

Panic alerts, breakdown notifications, and delay reports.

```sql
CREATE TABLE alerts (
    alert_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    bus_id       INT UNSIGNED,
    triggered_by INT UNSIGNED,
    type         ENUM('panic', 'breakdown', 'delay', 'overcrowding') NOT NULL,
    lat          DECIMAL(10, 7),
    lng          DECIMAL(10, 7),
    message      TEXT,
    status       ENUM('active', 'acknowledged', 'resolved') DEFAULT 'active',
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at  DATETIME,

    FOREIGN KEY (bus_id)       REFERENCES buses(bus_id) ON DELETE SET NULL,
    FOREIGN KEY (triggered_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_status_time (status, created_at)
);
```

---

### 2.8 `student_stop_preferences`

Stores each student's preferred stop for geofence alert targeting.

```sql
CREATE TABLE student_stop_preferences (
    preference_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNSIGNED NOT NULL UNIQUE,
    stop_id       INT UNSIGNED NOT NULL,
    notify_radius_m INT UNSIGNED DEFAULT 1000,
    push_token    VARCHAR(500),
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (stop_id) REFERENCES stops(stop_id) ON DELETE CASCADE
);
```

---

## 3. Indexing Strategy

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| `users` | `email` | UNIQUE | Fast login lookup |
| `stops` | `(route_id, stop_order)` | COMPOSITE | Route stop ordering |
| `bus_location_logs` | `(bus_id, recorded_at)` | COMPOSITE | History range queries |
| `alerts` | `(status, created_at)` | COMPOSITE | Active alert dashboard |
| `bus_live_positions` | `bus_id` | PRIMARY | Single-row upsert |

---

## 4. Write Patterns

### Live Position Upsert (every 3–5 sec per bus)

```sql
INSERT INTO bus_live_positions (bus_id, lat, lng, speed_kmh, heading_deg)
VALUES (?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
    lat         = VALUES(lat),
    lng         = VALUES(lng),
    speed_kmh   = VALUES(speed_kmh),
    heading_deg = VALUES(heading_deg),
    updated_at  = CURRENT_TIMESTAMP(3);
```

### Archival Job (runs every 60 seconds via FastAPI background task)

```sql
INSERT INTO bus_location_logs (bus_id, lat, lng, speed_kmh, heading_deg, recorded_at)
SELECT bus_id, lat, lng, speed_kmh, heading_deg, NOW(3)
FROM bus_live_positions;
```

---

## 5. Seed Data (Sample)

```sql
-- Sample Route
INSERT INTO routes (route_name, description) VALUES
  ('North Campus', 'Main gate to North Campus via Library'),
  ('South Hostel', 'Admin block to South Hostel loop');

-- Sample Stops
INSERT INTO stops (route_id, stop_name, lat, lng, stop_order) VALUES
  (1, 'Main Gate',   13.0827, 80.2707, 1),
  (1, 'Library',     13.0831, 80.2715, 2),
  (1, 'North Block', 13.0840, 80.2730, 3);

-- Sample Bus
INSERT INTO buses (vehicle_number, route_id, status) VALUES
  ('TN 09 AB 1234', 1, 'on_track'),
  ('TN 09 AB 5678', 2, 'idle');
```
