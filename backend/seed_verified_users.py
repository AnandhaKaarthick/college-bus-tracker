import json
import os
import hashlib
from database import SessionLocal, engine, Base
import models

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def ensure_columns_and_seed():
    # 1. Ensure table structure is up to date
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Check if new columns exist in sqlite 'users' table, if not add them safely
    with engine.connect() as conn:
        res = conn.exec_driver_sql("PRAGMA table_info(users);").fetchall()
        col_names = [col[1] for col in res]
        
        if "identifier" not in col_names:
            print("Adding column 'identifier' to users...")
            conn.exec_driver_sql("ALTER TABLE users ADD COLUMN identifier VARCHAR(50);")
        if "assigned_route_id" not in col_names:
            print("Adding column 'assigned_route_id' to users...")
            conn.exec_driver_sql("ALTER TABLE users ADD COLUMN assigned_route_id INTEGER;")
        if "assigned_stop_id" not in col_names:
            print("Adding column 'assigned_stop_id' to users...")
            conn.exec_driver_sql("ALTER TABLE users ADD COLUMN assigned_stop_id INTEGER;")
        if "assigned_bus_id" not in col_names:
            print("Adding column 'assigned_bus_id' to users...")
            conn.exec_driver_sql("ALTER TABLE users ADD COLUMN assigned_bus_id INTEGER;")
        conn.commit()

    # Get sample stops from routes
    r1_stop = db.query(models.Stop).filter(models.Stop.route_id == 1).order_by(models.Stop.order).first()
    r2_stop = db.query(models.Stop).filter(models.Stop.route_id == 2).order_by(models.Stop.order).first()
    r1_stop_id = r1_stop.id if r1_stop else 1
    r2_stop_id = r2_stop.id if r2_stop else 2

    # 2. Seed / Upsert Users
    users_data = [
        {
            "identifier": "admin@rit.edu",
            "name": "Super Admin",
            "email": "admin@rit.edu",
            "password": "admin123",
            "role": "admin",
            "phone": "+91 9988776655",
            "assigned_route_id": None,
            "assigned_stop_id": None,
            "assigned_bus_id": None
        },
        {
            "identifier": "DR-402",
            "name": "Rajesh Kumar",
            "email": "rajesh.driver@rit.edu",
            "password": "driver123",
            "role": "driver",
            "phone": "+91 9876543210",
            "assigned_route_id": 1,
            "assigned_stop_id": None,
            "assigned_bus_id": 1
        },
        {
            "identifier": "DR-405",
            "name": "Suresh Raina",
            "email": "suresh.driver@rit.edu",
            "password": "driver123",
            "role": "driver",
            "phone": "+91 9876543212",
            "assigned_route_id": 2,
            "assigned_stop_id": None,
            "assigned_bus_id": 2
        },
        {
            "identifier": "21CS001",
            "name": "Arjun K",
            "email": "arjun.21cs@rit.edu",
            "password": "student123",
            "role": "student",
            "phone": "+91 9123456780",
            "assigned_route_id": 1,
            "assigned_stop_id": r1_stop_id,
            "assigned_bus_id": 1
        },
        {
            "identifier": "21EC045",
            "name": "Priya S",
            "email": "priya.21ec@rit.edu",
            "password": "student123",
            "role": "student",
            "phone": "+91 9123456781",
            "assigned_route_id": 2,
            "assigned_stop_id": r2_stop_id,
            "assigned_bus_id": 2
        }
    ]

    for ud in users_data:
        existing = db.query(models.User).filter(
            (models.User.identifier == ud["identifier"]) | (models.User.email == ud["email"])
        ).first()

        hashed = hash_password(ud["password"])

        if existing:
            existing.identifier = ud["identifier"]
            existing.name = ud["name"]
            existing.email = ud["email"]
            existing.hashed_password = hashed
            existing.role = ud["role"]
            existing.phone = ud["phone"]
            existing.assigned_route_id = ud["assigned_route_id"]
            existing.assigned_stop_id = ud["assigned_stop_id"]
            existing.assigned_bus_id = ud["assigned_bus_id"]
            print(f"Updated user: {ud['name']} ({ud['identifier']} - {ud['role']})")
        else:
            new_user = models.User(
                identifier=ud["identifier"],
                name=ud["name"],
                email=ud["email"],
                hashed_password=hashed,
                role=ud["role"],
                phone=ud["phone"],
                assigned_route_id=ud["assigned_route_id"],
                assigned_stop_id=ud["assigned_stop_id"],
                assigned_bus_id=ud["assigned_bus_id"]
            )
            db.add(new_user)
            print(f"Created user: {ud['name']} ({ud['identifier']} - {ud['role']})")

    # Ensure Bus.driver_id is linked to the driver users
    dr1 = db.query(models.User).filter(models.User.identifier == "DR-402").first()
    dr2 = db.query(models.User).filter(models.User.identifier == "DR-405").first()
    
    b1 = db.query(models.Bus).filter(models.Bus.id == 1).first()
    if b1 and dr1:
        b1.driver_id = dr1.id
        b1.route_id = 1
    
    b2 = db.query(models.Bus).filter(models.Bus.id == 2).first()
    if b2 and dr2:
        b2.driver_id = dr2.id
        b2.route_id = 2

    db.commit()
    db.close()
    print("All verified users and bus relations successfully synchronized!")

if __name__ == "__main__":
    ensure_columns_and_seed()
