import json
from database import SessionLocal, engine
import models

def init_db():
    models.Base.metadata.drop_all(bind=engine)
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # 1. Create the Route
    ayapakkam_rit_stops = [
        {"name": "Ayapakkam park", "lat": 13.102219435796147, "lng": 80.13476351747728, "order": 1},
        {"name": "Ambattur OT", "lat": 13.121564845706502, "lng": 80.14834590819191, "order": 2},
        {"name": "Thirumullaivoyal", "lat": 13.130719800974124, "lng": 80.1336933607239, "order": 3},
        {"name": "Avadi Bus Stand", "lat": 13.127145331206169, "lng": 80.1221008237995, "order": 4},
        {"name": "Paruthipattu", "lat": 13.086411750279192, "lng": 80.10888788621641, "order": 5},
        {"name": "Sennerkuppam", "lat": 13.056674496791677, "lng": 80.11335171916157, "order": 6},
        {"name": "Poonamallee Bus Stand", "lat": 13.050301731077171, "lng": 80.08890348479855, "order": 7},
        {"name": "Kuthambakkam", "lat": 13.037056022089695, "lng": 80.04757488203933, "order": 8},
        {"name": "RIT Chennai — Main Gate", "lat": 13.037548330775685, "lng": 80.04498864712842, "order": 9}
    ]
    
    polyline = [[s["lat"], s["lng"]] for s in ayapakkam_rit_stops]
    
    route1 = models.Route(
        name="Ayapakkam → RIT Express",
        polyline_json=json.dumps(polyline)
    )
    db.add(route1)
    db.commit()
    db.refresh(route1)
    
    # 2. Add Stops
    for s in ayapakkam_rit_stops:
        stop = models.Stop(
            route_id=route1.id,
            name=s["name"],
            lat=s["lat"],
            lng=s["lng"],
            order=s["order"]
        )
        db.add(stop)
    
    # 3. Create Bus
    bus1 = models.Bus(
        name="Bus 04",
        vehicle_number="TN 09 AB 1234",
        route_id=route1.id,
        status="idle",
        occupancy="low"
    )
    db.add(bus1)
    
    # 4. Create Driver User
    driver_user = models.User(
        name="Rajesh Kumar",
        email="rajesh@rit.edu",
        role="driver",
        phone="9876543210"
    )
    db.add(driver_user)
    db.commit()
    db.refresh(driver_user)
    
    # Link driver to bus
    bus1.driver_id = driver_user.id
    
    db.commit()
    db.close()
    print("Database Initialized with Ayapakkam -> RIT Route!")

if __name__ == "__main__":
    init_db()
