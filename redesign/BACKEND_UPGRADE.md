# BACKEND_UPGRADE.md
## FastAPI Backend Upgrades — Stitch Redesign
### New Endpoints · Expanded Models · Alert System

> **Scope:** All changes required to support the new Dashboard, Safety Hub, Journey Sharing, Virtual Escort, and expanded Incident Reporting features. Existing endpoints remain unchanged.

---

## 1. Expanded Alert Model

### 1.1 Current Alert Types

```python
# models.py — EXISTING
class AlertType(str, Enum):
    panic     = "panic"
    breakdown = "breakdown"
    delay     = "delay"
```

### 1.2 New Alert Types (Add These)

```python
# models.py — UPDATED
class AlertType(str, Enum):
    panic               = "panic"
    breakdown           = "breakdown"
    delay               = "delay"
    accident            = "accident"           # 🆕 Stitch
    suspicious_activity = "suspicious_activity" # 🆕 Stitch
    overcrowding        = "overcrowding"        # 🆕 Stitch
    general             = "general"             # 🆕 Stitch
    escort_request      = "escort_request"      # 🆕 Stitch
```

### 1.3 Updated MySQL alerts Table

```sql
-- Add new column for alert subtype (non-breaking)
ALTER TABLE alerts
  MODIFY COLUMN type
    ENUM(
      'panic', 'breakdown', 'delay',
      'accident', 'suspicious_activity',
      'overcrowding', 'general', 'escort_request'
    ) NOT NULL;

-- Add severity column
ALTER TABLE alerts
  ADD COLUMN severity ENUM('critical','high','medium','low') DEFAULT 'medium'
  AFTER type;

-- Add source column (student, driver, system)
ALTER TABLE alerts
  ADD COLUMN source ENUM('student','driver','system') DEFAULT 'student'
  AFTER severity;
```

### 1.4 Severity Mapping

| Alert Type | Severity |
|-----------|---------|
| `panic` | `critical` |
| `accident` | `critical` |
| `breakdown` | `critical` |
| `suspicious_activity` | `high` |
| `delay` | `medium` |
| `overcrowding` | `medium` |
| `escort_request` | `medium` |
| `general` | `low` |

---

## 2. New Endpoints

### 2.1 Dashboard Stats

**`GET /dashboard/stats`**

Returns aggregate stats for the student dashboard Bento cards.

**Response `200`:**
```json
{
  "active_buses": 12,
  "students_boarded_estimate": 847,
  "on_track_count": 10,
  "delayed_count": 2,
  "offline_count": 0,
  "as_of": "2026-05-01T07:45:00Z"
}
```

**Implementation:**
```python
@router.get("/dashboard/stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    active = db.query(Bus).filter(Bus.status != "offline").all()
    return {
        "active_buses": len(active),
        "students_boarded_estimate": sum(
            {"low": 10, "medium": 25, "full": 45}[b.occupancy]
            for b in active
        ),
        "on_track_count": sum(1 for b in active if b.status == "on_track"),
        "delayed_count":  sum(1 for b in active if b.status == "delayed"),
        "offline_count":  db.query(Bus).filter(Bus.status == "offline").count(),
        "as_of": datetime.utcnow().isoformat() + "Z"
    }
```

---

### 2.2 Announcements / Alerts Feed

**`GET /announcements`**

Returns management broadcasts for the dashboard alerts feed.

**Query Params:**
- `status` — `active` | `resolved` | `all` (default: `active,resolved`)
- `limit` — int (default: `10`)
- `sort` — `created_at:desc` (default)

**Response `200`:**
```json
[
  {
    "alert_id": 99,
    "type": "delay",
    "severity": "medium",
    "message": "Route Delay: West Gate — Bus 06 delayed 8 min",
    "bus_id": 6,
    "status": "active",
    "source": "system",
    "created_at": "2026-05-01T07:30:00Z"
  },
  {
    "alert_id": 97,
    "type": "general",
    "severity": "low",
    "message": "Weekend Schedule Updated — check route changes",
    "bus_id": null,
    "status": "active",
    "source": "system",
    "created_at": "2026-04-30T18:00:00Z"
  }
]
```

---

### 2.3 Journey Sharing

**`POST /journey/share`**

Create a shareable live-tracking link for a student.

**Request Body:**
```json
{
  "student_id":    42,
  "contact_name":  "Mom",
  "contact_phone": "+91 98765 43210",
  "bus_id":        "BUS-04"
}
```

