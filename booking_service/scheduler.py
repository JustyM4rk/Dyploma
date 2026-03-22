from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from .email_service import send_email

# Створюємо глобальний об'єкт планувальника
scheduler = BackgroundScheduler()

def send_reminder_email(user_email: str, user_name: str, room_name: str, start_time: datetime, time_left: str):
    subject = f"🔔 Нагадування: Зустріч у '{room_name}' через {time_left}"
    body = f"Привіт, {user_name}!\n\nНагадуємо, що ваше бронювання почнеться о {start_time.strftime('%H:%M')}.\nКімната: {room_name}\n\nГарної зустрічі та не запізнюйтесь!"
    send_email(user_email, subject, body)

def schedule_booking_reminders(booking_id: str, user_email: str, user_name: str, room_name: str, start_time: datetime):
    now = datetime.now()
    
    # Вираховуємо час для нагадувань
    time_1_hour = start_time - timedelta(hours=1)
    time_10_min = start_time - timedelta(minutes=10)

    # Плануємо за 1 годину (якщо цей час ще не минув у реальності)
    if time_1_hour > now:
        scheduler.add_job(
            send_reminder_email, 
            'date', 
            run_date=time_1_hour, 
            args=[user_email, user_name, room_name, start_time, "1 годину"],
            id=f"remind_1h_{booking_id}",
            replace_existing=True
        )

    # Плануємо за 10 хвилин
    if time_10_min > now:
        scheduler.add_job(
            send_reminder_email, 
            'date', 
            run_date=time_10_min, 
            args=[user_email, user_name, room_name, start_time, "10 хвилин"],
            id=f"remind_10m_{booking_id}",
            replace_existing=True
        )
        
def cancel_booking_reminders(booking_id: str):
    # Якщо бронювання скасовано або відхилено, скасовуємо будильники
    try:
        scheduler.remove_job(f"remind_1h_{booking_id}")
    except: pass
    try:
        scheduler.remove_job(f"remind_10m_{booking_id}")
    except: pass