import pandas as pd
from sqlalchemy.orm import Session
# Імпортуємо ваші налаштування БД
from booking_service.database import SessionLocal
from booking_service import models

# Створюємо сесію для роботи з БД
db = SessionLocal()

def seed_data():
    print("🚀 Починаємо імпорт даних...")

    # --- 1. Імпорт Кімнат ---
    print("📦 Імпортуємо кімнати...")
    try:
        rooms_df = pd.read_csv('gen_rooms.csv')
        for _, row in rooms_df.iterrows():
            # Перевіряємо, чи кімната вже є (щоб уникнути помилок при повторному запуску)
            exists = db.query(models.Room).filter(models.Room.id == row['room_id']).first()
            if not exists:
                room = models.Room(
                    id=row['room_id'],
                    name=row['name'],
                    capacity=row['capacity'],
                    location="Головний офіс" # Дефолтне значення
                )
                db.add(room)
        db.commit()
        print("✅ Кімнати завантажено!")
    except Exception as e:
        print(f"❌ Помилка з кімнатами (можливо, файл не знайдено?): {e}")

    # --- 2. Імпорт Користувачів ---
    print("Tw👤 Імпортуємо користувачів...")
    try:
        users_df = pd.read_csv('gen_users.csv')
        # Це хеш пароля '1234'. Ми використовуємо готовий хеш, щоб скрипт працював миттєво.
        dummy_hash = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWrn96pzvPnEyezRIaYeKpiAxvBdYe"
        
        for _, row in users_df.iterrows():
            exists = db.query(models.User).filter(models.User.id == row['user_id']).first()
            if not exists:
                user = models.User(
                    id=row['user_id'],
                    email=row['email'],
                    name=row['name'],
                    department=row['department'],
                    password_hash=dummy_hash,
                    role='user'
                )
                db.add(user)
        db.commit()
        print("✅ Користувачів завантажено!")
    except Exception as e:
        print(f"❌ Помилка з користувачами: {e}")

    # --- 3. Імпорт Бронювань (Bulk Insert) ---
    print("📅 Імпортуємо бронювання (це може зайняти кілька секунд)...")
    try:
        bookings_df = pd.read_csv('gen_bookings.csv')
        
        # Використовуємо список для масової вставки (швидше, ніж по одному)
        bookings_objects = []
        
        # Отримуємо список існуючих ID, щоб не вставляти дублікати
        existing_ids = {str(i[0]) for i in db.query(models.Booking.id).all()}

        for _, row in bookings_df.iterrows():
            if row['booking_id'] not in existing_ids:
                booking = models.Booking(
                    id=row['booking_id'],
                    user_id=row['user_id'],
                    room_id=row['room_id'],
                    start_time=row['start_time'],
                    end_time=row['end_time'],
                    title=row['title'],
                    participants_count=row['participants_count'],
                    status='confirmed'
                )
                bookings_objects.append(booking)
        
        if bookings_objects:
            db.bulk_save_objects(bookings_objects)
            db.commit()
            print(f"✅ Успішно імпортовано {len(bookings_objects)} нових бронювань!")
        else:
            print("ℹ️ Бронювання вже існують, нових не додано.")

    except Exception as e:
        print(f"❌ Помилка з бронюваннями: {e}")

if __name__ == "__main__":
    try:
        seed_data()
    except Exception as e:
        print(f"Критична помилка: {e}")
    finally:
        db.close()