**Response `201`:**
```json
{
  "share_id":   "a1b2c3",
  "share_url":  "https://campustracker.local/share/a1b2c3",
  "expires_at": "2026-05-01T08:25:00Z",
  "sms_sent":   true
}
```

**`GET /journey/share/{share_id}`**

Public read-only endpoint (no auth required) for the contact's view.

**Response `200`:**
```json
{
  "student_name": "Arjun",
  "bus_id":       "BUS-04",
  "route_name":   "Ayapakkam → RIT",
  "current_lat":  13.0827,
  "current_lng":  80.2707,
  "eta_to_destination_minutes": 22,
  "status":       "on_track",
  "expires_at":   "2026-05-01T08:25:00Z"
}
```

**`DELETE /journey/share/{share_id}`**

Student manually revokes a share.

**New MySQL Table — `journey_shares`:**

```sql
CREATE TABLE journey_shares (
  share_id      VARCHAR(12) PRIMARY KEY,
  student_id    INT UNSIGNED NOT NULL,
  contact_name  VARCHAR(100),
  contact_phone VARCHAR(20),
  bus_id        INT UNSIGNED,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at    DATETIME NOT NULL,

  FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (bus_id)     REFERENCES buses(bus_id)  ON DELETE SET NULL,
  INDEX idx_active (is_active, expires_at)
);
```

---

### 2.4 Virtual Escort

**`POST /escort/request`**

Student requests a virtual escort from campus dispatch.

**Request Body:**
```json
{
  "student_id":       42,
  "current_lat":      13.0445,
  "current_lng":      80.2362,
  "destination_stop": "RIT",
  "bus_id":           "BUS-04"
}
```

**Response `201`:**
```json
{
  "escort_id":        55,
  "status":           "pending",
  "dispatcher_name":  null,
  "estimated_response_seconds": 90,
  "message":          "Your escort request has been received. Dispatch will confirm shortly."
}
```

**`GET /escort/{escort_id}`**

Poll for escort status (student polls every 10s).

**Response `200`:**
```json
{
  "escort_id":        55,
  "status":           "active",
  "dispatcher_name":  "Kavitha S.",
  "dispatcher_phone": "+91 98765 00001",
  "monitoring_since": "2026-05-01T07:52:00Z",
  "message":          "Dispatch is monitoring your trip. Stay on the bus."
}
```

**`POST /escort/{escort_id}/close`**

Mark escort as completed (auto-triggered when bus reaches destination).

**New MySQL Table — `escort_requests`:**

```sql
CREATE TABLE escort_requests (
  escort_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id        INT UNSIGNED NOT NULL,
  bus_id            INT UNSIGNED,
  current_lat       DECIMAL(10,7),
  current_lng       DECIMAL(10,7),
  destination_stop  VARCHAR(10),
  status            ENUM('pending','active','completed','cancelled') DEFAULT 'pending',
  dispatcher_id     INT UNSIGNED,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at       DATETIME,

  FOREIGN KEY (student_id)   REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (bus_id)       REFERENCES buses(bus_id)  ON DELETE SET NULL,
  FOREIGN KEY (dispatcher_id) REFERENCES users(user_id) ON DELETE SET NULL
);
```

---

### 2.5 Incident Reports (Expanded POST /alerts)

No new endpoint needed — the existing `POST /alerts` is reused. The incident report form in the Safety Hub maps chip selections to existing alert types.

**Updated request schema adds `source` field:**

```json
POST /alerts
{
  "type":         "accident",
  "triggered_by": 42,
  "bus_id":       "BUS-04",
  "lat":          13.0445,
  "lng":          80.2362,
  "message":      "Fender bender near Avadi junction",
  "source":       "student"
}
```

**Updated Response includes `severity`:**

```json
{
  "alert_id": 8842,
  "status":   "dispatched",
  "severity": "critical",
  "notified": ["security", "admin"],
  "message":  "Alert #8842 created and dispatched"
}
```

---

## 3. WebSocket Additions

### 3.1 New WebSocket Message Types

Add these to the existing WebSocket broadcast logic:

**Server → Admin: Fleet Stats (every 30s)**
```json
{
  "type":           "fleet_stats",
  "active_buses":   12,
  "delayed_count":  2,
  "students_boarded_estimate": 847,
  "timestamp":      "2026-05-01T07:45:00Z"
}
```

