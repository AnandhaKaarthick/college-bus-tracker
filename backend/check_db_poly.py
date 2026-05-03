import json
from database import SessionLocal
import models

def check_db():
    db = SessionLocal()
    route = db.query(models.Route).filter(models.Route.name == "Ayapakkam → RIT Express").first()
    if route:
        poly = json.loads(route.polyline_json) if route.polyline_json else []
        print(f"Route: {route.name.replace('\u2192', '->')}")
        print(f"Polyline Points: {len(poly)}")
        if len(poly) > 0:
            print(f"First 5: {poly[:5]}")
    else:
        print("Route not found!")
    db.close()

if __name__ == "__main__":
    check_db()
