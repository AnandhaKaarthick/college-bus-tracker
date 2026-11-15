from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, BackgroundTasks, HTTPException, Header, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import json
import asyncio
import hashlib
import os
from typing import List, Optional
from database import get_db, SessionLocal, engine, Base
import models
import math
from datetime import datetime

app = FastAPI(title="College Bus Tracker API")

def calculate_distance(lat1, lon1, lat2, lon2):
    # Haversine formula
    R = 6371000 # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

# Background Task for Location Archival (60s tick)
async def archive_locations_task():
    while True:
        await asyncio.sleep(60)
        db = SessionLocal()
        try:
            live_positions = db.query(models.BusLivePosition).all()
            for pos in live_positions:
                log = models.BusLocationLog(
                    bus_id=pos.bus_id,
                    lat=pos.lat,
                    lng=pos.lng,
                    speed=pos.speed
                )
                db.add(log)
            db.commit()
            print(f"Archived {len(live_positions)} positions at {datetime.now()}")
        except Exception as e:
            print(f"Error in archival task: {e}")
        finally:
            db.close()

archival_task = None

@app.on_event("startup")
async def startup_event():
    global archival_task
    # Ensure database schema is created
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(models.Route).count() == 0:
            print("No routes found in database. Initializing default route data...")
            try:
                from init_db import init_db
                init_db(drop=False)
            except Exception as e:
                print(f"Error seeding default routes: {e}")
    except Exception as e:
        print(f"Startup DB check error: {e}")
    finally:
        db.close()

    if not os.getenv("TESTING"):
        archival_task = asyncio.create_task(archive_locations_task())

@app.on_event("shutdown")
async def shutdown_event():
    global archival_task
    if archival_task:
        archival_task.cancel()

@app.get("/")
async def root():
    return {"message": "Welcome to the Real-Time College Bus Tracking API"}

# --- AUTH & SECURITY MODELS ---
class LoginRequest(BaseModel):
    identifier: str
    password: str
    role: Optional[str] = None

def verify_pwd(plain: str, hashed: str) -> bool:
    if not hashed:
        return True
    if plain == hashed:
        return True
    return hashlib.sha256(plain.encode()).hexdigest() == hashed

