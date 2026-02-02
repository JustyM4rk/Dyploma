import { useEffect, useState } from 'react';
import axios from 'axios';

// Описуємо структуру даних, які приходять з Python
interface Stats {
  total_bookings: number;
  top_rooms: Record<string, number>;
  busy_hours: Record<string, number>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    // Запит до вашого API
    axios.get('http://127.0.0.1:8000/analytics/dashboard')
      .then(res => setStats(res.data))
      .catch(err => console.error("Помилка:", err));
  }, []);

  if (!stats) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl font-bold text-gray-600 animate-pulse">Завантаження даних...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-10 text-center">
          🏨 Система Бронювання: Аналітика
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Картка 1: Всього бронювань */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border-l-8 border-blue-600 transition hover:scale-105 duration-300">
            <h3 className="text-gray-400 font-bold mb-2 uppercase tracking-wider text-sm">Всього бронювань</h3>
            <p className="text-7xl font-black text-blue-600">{stats.total_bookings}</p>
            <p className="text-gray-400 text-sm mt-2">За весь час роботи системи</p>
          </div>

          {/* Картка 2: Топ кімнат */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border-l-8 border-green-500 transition hover:scale-105 duration-300">
            <h3 className="text-gray-400 font-bold mb-6 uppercase tracking-wider text-sm">Найпопулярніші кімнати</h3>
            <ul className="space-y-4">
              {Object.entries(stats.top_rooms).slice(0, 3).map(([room, count], index) => (
                <li key={room} className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <div className="flex items-center">
                    <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold mr-3">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-gray-700 text-lg">{room}</span>
                  </div>
                  <span className="font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}