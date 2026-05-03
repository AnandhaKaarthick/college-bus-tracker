import json
import httpx
import models
from database import SessionLocal, engine, Base

def reset_and_sync():
    print("Cleaning database...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Define routes to initialize
    route_files = [
        'ayapakkam_rit.json',
        'jj_nagar_rit.json'
    ]
    
    for idx, filename in enumerate(route_files, start=1):
        try:
            path = f'../simulator/routes/{filename}'
            with open(path, 'r') as f:
                route_config = json.load(f)
        except:
            path = f'simulator/routes/{filename}'
            with open(path, 'r') as f:
                route_config = json.load(f)

        print(f"\n--- Processing Route {idx}: {route_config['route_name']} ---")
        
        # 1. Create the Route
        route = models.Route(
            id=idx,
            name=route_config['route_name'],
            description=f"High-precision route {idx}",
            color="#3B82F6" if idx == 1 else "#10B981" # Blue for R1, Green for R2
        )
        db.add(route)
        db.flush()
        
        # 2. Add Stops
        print("Adding stops...")
        stops_data = []
        for wp in route_config['waypoints']:
            stop = models.Stop(
                route_id=route.id,
                name=wp['name'],
                lat=wp['lat'],
                lng=wp['lng'],
                order=wp['id']
            )
            db.add(stop)
            stops_data.append(stop)
        
        # 3. Fetch Real Road Geometry (OSRM)
        print("Fetching road geometry...")
        coords_str = ";".join([f"{s.lng},{s.lat}" for s in stops_data])
        url = f"http://router.project-osrm.org/route/v1/driving/{coords_str}?overview=full&geometries=geojson"
        
        try:
            r = httpx.get(url, timeout=15)
            if r.status_code == 200:
                geometry = r.json()['routes'][0]['geometry']['coordinates']
                polyline = [[c[1], c[0]] for c in geometry]
                route.polyline_json = json.dumps(polyline)
                print(f"Success! {len(polyline)} points.")
            else:
                route.polyline_json = json.dumps([[s.lat, s.lng] for s in stops_data])
        except:
            route.polyline_json = json.dumps([[s.lat, s.lng] for s in stops_data])

        # 4. Create a Bus for this route
        bus_name = f"Bus {idx:02d}"
        print(f"Registering {bus_name}...")
        bus = models.Bus(
            id=idx,
            vehicle_number=f"TN-09-RIT-000{idx}",
            name=bus_name,
            route_id=route.id,
            status="offline"
        )
        db.add(bus)
    
    db.commit()
    db.close()
    print("\n✨ MULTI-ROUTE MASTER RESET COMPLETE!")

if __name__ == "__main__":
    reset_and_sync()
