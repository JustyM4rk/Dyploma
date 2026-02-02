from sqlalchemy import text
from booking_service.database import engine

def add_columns():
    print("⏳ Починаю оновлення бази даних...")
    
    with engine.connect() as connection:
        # Увімкнення авто-коміту, щоб зміни точно застосувались
        connection.execution_options(isolation_level="AUTOCOMMIT")
        
        try:
            # 1. Додаємо колонку services
            print("➡️ Додаю колонку 'services'...")
            connection.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS services VARCHAR DEFAULT '';"))
            print("✅ Колонка 'services' додана (або вже існує).")
            
            # 2. Додаємо колонку comment
            print("➡️ Додаю колонку 'comment'...")
            connection.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS comment TEXT DEFAULT '';"))
            print("✅ Колонка 'comment' додана (або вже існує).")
            
        except Exception as e:
            print(f"❌ Помилка: {e}")
            
    print("🎉 Міграція завершена! Перезапустіть DBeaver, щоб побачити зміни.")

if __name__ == "__main__":
    add_columns()