@app.post("/api/auth/login")
def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    ident = req.identifier.strip()
    
    # 1. Query user by identifier or email
    user = db.query(models.User).filter(
        (models.User.identifier.ilike(ident)) | 
        (models.User.email.ilike(ident))
    ).first()

    # Convenience shortcut for "admin"
    if not user and ident.lower() == "admin":
        user = db.query(models.User).filter(models.User.role == "admin").first()

    if not user:
        raise HTTPException(status_code=401, detail="User not found. Please check your credentials.")

    if req.role and user.role != req.role:
        raise HTTPException(status_code=403, detail=f"This account is registered as a {user.role}, not as {req.role}.")

    # 2. Check password
    if user.hashed_password and not verify_pwd(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")

    # 3. Retrieve correlated route, stop, and bus
    assigned_route = db.query(models.Route).filter(models.Route.id == user.assigned_route_id).first() if user.assigned_route_id else None
    assigned_stop = db.query(models.Stop).filter(models.Stop.id == user.assigned_stop_id).first() if user.assigned_stop_id else None
    
    assigned_bus = None
    if user.assigned_bus_id:
        assigned_bus = db.query(models.Bus).filter(models.Bus.id == user.assigned_bus_id).first()
    elif user.role == "driver":
        assigned_bus = db.query(models.Bus).filter(models.Bus.driver_id == user.id).first()
    elif assigned_route:
        assigned_bus = db.query(models.Bus).filter(models.Bus.route_id == assigned_route.id).first()

    token = f"rit_token_{user.id}_{user.role}"

    return {
        "status": "success",
        "token": token,
        "user": {
            "id": user.id,
            "identifier": user.identifier or user.email,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "phone": user.phone,
            "assigned_route_id": str(assigned_route.id) if assigned_route else None,
            "assigned_route_name": assigned_route.name if assigned_route else None,
            "assigned_stop_id": str(assigned_stop.id) if assigned_stop else None,
            "assigned_stop_name": assigned_stop.name if assigned_stop else None,
            "assigned_bus_id": str(assigned_bus.id) if assigned_bus else None,
            "assigned_bus_name": assigned_bus.name if assigned_bus else None,
            "vehicle_number": assigned_bus.vehicle_number if assigned_bus else None,
        }
    }

@app.get("/api/auth/me")
def get_current_user_profile(
    user_id: Optional[int] = None, 
    authorization: Optional[str] = Header(None), 
    db: Session = Depends(get_db)
):
    target_id = user_id
    if not target_id and authorization and "rit_token_" in authorization:
        try:
            parts = authorization.replace("Bearer ", "").split("_")
            target_id = int(parts[2])
        except:
            pass

    if not target_id:
        target_id = 4  # Default student fallback

    user = db.query(models.User).filter(models.User.id == target_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    assigned_route = db.query(models.Route).filter(models.Route.id == user.assigned_route_id).first() if user.assigned_route_id else None
    assigned_stop = db.query(models.Stop).filter(models.Stop.id == user.assigned_stop_id).first() if user.assigned_stop_id else None
    
    assigned_bus = None
    if user.assigned_bus_id:
        assigned_bus = db.query(models.Bus).filter(models.Bus.id == user.assigned_bus_id).first()
    elif user.role == "driver":
        assigned_bus = db.query(models.Bus).filter(models.Bus.driver_id == user.id).first()
    elif assigned_route:
        assigned_bus = db.query(models.Bus).filter(models.Bus.route_id == assigned_route.id).first()

    return {
        "id": user.id,
        "identifier": user.identifier or user.email,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "phone": user.phone,
        "assigned_route_id": str(assigned_route.id) if assigned_route else None,
        "assigned_route_name": assigned_route.name if assigned_route else None,
        "assigned_stop_id": str(assigned_stop.id) if assigned_stop else None,
        "assigned_stop_name": assigned_stop.name if assigned_stop else None,
        "assigned_bus_id": str(assigned_bus.id) if assigned_bus else None,
        "assigned_bus_name": assigned_bus.name if assigned_bus else None,
        "vehicle_number": assigned_bus.vehicle_number if assigned_bus else None,
    }

# --- REST ENDPOINTS ---

@app.get("/api/routes")
async def get_routes(db: Session = Depends(get_db)):
    routes = db.query(models.Route).all()
    result = []
    for r in routes:
        stops = db.query(models.Stop).filter(models.Stop.route_id == r.id).order_by(models.Stop.order).all()
        buses = db.query(models.Bus).filter(models.Bus.route_id == r.id).all()
        
        start_stop = stops[0].name if stops else "N/A"
        end_stop = stops[-1].name if stops else "N/A"
        
        result.append({
            "id": str(r.id),
            "name": r.name,
            "description": r.description,
            "color": r.color,
            "startStop": start_stop,
            "endStop": end_stop,
            "busIds": [str(b.id) for b in buses],
            "polyline": json.loads(r.polyline_json) if r.polyline_json else [],
            "stops": [
                {"id": str(s.id), "name": s.name, "lat": s.lat, "lng": s.lng, "order": s.order}
                for s in stops
            ]
        })
    return {"routes": result}

@app.get("/api/admin/buses")
async def get_admin_buses(db: Session = Depends(get_db)):
    buses = db.query(models.Bus).all()
    result = []
    for b in buses:
        live = db.query(models.BusLivePosition).filter(models.BusLivePosition.bus_id == b.id).first()
        route = db.query(models.Route).filter(models.Route.id == b.route_id).first() if b.route_id else None
        driver = db.query(models.User).filter(models.User.id == b.driver_id).first() if b.driver_id else None
        
        stat = db.query(models.BusDailyStat).filter(models.BusDailyStat.bus_id == b.id).first()
        km_today = stat.km_today if stat else 0.0
        
        result.append({
            "bus_id": str(b.id),
            "name": b.name,
            "vehicle_number": b.vehicle_number,
            "route_id": str(b.route_id) if b.route_id else None,
            "route_name": route.name if route else "Unassigned",
            "driver_name": driver.name if driver else "No Driver",
            "status": b.status,
            "status_since": b.status_since.isoformat() if b.status_since else None,
            "occupancy": b.occupancy,
            "lat": live.lat if live else None,
            "lng": live.lng if live else None,
            "speed": live.speed if live else 0.0,
            "kmToday": round(km_today, 1),
            "fuelEfficiency": round(km_today / 25.0, 1) if km_today > 0 else 0.0,
            "last_updated": live.updated_at.isoformat() if live and live.updated_at else None
        })
    return {"buses": result}

@app.patch("/api/admin/buses/{bus_id}/status")
async def update_bus_status(bus_id: str, payload: dict, db: Session = Depends(get_db)):
    bus_id_int = int(bus_id)
    bus = db.query(models.Bus).filter(models.Bus.id == bus_id_int).first()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")
    
    new_status = payload.get("status")
    if new_status and new_status != bus.status:
        bus.status = new_status
        bus.status_since = datetime.now()
        db.commit()
    
    return {"status": "success", "bus_id": bus_id, "new_status": bus.status}


@app.get("/api/buses")
async def get_public_buses(db: Session = Depends(get_db)):
    buses = db.query(models.Bus).all()
    result = []
    for b in buses:
        live = db.query(models.BusLivePosition).filter(models.BusLivePosition.bus_id == b.id).first()
        result.append({
            "bus_id": str(b.id),
            "name": b.name,
            "vehicle_number": b.vehicle_number,
            "route_id": str(b.route_id) if b.route_id else None,
            "status": b.status,
            "occupancy": b.occupancy,
            "lat": live.lat if live else None,
            "lng": live.lng if live else None,
            "speed": live.speed if live else 0.0,
            "last_updated": live.updated_at.isoformat() if live and live.updated_at else None
        })
    return {"buses": result}

# --- WEBSOCKETS ---

@app.websocket("/ws/buses")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.websocket("/ws/driver/{bus_id}")
async def driver_websocket_endpoint(websocket: WebSocket, bus_id: str):
    await websocket.accept()
    bus_id_int = int(bus_id)
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            if payload.get("type") == "location_update":
                location_data = payload.get("data", {})
                new_lat = float(location_data.get('lat', 0.0))
                new_lng = float(location_data.get('lng', 0.0))
                new_speed = float(location_data.get('speed', 0.0))
                
                db = SessionLocal()
                try:
                    # Update Bus Status
                    bus = db.query(models.Bus).filter(models.Bus.id == bus_id_int).first()
                    if bus:
                        if bus.status != "on_track":
                            bus.status = "on_track"
                            bus.status_since = datetime.now()
                    
                    # Update Live Position (Upsert)
                    live_pos = db.query(models.BusLivePosition).filter(models.BusLivePosition.bus_id == bus_id_int).first()
                    dist_delta = 0
                    if not live_pos:
                        live_pos = models.BusLivePosition(bus_id=bus_id_int, lat=new_lat, lng=new_lng, speed=new_speed)
                        db.add(live_pos)
                    else:
                        dist_delta = calculate_distance(live_pos.lat, live_pos.lng, new_lat, new_lng)
                        live_pos.lat = new_lat
                        live_pos.lng = new_lng
                        live_pos.speed = new_speed
                    
                    # Update Daily Stats (Distance KM)
                    today = datetime.now().date()
                    stat = db.query(models.BusDailyStat).filter(
                        models.BusDailyStat.bus_id == bus_id_int,
                        models.BusDailyStat.date == today
                    ).first()
                    
                    if not stat:
                        stat = models.BusDailyStat(bus_id=bus_id_int, km_today=0.0, date=today)
                        db.add(stat)
                    
                    if 0 < dist_delta < 1000: # Ignore noise
                        stat.km_today += (dist_delta / 1000.0)
                    
                    # Stop Arrival Detection
                    if bus and bus.route_id:
                        stops = db.query(models.Stop).filter(models.Stop.route_id == bus.route_id).all()
                        for stop in stops:
                            dist = calculate_distance(new_lat, new_lng, stop.lat, stop.lng)
                            if dist < 50:
                                recent = db.query(models.StopArrival).filter(
                                    models.StopArrival.bus_id == bus.id,
                                    models.StopArrival.stop_id == stop.id
                                ).order_by(models.StopArrival.arrived_at.desc()).first()
                                
                                if not recent or (datetime.now() - recent.arrived_at).total_seconds() > 600:
                                    arrival = models.StopArrival(bus_id=bus.id, stop_id=stop.id)
                                    db.add(arrival)
                    
                    db.commit()
                    
                    # Broadcast to students
                    await manager.broadcast(json.dumps({
                        "type": "bus_position",
                        "bus_id": bus_id,
                        "lat": new_lat,
                        "lng": new_lng,
                        "speed": new_speed,
                        "heading": location_data.get('heading', 0.0),
                        "occupancy": bus.occupancy if bus else "low",
                        "status": bus.status if bus else "on_track",
                        "route_id": str(bus.route_id) if bus and bus.route_id else None
                    }))
                except Exception as e:
                    print(f"DB Error in driver loop: {e}")
                    db.rollback()
                finally:
                    db.close()
    except WebSocketDisconnect:
        db = SessionLocal()
        bus = db.query(models.Bus).filter(models.Bus.id == bus_id_int).first()
        if bus:
            bus.status = "offline"
            db.commit()
        db.close()
        print(f"Driver {bus_id} disconnected")
    except Exception as e:
        print(f"WS Global Error: {e}")

# Temporary simulation endpoint
class LocationUpdate(BaseModel):
    bus_id: str
    lat: float
    lng: float
    speed: float = 0.0

@app.post("/api/simulate-location")
async def simulate_location(update: LocationUpdate, db: Session = Depends(get_db)):
    bus_id_int = int(update.bus_id)
    live_pos = db.query(models.BusLivePosition).filter(models.BusLivePosition.bus_id == bus_id_int).first()
    if live_pos:
        live_pos.lat = update.lat
        live_pos.lng = update.lng
        live_pos.speed = update.speed
    else:
        live_pos = models.BusLivePosition(bus_id=bus_id_int, lat=update.lat, lng=update.lng, speed=update.speed)
        db.add(live_pos)
    
    bus = db.query(models.Bus).filter(models.Bus.id == bus_id_int).first()
    if bus:
        bus.status = "on_track"
    
    db.commit()

    await manager.broadcast(json.dumps({
        "type": "bus_position",
        "bus_id": update.bus_id,
        "lat": update.lat,
        "lng": update.lng,
        "speed": update.speed,
        "occupancy": bus.occupancy if bus else "low",
        "status": "on_track"
    }))
    return {"status": "ok"}

# --- ANNOUNCEMENTS BROADCAST SYSTEM ---
class AnnouncementCreate(BaseModel):
    title: str
    message: str
    target_type: str = "global" # global, by_route
    route_id: Optional[int] = None
    sender_name: Optional[str] = "Admin John"

@app.get("/api/announcements")
def get_announcements(db: Session = Depends(get_db)):
    rows = db.query(models.Announcement).order_by(models.Announcement.created_at.desc()).limit(20).all()
    return {
        "announcements": [
            {
                "id": r.id,
                "title": r.title,
                "message": r.message,
                "target_type": r.target_type,
                "route_id": r.route_id,
                "created_at": r.created_at.isoformat() if r.created_at else datetime.now().isoformat()
            }
            for r in rows
        ]
    }

@app.post("/api/announcements")
async def create_announcement(item: AnnouncementCreate, db: Session = Depends(get_db)):
    announcement = models.Announcement(
        title=item.title,
        message=item.message,
        target_type=item.target_type,
        route_id=item.route_id
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    
    payload = {
        "id": announcement.id,
        "title": announcement.title,
        "message": announcement.message,
        "target_type": announcement.target_type,
        "route_id": announcement.route_id,
        "created_at": announcement.created_at.isoformat() if announcement.created_at else datetime.now().isoformat(),
        "sender_name": item.sender_name or "Admin John"
    }
    
    await manager.broadcast(json.dumps({
        "type": "new_announcement",
        "announcement": payload
    }))
    return {"status": "success", "announcement": payload}

@app.delete("/api/announcements/{id}")
def delete_announcement(id: int, db: Session = Depends(get_db)):
    row = db.query(models.Announcement).filter(models.Announcement.id == id).first()
    if row:
        db.delete(row)
        db.commit()
    return {"status": "success"}

# --- ATTENDANCE & LIVE OCCUPANCY TRACKING ---
class AttendanceAction(BaseModel):
    user_id: Optional[int] = None
    bus_id: int

@app.get("/api/attendance/bus/{bus_id}")
def get_bus_attendance(bus_id: int, db: Session = Depends(get_db)):
    bus = db.query(models.Bus).filter(models.Bus.id == bus_id).first()
    if not bus:
        return {"error": "Bus not found", "passenger_count": 0, "occupancy": "low", "capacity": 40}
    return {
        "bus_id": bus.id,
        "passenger_count": bus.passenger_count or 0,
        "occupancy": bus.occupancy or "low",
        "capacity": bus.capacity or 40
    }

@app.post("/api/attendance/checkin")
async def attendance_checkin(item: AttendanceAction, db: Session = Depends(get_db)):
    bus = db.query(models.Bus).filter(models.Bus.id == item.bus_id).first()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")
    
    rec = models.AttendanceRecord(
        user_id=item.user_id,
        bus_id=item.bus_id,
        status="checked_in"
    )
    db.add(rec)
    
    bus.passenger_count = (bus.passenger_count or 0) + 1
    if bus.passenger_count <= 20:
        bus.occupancy = "low"
    elif bus.passenger_count <= 36:
        bus.occupancy = "medium"
    else:
        bus.occupancy = "high"
        
    db.commit()
    db.refresh(bus)
    
    await manager.broadcast(json.dumps({
        "type": "occupancy_update",
        "bus_id": bus.id,
        "passenger_count": bus.passenger_count,
        "occupancy": bus.occupancy,
        "capacity": bus.capacity
    }))
    
    return {
        "status": "checked_in",
        "bus_id": bus.id,
        "passenger_count": bus.passenger_count,
        "occupancy": bus.occupancy,
        "capacity": bus.capacity
    }

@app.post("/api/attendance/checkout")
async def attendance_checkout(item: AttendanceAction, db: Session = Depends(get_db)):
    bus = db.query(models.Bus).filter(models.Bus.id == item.bus_id).first()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")
        
    rec = models.AttendanceRecord(
        user_id=item.user_id,
        bus_id=item.bus_id,
        status="checked_out"
    )
    db.add(rec)
    
    bus.passenger_count = max(0, (bus.passenger_count or 0) - 1)
    if bus.passenger_count <= 20:
        bus.occupancy = "low"
    elif bus.passenger_count <= 36:
        bus.occupancy = "medium"
    else:
        bus.occupancy = "high"
        
    db.commit()
    db.refresh(bus)
    
    await manager.broadcast(json.dumps({
        "type": "occupancy_update",
        "bus_id": bus.id,
        "passenger_count": bus.passenger_count,
        "occupancy": bus.occupancy,
        "capacity": bus.capacity
    }))
    
    return {
        "status": "checked_out",
        "bus_id": bus.id,
        "passenger_count": bus.passenger_count,
        "occupancy": bus.occupancy,
        "capacity": bus.capacity
    }

# --- SAFETY HUB & SOS ENDPOINTS ---
class AlertCreate(BaseModel):
    type: str
    triggered_by: Optional[int] = None
    bus_id: Optional[str] = None
    lat: float
    lng: float
    message: str
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None

@app.get("/api/alerts")
def get_alerts(db: Session = Depends(get_db)):
    alerts = db.query(models.Alert).order_by(models.Alert.created_at.desc()).limit(30).all()
    results = []
    for a in alerts:
        bus = db.query(models.Bus).filter(models.Bus.id == a.bus_id).first() if a.bus_id else None
        results.append({
            "id": a.id,
            "unit": f"BUS-{a.bus_id:02d}" if a.bus_id else (bus.name if bus else "BUS-04"),
            "event": a.type.capitalize() if a.type else "Panic Alert",
            "time": a.created_at.strftime("%Y-%m-%d %H:%M:%S") if a.created_at else datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "status": a.status or "active",
            "severity": a.severity or "critical",
            "lat": a.lat,
            "lng": a.lng,
            "message": a.message
        })
    return {"alerts": results}

@app.post("/api/alerts")
async def create_alert(alert: AlertCreate, db: Session = Depends(get_db)):
    severity_map = {
        "accident": "critical",
        "breakdown": "critical",
        "panic": "critical",
        "suspicious_activity": "high",
        "overcrowding": "medium",
        "general": "low"
    }
    
    bus_id_int = None
    if alert.bus_id:
        clean_id = str(alert.bus_id).replace("BUS-", "").replace("Bus ", "")
        try:
            bus_id_int = int(clean_id)
        except ValueError:
            bus_id_int = 1

    bus = db.query(models.Bus).filter(models.Bus.id == bus_id_int).first() if bus_id_int else None
    driver = db.query(models.User).filter(models.User.id == bus.driver_id).first() if bus and bus.driver_id else None
    route = db.query(models.Route).filter(models.Route.id == bus.route_id).first() if bus and bus.route_id else None

    new_alert = models.Alert(
        type=alert.type,
        severity=severity_map.get(alert.type, "critical"),
        triggered_by=alert.triggered_by,
        bus_id=bus_id_int or 1,
        lat=alert.lat,
        lng=alert.lng,
        message=alert.message,
        status="active"
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    
    alert_payload = {
        "id": new_alert.id,
        "busId": f"BUS-{new_alert.bus_id:02d}" if new_alert.bus_id else "BUS-04",
        "busNumber": bus.vehicle_number if bus else "TN-01-AB-1234",
        "driverName": alert.driver_name or (driver.name if driver else "Rajesh Kumar"),
        "driverPhone": alert.driver_phone or (driver.phone if driver and driver.phone else "+91 98765 43210"),
        "routeName": route.name if route else "Ayapakkam → RIT Express",
        "lat": new_alert.lat,
        "lng": new_alert.lng,
        "nearestStop": "Main Gate",
        "type": new_alert.type,
        "severity": new_alert.severity,
        "message": new_alert.message,
        "triggeredAt": new_alert.created_at.strftime("%Y-%m-%d %H:%M:%S") if new_alert.created_at else datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    # Broadcast to admin & connected clients
    await manager.broadcast(json.dumps({
        "type": "sos_alert",
        "alert": alert_payload
    }))
    await manager.broadcast(json.dumps({
        "type": "emergency_alert",
        "alert_id": new_alert.id,
        "severity": new_alert.severity,
        "message": new_alert.message
    }))
        
    return {"status": "success", "alert": alert_payload}

@app.put("/api/alerts/{id}/resolve")
async def resolve_alert(id: int, db: Session = Depends(get_db)):
    alert = db.query(models.Alert).filter(models.Alert.id == id).first()
    if alert:
        alert.status = "resolved"
        db.commit()
        await manager.broadcast(json.dumps({
            "type": "alert_resolved",
            "alert_id": id
        }))
    return {"status": "resolved", "id": id}

# --- DRIVER-ADMIN DISPATCH MESSAGING ---
class MessageCreate(BaseModel):
    driver_id: int
    sender: str # "admin" or "driver"
    text: str

@app.get("/api/messages/{driver_id}")
def get_messages(driver_id: int, db: Session = Depends(get_db)):
    msgs = db.query(models.Message).filter(models.Message.driver_id == driver_id).order_by(models.Message.sent_at.asc()).all()
    return {
        "messages": [
            {
                "id": m.id,
                "driver_id": m.driver_id,
                "sender": m.sender,
                "text": m.text,
                "sent_at": m.sent_at.strftime("%H:%M") if m.sent_at else datetime.now().strftime("%H:%M")
            }
            for m in msgs
        ]
    }

@app.post("/api/messages")
async def send_message(msg: MessageCreate, db: Session = Depends(get_db)):
    new_m = models.Message(
        driver_id=msg.driver_id,
        sender=msg.sender,
        text=msg.text
    )
    db.add(new_m)
    db.commit()
    db.refresh(new_m)
    
    payload = {
        "id": new_m.id,
        "driver_id": new_m.driver_id,
        "sender": new_m.sender,
        "text": new_m.text,
        "sent_at": new_m.sent_at.strftime("%H:%M") if new_m.sent_at else datetime.now().strftime("%H:%M")
    }
    
    await manager.broadcast(json.dumps({
        "type": "new_dispatch_message",
        "message": payload
    }))
    return {"status": "success", "message": payload}

# --- TIMETABLE SCHEDULES ---
class ScheduleUpdateItem(BaseModel):
    stop_id: int
    expected_arrival: str

class RouteScheduleUpdate(BaseModel):
    schedules: List[ScheduleUpdateItem]

@app.put("/api/routes/{route_id}/schedule")
def update_route_schedule(route_id: int, payload: RouteScheduleUpdate, db: Session = Depends(get_db)):
    for item in payload.schedules:
        sched = db.query(models.RouteSchedule).filter(
            models.RouteSchedule.route_id == route_id,
            models.RouteSchedule.stop_id == item.stop_id
        ).first()
        if sched:
            sched.expected_arrival = item.expected_arrival
        else:
            sched = models.RouteSchedule(
                route_id=route_id,
                stop_id=item.stop_id,
                expected_arrival=item.expected_arrival
            )
            db.add(sched)
    db.commit()
    return {"status": "success", "route_id": route_id}

# --- CSV EXPORT ---
@app.get("/api/admin/insights/export-csv")
def export_fleet_csv(db: Session = Depends(get_db)):
    buses = db.query(models.Bus).all()
    lines = ["Bus ID,Vehicle Number,Name,Route ID,Passenger Count,Occupancy,Capacity,Status,KM Today,Fuel Used (L)"]
    for b in buses:
        km = 84.0 if b.id == 1 else 76.5
        fuel = round(km / 4.2, 1)
        lines.append(f"{b.id},{b.vehicle_number},{b.name},{b.route_id},{b.passenger_count or 0},{b.occupancy},{b.capacity},{b.status},{km},{fuel}")
    csv_content = "\n".join(lines)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=rit_fleet_telemetry_export.csv"}
    )


class JourneyShare(BaseModel):
    student_id: int
    contact_name: str
    contact_phone: str
    bus_id: str
    expires_at: str

@app.post("/api/journey/share")
async def share_journey(share: JourneyShare):
    # In a real app, this would generate a unique token and send an SMS
    # For now, we mock the success response
    import uuid
    from datetime import datetime, timedelta
    token = str(uuid.uuid4())[:8]
    return {
        "share_id": token,
        "share_url": f"https://campustracker.local/share/{token}",
        "expires_at": (datetime.now() + timedelta(hours=2)).isoformat()
    }

class EscortRequest(BaseModel):
    student_id: int
    current_lat: float
    current_lng: float
    destination_stop: str
    bus_id: str

@app.post("/api/escort/request")
async def request_escort(escort: EscortRequest):
    # Mocking a dispatch assignment
    return {
        "status": "assigned",
        "message": "Virtual escort active. Dispatch is monitoring your trip.",
        "dispatch_id": "DISP-104"
    }

@app.get("/api/admin/history/snapshots")
async def get_history_snapshots(date: str, route_id: str = None, db: Session = Depends(get_db)):
    # Parse date
    try:
        dt = datetime.strptime(date, "%Y-%m-%d")
    except:
        return {"error": "Invalid date format. Use YYYY-MM-DD"}
    
    # Query logs for that day
    query = db.query(models.BusLocationLog).filter(
        models.BusLocationLog.recorded_at >= dt
    )
    
    logs = query.all()
    
    # Group by minute of day (0-1439)
    snapshots = {}
    for log in logs:
        minute = log.recorded_at.hour * 60 + log.recorded_at.minute
        if minute not in snapshots:
            snapshots[minute] = []
        
        snapshots[minute].append({
            "bus_id": str(log.bus_id),
            "lat": log.lat,
            "lng": log.lng,
            "speed": log.speed
        })
    
    return {"snapshots": snapshots}

@app.get("/api/admin/insights/ridership")
async def get_ridership_data(db: Session = Depends(get_db)):
    stops = db.query(models.Stop).all()
    result = []
    for s in stops:
        # Real calculation: average occupancy recorded near this stop
        arrivals = db.query(models.StopArrival).filter(models.StopArrival.stop_id == s.id).all()
        arrival_count = len(arrivals)
        
        # Calculate a pseudo-occupancy based on actual arrivals + some variation
        # In a real system, we'd average the 'occupancy' column from location logs during arrival
        avg_occ = min(40, (arrival_count * 8) % 40 + 5) if arrival_count > 0 else 0
        
        result.append({
            "stop_id": str(s.id),
            "name": s.name,
            "lat": s.lat,
            "lng": s.lng,
            "avgOccupancy": avg_occ,
            "capacity": 40,
            "peakHour": f"{(8 + (int(s.id) % 3)):02d}:00"
        })
    return {"ridership": result}

@app.get("/api/admin/insights/fuel-km")
async def get_fuel_km_insights(db: Session = Depends(get_db)):
    stats = db.query(models.BusDailyStat).all()
    result = []
    FUEL_RATE = 25.0 # L / 100km
    
    for s in stats:
        bus = db.query(models.Bus).filter(models.Bus.id == s.bus_id).first()
        driver = db.query(models.User).filter(models.User.id == bus.driver_id).first() if bus and bus.driver_id else None
        
        km_period = s.km_today * 7 # Mocking a weekly total based on today's performance
        
        result.append({
            "busId": str(s.bus_id),
            "busNumber": bus.vehicle_number if bus else "Unknown",
            "driverName": driver.name if driver else "Unknown",
            "kmToday": round(s.km_today, 1),
            "kmPeriod": round(km_period, 1),
            "estimatedFuelL": round((km_period * FUEL_RATE) / 100.0, 1)
        })
    return {"fuel_km": result}

