import random
import uuid
from datetime import datetime, timedelta
from passlib.context import CryptContext

# Імпортуємо ваші налаштування бази даних
from booking_service.database import SessionLocal
from booking_service import models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_database():
    db = SessionLocal()
    """
    # Перевіряємо, чи база вже не заповнена
    if db.query(models.Room).count() > 0:
        print("⚠️ У базі вже є кімнати! Скрипт зупинено, щоб не створювати дублікати.")
        db.close()
        return
    """
    print("⏳ 1. Створюємо кімнати...")
    rooms = [
        models.Room(id=str(uuid.uuid4()), name="Переговорна Alpha", capacity=10, location="1 поверх", description="Проектор, фліпчарт, кулер з водою", area=25.5, price_per_hour=500),
        models.Room(id=str(uuid.uuid4()), name="Переговорна Beta", capacity=6, location="2 поверх", description="Плазма, маркерна дошка", area=15.0, price_per_hour=350),
        models.Room(id=str(uuid.uuid4()), name="Конференц Зал", capacity=50, location="3 поверх", description="Мікрофони, сцена, великий LED-екран", area=120.0, price_per_hour=1500),
        models.Room(id=str(uuid.uuid4()), name="Кімната Відпочинку", capacity=15, location="2 поверх", description="Дивани, PS5, кавомашина", area=40.0, price_per_hour=0),
        models.Room(id=str(uuid.uuid4()), name="Кабінет для 1-1", capacity=2, location="1 поверх", description="Затишне місце для конфіденційних розмов", area=8.0, price_per_hour=150),
    ]
    db.add_all(rooms)
    
    print("⏳ 2. Створюємо користувачів...")
    users = [
        models.User(id=str(uuid.uuid4()), email="admin@test.com", name="Головний Адмін", password_hash=pwd_context.hash("admin"), role="admin", department="Management"),
        models.User(id=str(uuid.uuid4()), email="ivan@test.com", name="Іван Програміст", password_hash=pwd_context.hash("user"), role="user", department="IT"),
        models.User(id=str(uuid.uuid4()), email="olena@test.com", name="Олена HR", password_hash=pwd_context.hash("user"), role="user", department="HR"),
        models.User(id=str(uuid.uuid4()), email="mark@test.com", name="Марко Дизайнер", password_hash=pwd_context.hash("user"), role="user", department="Design"),
    ]
    db.add_all(users)
    db.commit() # Зберігаємо, щоб отримати їх у базі

    print("⏳ 3. Генеруємо історію бронювань...")
    now = datetime.now()
    services_options = ["Проектор", "Кава", "Дошка", "Проектор, Кава", ""]
    
    # Генеруємо 40 бронювань
    for i in range(40):
        room = random.choice(rooms)
        user = random.choice(users)
        
        # Випадковий день (від 10 днів тому до 10 днів у майбутньому)
        days_offset = random.randint(-10, 10)
        # Випадковий час з 9:00 до 18:00
        hour = random.randint(9, 17)
        duration = random.randint(1, 3) # тривалість 1-3 години
        
        start_time = now + timedelta(days=days_offset)
        start_time = start_time.replace(hour=hour, minute=0, second=0, microsecond=0)
        end_time = start_time + timedelta(hours=duration)
        
        # Логіка статусів: якщо в минулому - confirmed, якщо в майбутньому - мікс
        if start_time < now:
            status = "confirmed"
        else:
            status = random.choice(["confirmed", "pending", "pending", "rejected"])
            
        booking = models.Booking(
            id=str(uuid.uuid4()),
            room_id=room.id,
            user_id=user.id,
            start_time=start_time,
            end_time=end_time,
            services=random.choice(services_options),
            comment=f"Робоча зустріч #{i+1}",
            title="Зустріч",
            participants_count=random.randint(2, room.capacity if room.capacity > 1 else 2),
            status=status
        )
        db.add(booking)
        
    db.commit()
    db.close()
    print("✅ Успіх! Базу даних наповнено. Можете перевіряти Дашборд!")

if __name__ == "__main__":
    seed_database()