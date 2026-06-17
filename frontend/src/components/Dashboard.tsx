import { useEffect, useState } from 'react';
import axios from 'axios';

interface Stats {
  total_bookings: number;
  top_rooms: Record<string, number>;
  busy_hours: Record<string, number>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    axios.get('/analytics/dashboard')
      .then(res => setStats(res.data))
      .catch(err => console.error("Помилка:", err));
  }, []);

  if (!stats) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-xl font-bold text-gray-500 animate-pulse">Збирання аналітики...</div>
      </div>
    </div>
  );

  // --- ОБРОБКА ДАНИХ ДЛЯ ГРАФІКІВ ---
  
  // 1. Кімнати
  const sortedRooms = Object.entries(stats.top_rooms).sort((a, b) => b[1] - a[1]);
  const maxRoomCount = sortedRooms.length > 0 ? sortedRooms[0][1] : 1;
  const topRoomName = sortedRooms.length > 0 ? sortedRooms[0][0] : "Немає даних";

  // 2. Години
  const sortedHours = Object.entries(stats.busy_hours).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  const maxHourCount = Math.max(...Object.values(stats.busy_hours), 1);
  const busiestHourEntry = Object.entries(stats.busy_hours).sort((a, b) => b[1] - a[1])[0];
  const busiestHour = busiestHourEntry ? `${busiestHourEntry[0]}:00` : "Немає даних";

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800">📊 Дашборд Статистики</h1>
          <p className="text-gray-500 mt-1">Огляд завантаженості офісу та популярності кімнат</p>
        </div>
      </div>
      
      {/* --- ВЕРХНІЙ РЯД: 3 ГОЛОВНІ КАРТКИ (KPI) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Картка 1: Всього бронювань */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-2xl shadow-lg text-white transform hover:-translate-y-1 transition duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 font-semibold text-sm uppercase tracking-wider mb-1">Всього бронювань</p>
              <h3 className="text-5xl font-black">{stats.total_bookings}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-lg text-2xl">📅</div>
          </div>
          <p className="text-blue-100 text-sm mt-4">За весь час роботи системи</p>
        </div>

        {/* Картка 2: Найпопулярніша кімната */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-6 rounded-2xl shadow-lg text-white transform hover:-translate-y-1 transition duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-purple-100 font-semibold text-sm uppercase tracking-wider mb-1">Топ Кімната</p>
              <h3 className="text-3xl font-bold leading-tight line-clamp-2">{topRoomName}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-lg text-2xl">🏆</div>
          </div>
          <p className="text-purple-100 text-sm mt-4">Абсолютний лідер бронювань</p>
        </div>

        {/* Картка 3: Найзавантаженіший час */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-6 rounded-2xl shadow-lg text-white transform hover:-translate-y-1 transition duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-orange-100 font-semibold text-sm uppercase tracking-wider mb-1">Година-Пік</p>
              <h3 className="text-5xl font-black">{busiestHour}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-lg text-2xl">🔥</div>
          </div>
          <p className="text-orange-100 text-sm mt-4">Найбільше зустрічей у цей час</p>
        </div>

      </div>

      {/* --- НИЖНІЙ РЯД: ГРАФІКИ --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Графік 1: Горизонтальний (Кімнати) */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">🏆 Рейтинг популярності кімнат</h3>
          
          <div className="space-y-5">
            {sortedRooms.length === 0 ? (
              <p className="text-gray-400 text-center py-4">Немає даних для графіка</p>
            ) : (
              sortedRooms.map(([room, count], index) => {
                const percentage = Math.round((count / maxRoomCount) * 100);
                return (
                  <div key={room} className="relative">
                    <div className="flex justify-between text-sm font-semibold mb-1 text-gray-700">
                      <span>{index + 1}. {room}</span>
                      <span className="text-purple-600">{count} зустрічей</span>
                    </div>
                    {/* Фон смуги */}
                    <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden">
                      {/* Анімована заповнена смуга */}
                      <div 
                        className="bg-gradient-to-r from-purple-400 to-purple-600 h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Графік 2: Вертикальний (Години навантаження) */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">⏰ Завантаженість по годинах (Протягом дня)</h3>
          
          {sortedHours.length === 0 ? (
             <p className="text-gray-400 text-center py-4">Немає даних для графіка</p>
          ) : (
            // Контейнер для графіка
            <div className="h-64 flex items-end justify-between gap-2 pt-8">
              {sortedHours.map(([hour, count]) => {
                // Вираховуємо висоту стовпчика (мінімум 10%, щоб було видно дрібні значення)
                const heightPercent = Math.max((count / maxHourCount) * 100, 10);
                
                return (
                  <div key={hour} className="group flex flex-col items-center flex-1 h-full justify-end relative">
                    
                    {/* Спливаюча підказка (Tooltip) при наведенні */}
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-10 bg-gray-800 text-white text-xs py-1 px-2 rounded transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {count} бронювань
                    </div>

                    {/* Стовпчик */}
                    <div 
                      className="w-full max-w-[40px] bg-gradient-to-t from-orange-400 to-orange-500 rounded-t-md transition-all duration-500 hover:from-orange-500 hover:to-orange-600 cursor-pointer"
                      style={{ height: `${heightPercent}%` }}
                    ></div>
                    
                    {/* Підпис години під стовпчиком */}
                    <span className="text-xs font-bold text-gray-500 mt-2 rotate-45 md:rotate-0 origin-left">
                      {hour}:00
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}