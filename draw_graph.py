import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import requests

# URL вашого API
API_URL = "http://127.0.0.1:8000/ml/predict"

def generate_heatmap():
    print("⏳ Генеруємо дані для графіка (це займе пару секунд)...")
    
    data = []
    days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"]
    
    # Проходимо по кожному дню (0-6) і кожній годині (0-23)
    for day in range(7):
        row = []
        for hour in range(24):
            try:
                # Робимо запит до вашого ML-двигуна
                response = requests.get(f"{API_URL}?day={day}&hour={hour}")
                if response.status_code == 200:
                    count = response.json()['predicted_bookings']
                    row.append(count)
                else:
                    row.append(0)
            except Exception:
                row.append(0)
        data.append(row)

    # Створюємо DataFrame для зручності
    df = pd.DataFrame(data, columns=[f"{h}:00" for h in range(24)], index=days)

    # Малюємо графік
    plt.figure(figsize=(15, 6))
    # cmap="RdYlGn_r" робить мале навантаження зеленим, а велике - червоним
    sns.heatmap(df, cmap="RdYlGn_r", annot=False, linewidths=.5)
    
    plt.title("Прогноз завантаженості офісу (ML Heatmap)")
    plt.xlabel("Година доби")
    plt.ylabel("День тижня")
    
    # Зберігаємо у файл
    plt.tight_layout()
    plt.savefig("office_load_prediction.png")
    print("✅ Графік збережено як 'office_load_prediction.png'!")
    # Якщо ви запускаєте на сервері без екрану, закоментуйте рядок нижче
    # plt.show() 

if __name__ == "__main__":
    generate_heatmap()