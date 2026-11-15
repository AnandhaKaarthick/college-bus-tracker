from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text, Enum, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    identifier = Column(String(50), unique=True, index=True, nullable=True) # Roll No (e.g. 21CS001), Driver ID (DR-402), or Email
    name = Column(String(100))
    email = Column(String(150), unique=True, index=True)
    hashed_password = Column(String(255))
    role = Column(String(20))  # student, driver, admin
    phone = Column(String(20))
    assigned_route_id = Column(Integer, ForeignKey("routes.id"), nullable=True)
    assigned_stop_id = Column(Integer, ForeignKey("stops.id"), nullable=True)
    assigned_bus_id = Column(Integer, ForeignKey("buses.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Route(Base):
    __tablename__ = "routes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    color = Column(String(20), default="#3B82F6")
    # Store polyline as a JSON string for simplicity in SQLite
    polyline_json = Column(Text) 
    
    stops = relationship("Stop", back_populates="route", order_by="Stop.order")

class Stop(Base):
    __tablename__ = "stops"
    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id"))
    name = Column(String(100))
    lat = Column(Float)
    lng = Column(Float)
    order = Column(Integer)
    
    route = relationship("Route", back_populates="stops")

class Bus(Base):
    __tablename__ = "buses"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_number = Column(String(20), unique=True, index=True)
    name = Column(String(50)) # Display name like "Bus 04"
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=True)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=True, unique=True)
    status = Column(String(20), default="offline") # on_track, delayed, idle, offline
    status_since = Column(DateTime(timezone=True), server_default=func.now())
    occupancy = Column(String(20), default="low") # low, medium, full
    capacity = Column(Integer, default=40)
    is_active = Column(Boolean, default=True)

class BusLivePosition(Base):
    __tablename__ = "bus_live_positions"
    bus_id = Column(Integer, ForeignKey("buses.id"), primary_key=True, index=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    speed = Column(Float, default=0.0)
    heading = Column(Float, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class BusLocationLog(Base):
    __tablename__ = "bus_location_logs"
    id = Column(Integer, primary_key=True, index=True)
    bus_id = Column(Integer, ForeignKey("buses.id"), index=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    speed = Column(Float, default=0.0)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    bus_id = Column(Integer, ForeignKey("buses.id"), nullable=True)
    triggered_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    type = Column(String(20)) # panic, breakdown, delay, accident, suspicious_activity, overcrowding
    severity = Column(String(20), default="low") # critical, high, medium, low
    lat = Column(Float)
    lng = Column(Float)
    message = Column(Text)
    status = Column(String(20), default="active") # active, acknowledged, resolved
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Announcement(Base):
    __tablename__ = "announcements"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200))
    message = Column(Text)
    target_type = Column(String(50)) # global, route-specific
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("users.id"))
    sender = Column(String(20)) # admin, driver
    text = Column(Text)
    sent_at = Column(DateTime(timezone=True), server_default=func.now())

class BusDailyStat(Base):
    __tablename__ = "bus_daily_stats"
    id = Column(Integer, primary_key=True, index=True)
    bus_id = Column(Integer, ForeignKey("buses.id"))
    date = Column(Date, default=datetime.now().date)
    km_today = Column(Float, default=0.0)

class RouteSchedule(Base):
    __tablename__ = "route_schedules"
    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id"))
    stop_id = Column(Integer, ForeignKey("stops.id"))
    expected_arrival = Column(String(10)) # "HH:MM"
    
class StopArrival(Base):
    __tablename__ = "stop_arrivals"
    id = Column(Integer, primary_key=True, index=True)
    bus_id = Column(Integer, ForeignKey("buses.id"))
    stop_id = Column(Integer, ForeignKey("stops.id"))
    arrived_at = Column(DateTime(timezone=True), server_default=func.now())
