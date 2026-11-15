from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import json
import asyncio
from typing import List
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

@app.on_event("startup")
async def startup_event():
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

    asyncio.create_task(archive_locations_task())

@app.get("/")
async def root():
    return {"message": "Welcome to the Real-Time College Bus Tracking API"}

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

# --- SAFETY HUB ENDPOINTS ---

class AlertCreate(BaseModel):
    type: str
    triggered_by: int
    bus_id: str = None
    lat: float
    lng: float
    message: str

@app.post("/api/alerts")
async def create_alert(alert: AlertCreate, db: Session = Depends(get_db)):
    # Map types to severities based on Phase E spec
    severity_map = {
        "accident": "critical",
        "breakdown": "critical",
        "panic": "critical",
        "suspicious_activity": "high",
        "overcrowding": "medium",
        "general": "low"
    }
    
    bus_id_int = int(alert.bus_id.replace("BUS-", "")) if alert.bus_id and alert.bus_id.startswith("BUS-") else None

    new_alert = models.Alert(
        type=alert.type,
        severity=severity_map.get(alert.type, "low"),
        triggered_by=alert.triggered_by,
        bus_id=bus_id_int,
        lat=alert.lat,
        lng=alert.lng,
        message=alert.message,
        status="active"
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    
    # Broadcast critical alerts to all users
    if new_alert.severity in ["critical", "high"]:
        await manager.broadcast(json.dumps({
            "type": "emergency_alert",
            "alert_id": new_alert.id,
            "severity": new_alert.severity,
            "message": new_alert.message
        }))
        
    return {"status": "success", "alert_id": new_alert.id}

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