**Server → Student: Escort Status Update**
```json
{
  "type":             "escort_update",
  "escort_id":        55,
  "status":           "active",
  "dispatcher_name":  "Kavitha S.",
  "message":          "Dispatch is now monitoring your trip"
}
```

**Server → Student: Journey Share Expiry Warning**
```json
{
  "type":    "share_expiring",
  "share_id": "a1b2c3",
  "message": "Your journey share link expires in 5 minutes"
}
```

---

## 4. Updated models.py (Full Diff)

```python
# models.py — FULL UPDATED FILE

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Enum, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

Base = declarative_base()

class AlertType(str, enum.Enum):
    panic               = "panic"
    breakdown           = "breakdown"
    delay               = "delay"
    accident            = "accident"           # 🆕
    suspicious_activity = "suspicious_activity" # 🆕
    overcrowding        = "overcrowding"        # 🆕
    general             = "general"             # 🆕
    escort_request      = "escort_request"      # 🆕

class AlertSeverity(str, enum.Enum):           # 🆕
    critical = "critical"
    high     = "high"
    medium   = "medium"
    low      = "low"

class AlertSource(str, enum.Enum):             # 🆕
    student = "student"
    driver  = "driver"
    system  = "system"

class Alert(Base):
    __tablename__ = "alerts"
    alert_id     = Column(Integer, primary_key=True, autoincrement=True)
    bus_id       = Column(Integer, ForeignKey("buses.bus_id"), nullable=True)
    triggered_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    type         = Column(Enum(AlertType), nullable=False)
    severity     = Column(Enum(AlertSeverity), default=AlertSeverity.medium)  # 🆕
    source       = Column(Enum(AlertSource), default=AlertSource.student)     # 🆕
    lat          = Column(Float, nullable=True)
    lng          = Column(Float, nullable=True)
    message      = Column(Text, nullable=True)
    status       = Column(String(20), default="active")
    created_at   = Column(DateTime, default=datetime.utcnow)
    resolved_at  = Column(DateTime, nullable=True)

class JourneyShare(Base):                      # 🆕
    __tablename__ = "journey_shares"
    share_id      = Column(String(12), primary_key=True)
    student_id    = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    contact_name  = Column(String(100))
    contact_phone = Column(String(20))
    bus_id        = Column(Integer, ForeignKey("buses.bus_id"), nullable=True)
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, default=datetime.utcnow)
    expires_at    = Column(DateTime, nullable=False)

class EscortRequest(Base):                     # 🆕
    __tablename__ = "escort_requests"
    escort_id        = Column(Integer, primary_key=True, autoincrement=True)
    student_id       = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    bus_id           = Column(Integer, ForeignKey("buses.bus_id"), nullable=True)
    current_lat      = Column(Float)
    current_lng      = Column(Float)
    destination_stop = Column(String(10))
    status           = Column(String(20), default="pending")
    dispatcher_id    = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    created_at       = Column(DateTime, default=datetime.utcnow)
    resolved_at      = Column(DateTime, nullable=True)
```

---

## 5. New Endpoints Summary Table

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/dashboard/stats` | student, admin | Bento stats cards data |
| `GET` | `/announcements` | student, admin | Dashboard alerts feed |
| `POST` | `/journey/share` | student | Create shareable trip link |
| `GET` | `/journey/share/{id}` | public | Contact views live location |
| `DELETE` | `/journey/share/{id}` | student | Revoke share |
| `POST` | `/escort/request` | student | Request virtual escort |
| `GET` | `/escort/{id}` | student | Poll escort status |
| `POST` | `/escort/{id}/close` | student, system | End escort session |

---

## 6. Migration Checklist

- [ ] `ALTER TABLE alerts` — add `severity`, `source` columns, expand `type` ENUM
- [ ] Create `journey_shares` table
- [ ] Create `escort_requests` table
- [ ] Add new Pydantic schemas for `JourneyShare` and `EscortRequest`
- [ ] Add `/dashboard/stats` router
- [ ] Add `/announcements` router
- [ ] Add `/journey` router
- [ ] Add `/escort` router
- [ ] Update WebSocket broadcast to include `fleet_stats` every 30s
- [ ] Add SMS integration (Twilio free tier) for journey share link dispatch
- [ ] Update admin dashboard to show `severity` color coding on alerts
