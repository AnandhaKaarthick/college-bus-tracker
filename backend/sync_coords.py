import json
from database import SessionLocal
import models

def sync_coordinates():
    with open('../simulator/routes/ayapakkam_rit.json', 'r') as f:
        data = json.load(f)
    
    db = SessionLocal()
    # Match route by part of the name to avoid arrow character encoding issues
    route = db.query(models.Route).filter(models.Route.name.like("%Ayapakkam%")).first()
    
    if not route:
        print("Route matching 'Ayapakkam' not found!")
        return

    print(f"Syncing {len(data['waypoints'])} stops...")
    
    # Fetch all stops for this route and sort by order
    db_stops = db.query(models.Stop).filter(models.Stop.route_id == route.id).order_by(models.Stop.order).all()
    
    for i, wp in enumerate(data['waypoints']):
        if i < len(db_stops):
            stop = db_stops[i]
            print(f"Updating stop {i+1}: {stop.name} -> {wp['name']}")
            stop.name = wp['name']
            stop.lat = wp['lat']
            stop.lng = wp['lng']
        else:
            print(f"Adding new stop {wp['name']}")
            new_stop = models.Stop(
                route_id=route.id,
                name=wp['name'],
                lat=wp['lat'],
                lng=wp['lng'],
                order=wp['id']
            )
            db.add(new_stop)

    db.commit()
    db.close()
    print("Database stops updated successfully!")

if __name__ == "__main__":
    sync_coordinates()
