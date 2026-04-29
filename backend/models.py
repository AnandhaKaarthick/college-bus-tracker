from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    hashed_password = Column(String(255))
    role = Column(String(20)) # "admin", "driver", "student"

class Bus(Base):
    __tablename__ = "buses"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True) # e.g. "Bus 04"
    route_name = Column(String(100))
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=True)

class BusLivePosition(Base):
    __tablename__ = "bus_live_positions"
    bus_id = Column(Integer, ForeignKey("buses.id"), primary_key=True, index=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    speed = Column(Float, default=0.0)
    heading = Column(Float, nullable=True)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    status = Column(String(20), default="active") # active, idle, offline
    occupancy = Column(String(20), default="low") # low, medium, full

class BusLocationLog(Base):
    __tablename__ = "bus_location_logs"
    id = Column(Integer, primary_key=True, index=True)
    bus_id = Column(Integer, ForeignKey("buses.id"), index=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
