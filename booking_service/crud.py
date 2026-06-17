from sqlalchemy.orm import Session
import models, schemas
from passlib.context import CryptContext
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

# --- USER ---
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

# --- Отримання списку всіх користувачів ---
def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email, 
        name=user.name, 
        password_hash=hashed_password, 
        department=user.department,
        role="user"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- BOOKING ---
def get_bookings(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Booking).order_by(models.Booking.start_time.desc()).offset(skip).limit(limit).all()

def create_booking(db: Session, booking: schemas.BookingCreate):
    # Розрахунок тривалості у годинах
    duration_hours = (booking.end_time - booking.start_time).total_seconds() / 3600
    
    # Якщо більше 3 годин - статус "pending", інакше "confirmed"
    initial_status = "pending" if duration_hours > 3 else "confirmed"

    db_booking = models.Booking(
        room_id=booking.room_id,
        user_id=booking.user_id,
        start_time=booking.start_time,
        end_time=booking.end_time,
        services=booking.services,
        comment=booking.comment,
        title=booking.title,
        participants_count=booking.participants_count,
        status=initial_status # <--- Оновлена логіка
    )
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking

def delete_booking(db: Session, booking_id: str):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if booking:
        db.delete(booking)
        db.commit()
        return True
    return False

def update_booking(db: Session, booking_id: str, booking: schemas.BookingUpdate):
    db_booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not db_booking:
        return None
    
    update_data = booking.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_booking, key, value)
    
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking

def check_availability(db: Session, room_id: str, start_time: datetime, end_time: datetime, skip_booking_id: str = None):
    query = db.query(models.Booking).filter(
        models.Booking.room_id == room_id,
        models.Booking.end_time > start_time,
        models.Booking.start_time < end_time
    )
    if skip_booking_id:
        query = query.filter(models.Booking.id != skip_booking_id)
    return query.first() is None

# --- ROOMS ---
def get_rooms(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Room).offset(skip).limit(limit).all()

def get_room_by_name(db: Session, name: str):
    return db.query(models.Room).filter(models.Room.name == name).first()

def create_room(db: Session, room: schemas.RoomCreate):
    db_room = models.Room(
        name=room.name, 
        capacity=room.capacity, 
        location=room.location,
        description=room.description,
        area=room.area,
        price_per_hour=room.price_per_hour
    )
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room
