import json
import httpx
import asyncio
from database import SessionLocal
import models

async def update_route_geometry():
    db = SessionLocal()
    route = db.query(models.Route).filter(models.Route.name == "Ayapakkam → RIT Express").first()
    
    if not route:
        print("Route not found!")
        return

    stops = db.query(models.Stop).filter(models.Stop.route_id == route.id).order_by(models.Stop.order).all()
    
    print(f"Expanding geometry for {len(stops)} stops...")
    full_polyline = []
    
    async with httpx.AsyncClient() as client:
        for i in range(len(stops) - 1):
            s1 = stops[i]
            s2 = stops[i+1]
            url = f"http://router.project-osrm.org/route/v1/driving/{s1.lng},{s1.lat};{s2.lng},{s2.lat}?overview=full&geometries=geojson"
            try:
                resp = await client.get(url, timeout=10.0)
                if resp.status_code == 200:
                    data = resp.json()
                    coords = data['routes'][0]['geometry']['coordinates']
                    # Convert [lng, lat] to [lat, lng] for Leaflet
                    segment = [[c[1], c[0]] for c in coords]
                    full_polyline.extend(segment)
                else:
                    print(f"OSRM Error for segment {i}: {resp.status_code}")
            except Exception as e:
                print(f"Error fetching OSRM data: {e}")
                full_polyline.append([s2.lat, s2.lng])

    route.polyline_json = json.dumps(full_polyline)
    db.commit()
    db.close()
    print("Database updated with high-resolution road-snapped polyline!")

if __name__ == "__main__":
    asyncio.run(update_route_geometry())
