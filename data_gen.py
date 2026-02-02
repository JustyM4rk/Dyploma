import pandas as pd
from faker import Faker
import random
from datetime import datetime, timedelta

# 1. Ініціалізація
fake = Faker()
NUM_USERS = 100
NUM_ROOMS = 20
NUM_BOOKINGS = 10000 # Почнемо з 10к

print("Генерація даних...")

# --- 2. Генерація Користувачів (users) ---
users_data = []
departments = ['Sales', 'HR', 'Development', 'Marketing', 'Management']
for _ in range(NUM_USERS):
    users_data.append({
        'user_id': fake.uuid4(),
        'name': fake.name(),
        'email': fake.email(),
        'department': random.choice(departments)
        # 'password_hash' - поки пропустимо, це для сервісу
    })

users_df = pd.DataFrame(users_data)
users_df.to_csv('gen_users.csv', index=False)
print(f"Згенеровано {len(users_df)} користувачів.")


# --- 3. Генерація Кімнат (rooms) ---
rooms_data = []
for i in range(NUM_ROOMS):
    rooms_data.append({
        'room_id': fake.uuid4(),
        'name': f"Кімната {100 + i}",
        'capacity': random.choice([5, 10, 10, 15, 20, 25]) # Різні розміри
    })

rooms_df = pd.DataFrame(rooms_data)
rooms_df.to_csv('gen_rooms.csv', index=False)
print(f"Згенеровано {len(rooms_df)} кімнат.")


# --- 4. Генерація Бронювань (bookings) ---
bookings_data = []
# Будемо генерувати бронювання за останній рік
today = datetime.now()
one_year_ago = today - timedelta(days=365)

for _ in range(NUM_BOOKINGS):
    # Генеруємо реалістичний час
    # 80% бронювань у робочий час (9:00 - 17:00)
    if random.random() < 0.8:
        start_hour = random.randint(9, 16)
    else:
        start_hour = random.randint(0, 23)

    # Випадковий день за останній рік
    random_day = one_year_ago + timedelta(days=random.randint(0, 364))
    
    # Випадкова тривалість (30, 60, 90 хв)
    duration = random.choice([30, 60, 90])
    
    start_time = random_day.replace(hour=start_hour, minute=random.choice([0, 30]), second=0, microsecond=0)
    end_time = start_time + timedelta(minutes=duration)

    # Обираємо випадкового юзера та кімнату
    user = random.choice(users_data)
    room = random.choice(rooms_data)

    bookings_data.append({
        'booking_id': fake.uuid4(),
        'user_id': user['user_id'],
        'room_id': room['room_id'],
        'start_time': start_time.isoformat(),
        'end_time': end_time.isoformat(),
        'title': fake.sentence(nb_words=4),
        'participants_count': random.randint(2, room['capacity']) # Кількість людей не більша за місткість
    })

bookings_df = pd.DataFrame(bookings_data)
bookings_df.to_csv('gen_bookings.csv', index=False)
print(f"Згенеровано {len(bookings_df)} бронювань.")

print("\nВсі дані успішно згенеровані та збережені у .csv файли!")