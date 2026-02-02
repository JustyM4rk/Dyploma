from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base
import uuid

# Генератор UUID для нових записів
def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    password_hash = Column(String)
    department = Column(String, nullable=True)
    role = Column(String, default="user")

    bookings = relationship("Booking", back_populates="user")

class Room(Base):
    __tablename__ = "rooms"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, unique=True, index=True)
    capacity = Column(Integer)
    location = Column(String, nullable=True)
    
    bookings = relationship("Booking", back_populates="room")

class Booking(Base):
    __tablename__ = "bookings"
    
    # ВАЖЛИВО: ID - це рядок (UUID)
    id = Column(String, primary_key=True, default=generate_uuid)
    
    room_id = Column(String, ForeignKey("rooms.id"))
    user_id = Column(String, ForeignKey("users.id"))
    
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    status = Column(String, default="confirmed") # На скріншоті у вас 'confirmed'
    
    # НОВІ КОЛОНКИ (які ми додали)
    services = Column(String, default="")
    comment = Column(Text, default="")
    
    # КОЛОНКИ З ВАШОЇ БАЗИ (щоб не було помилок)
    title = Column(String, nullable=True)
    participants_count = Column(Integer, default=1)

    user = relationship("User", back_populates="bookings")
    room = relationship("Room", back_populates="bookings")