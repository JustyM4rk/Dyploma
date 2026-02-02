from typing import List
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import datetime, timedelta # <--- 1. Додано timedelta

# --- Імпорти модулів ---
from . import models, schemas, crud, analytics, ml_engine
from .database import SessionLocal, engine

# --- Налаштування безпеки (Bcrypt) ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Створення таблиць ---
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Booking Service"
)

# --- Налаштування CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dependency ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==========================================
# API ENDPOINTS
# ==========================================

@app.get("/")
def read_root():
    return {"message": "Booking Service запущено!"}


# --- ЛОГІН ---
@app.post("/login/")
def login(creds: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == creds.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Користувача не знайдено")
    
    if not pwd_context.verify(creds.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Невірний пароль")
    
    return {
        "user_id": user.id,
        "name": user.name,
        "role": user.role,
        "department": user.department
    }


# --- КІМНАТИ ---
@app.get("/rooms/", response_model=List[schemas.Room])
def read_rooms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_rooms(db, skip=skip, limit=limit)

@app.post("/rooms/", response_model=schemas.Room)
def create_new_room(room: schemas.RoomCreate, db: Session = Depends(get_db)):
    db_room = crud.get_room_by_name(db, name=room.name)
    if db_room:
        raise HTTPException(status_code=400, detail="Кімната з такою назвою вже існує")
    return crud.create_room(db=db, room=room)


# --- КОРИСТУВАЧІ ---
@app.post("/users/", response_model=schemas.User)
def create_new_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Цей email вже зареєстровано")
    return crud.create_user(db=db, user=user)


# --- БРОНЮВАННЯ (Створення) ---
@app.post("/bookings/", response_model=schemas.Booking)
def create_new_booking(booking: schemas.BookingCreate, db: Session = Depends(get_db)):
    # --- ВИПРАВЛЕНА ПЕРЕВІРКА ЧАСУ ---
    now = datetime.now()
    booking_start = booking.start_time

    # Прибираємо часовий пояс для коректного порівняння
    if booking_start.tzinfo:
        booking_start = booking_start.replace(tzinfo=None)
    
    # Дозволяємо бронювати, навіть якщо час початку був 15 хвилин тому
    # (це вирішує проблему повільного заповнення форми)
    if booking_start < (now - timedelta(minutes=15)):
        raise HTTPException(status_code=400, detail="Не можна бронювати час у далекому минулому!")
    
    # --- Кінець виправлення ---

    room = db.query(models.Room).filter(models.Room.id == booking.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Кімнату не знайдено")

    is_available = crud.check_availability(
        db, 
        room_id=booking.room_id, 
        start_time=booking.start_time, 
        end_time=booking.end_time
    )
    
    if not is_available:
        raise HTTPException(status_code=409, detail="Кімната зайнята на цей час!")

    return crud.create_booking(db=db, booking=booking)


# --- БРОНЮВАННЯ (Список) ---
@app.get("/bookings/", response_model=List[schemas.Booking])
def read_bookings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_bookings(db, skip=skip, limit=limit)


# --- АДМІНКА: ВИДАЛЕННЯ ---
@app.delete("/bookings/{booking_id}")
def delete_booking(booking_id: str, db: Session = Depends(get_db)):
    deleted = crud.delete_booking(db, booking_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Бронювання не знайдено")
    return {"message": "Успішно видалено"}


# --- АДМІНКА: РЕДАГУВАННЯ ---
@app.put("/bookings/{booking_id}", response_model=schemas.Booking)
def update_booking_info(booking_id: str, booking_update: schemas.BookingUpdate, db: Session = Depends(get_db)):
    updated_booking = crud.update_booking(db, booking_id, booking_update)
    if not updated_booking:
        raise HTTPException(status_code=404, detail="Бронювання не знайдено")
    return updated_booking


# ==========================================
# ANALYTICS & ML
# ==========================================

@app.get("/analytics/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db)):
    return analytics.get_booking_stats(db)

@app.post("/ml/train")
def trigger_training():
    ml_engine.train_model()
    return {"message": "Модель успішно перетренована!"}

@app.get("/ml/predict")
def predict_office_load(day: int, hour: int):
    predicted_count = ml_engine.predict_load(day, hour)
    
    status = "🟢 Вільно"
    if predicted_count > 50:
        status = "🟡 Середнє навантаження"
    if predicted_count > 100:
        status = "🔴 Високе навантаження (перевантаження)"

    return {
        "day_of_week": day,
        "hour": hour,
        "predicted_bookings": predicted_count,
        "status": status
    }