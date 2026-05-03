from database import SessionLocal
import models
import json

db = SessionLocal()
stops = db.query(models.Stop).all()
for s in stops:
    print(f"ID: {s.id}, Name: {s.name}, Lat: {s.lat}, Lng: {s.lng}, Order: {s.order}")
db.close()
