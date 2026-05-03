from database import SessionLocal
import models

db = SessionLocal()
routes = db.query(models.Route).all()
for r in routes:
    print(f"ID: {r.id}, Name: '{r.name}'")
db.close()
