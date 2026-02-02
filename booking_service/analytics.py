from sqlalchemy.orm import Session
from . import models
import pandas as pd

def get_booking_stats(db: Session):
    """
    Аналізує історію бронювань і повертає статистику.
    """
    # 1. Витягуємо дані з БД
    # Ми беремо тільки потрібні колонки: назву кімнати, час початку
    query = db.query(
        models.Booking.id,
        models.Booking.start_time,
        models.Room.name.label('room_name')
    ).join(models.Room, models.Booking.room_id == models.Room.id)

    # 2. Завантажуємо це в Pandas DataFrame
    # Це дозволяє працювати з даними як з таблицею Excel в пам'яті
    df = pd.read_sql(query.statement, db.bind)

    if df.empty:
        return {"message": "Немає даних для аналізу"}

    # --- АНАЛІЗ 1: Топ-5 популярних кімнат ---
    # Групуємо по назві кімнати -> рахуємо кількість -> сортуємо -> беремо топ 5
    top_rooms = df['room_name'].value_counts().head(5).to_dict()

    # --- АНАЛІЗ 2: Завантаженість по годинах дня ---
    # Витягуємо годину з часу початку (dt.hour)
    df['hour'] = df['start_time'].dt.hour
    busy_hours = df['hour'].value_counts().sort_index().to_dict()

    return {
        "total_bookings": len(df),
        "top_rooms": top_rooms,
        "busy_hours": busy_hours
    }