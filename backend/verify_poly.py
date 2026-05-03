from database import SessionLocal
import models
import json

db = SessionLocal()
route = db.query(models.Route).filter(models.Route.name.like("%Ayapakkam%")).first()
if route:
    poly = json.loads(route.polyline_json) if route.polyline_json else []
    print(f"Polyline Points: {len(poly)}")
    if len(poly) > 0:
        print(f"First Point: {poly[0]}")
        print(f"Last Point: {poly[-1]}")
else:
    print("Route not found!")
db.close()
