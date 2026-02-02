import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from .database import SessionLocal, engine
from . import models
import pickle # Для збереження навченої моделі
import os

# Шлях до файлу моделі
MODEL_PATH = "booking_model.pkl"

def train_model():
    """
    1. Завантажує дані з БД.
    2. Готує їх (витягує день тижня і годину).
    3. Тренує модель передбачати кількість бронювань.
    4. Зберігає модель у файл.
    """
    print("🧠 Починаємо тренування ML-моделі...")
    db = SessionLocal()
    
    # 1. Завантажуємо дані
    query = db.query(models.Booking.start_time)
    df = pd.read_sql(query.statement, db.bind)
    db.close()

    if df.empty:
        print("❌ Немає даних для навчання!")
        return

    # 2. Підготовка даних (Feature Engineering)
    # Перетворюємо час у дві колонки: 'day_of_week' (0-6) та 'hour' (0-23)
    df['day_of_week'] = df['start_time'].dt.dayofweek
    df['hour'] = df['start_time'].dt.hour
    
    # Групуємо дані: рахуємо скільки бронювань було в кожну годину кожного дня
    # Наприклад: Понеділок 10:00 -> 50 бронювань
    training_data = df.groupby(['day_of_week', 'hour']).size().reset_index(name='booking_count')

    # Вхідні дані (X): День тижня, Година
    X = training_data[['day_of_week', 'hour']]
    # Те, що передбачаємо (y): Кількість бронювань
    y = training_data['booking_count']

    # 3. Тренування (Random Forest)
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)

    # 4. Збереження
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    
    print(f"✅ Модель навчено і збережено у {MODEL_PATH}")
    return model

def predict_load(day_of_week: int, hour: int):
    """
    Завантажує модель і робить прогноз.
    """
    if not os.path.exists(MODEL_PATH):
        # Якщо моделі немає - тренуємо її прямо зараз
        model = train_model()
    else:
        with open(MODEL_PATH, "rb") as f:
            model = pickle.load(f)
    
    # Робимо прогноз
    prediction = model.predict([[day_of_week, hour]])
    return int(prediction[0])