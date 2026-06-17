from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# 1. Рядок підключення до БД
#    Формат: "postgresql://USER:PASSWORD@HOST:PORT/DB_NAME"
#    Ці дані ми взяли з вашого docker-compose.yml
DATABASE_URL = "postgresql://user:password@localhost:5432/booking_db"

# 2. Створення "рушія" (engine)
#    Це головний об'єкт SQLAlchemy для роботи з БД
engine = create_engine(DATABASE_URL)

# 3. Створення "фабрики" сесій
#    Сесія - це ваш "посередник" для спілкування з БД
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Створення базового класу для моделей
#    Всі наші класи-таблиці (models) будуть наслідувати його
Base = declarative_base()