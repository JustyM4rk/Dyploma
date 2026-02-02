import { useEffect, useState } from 'react';
import axios from 'axios';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const fetchData = async () => {
    try {
      const roomsRes = await axios.get('http://127.0.0.1:8000/rooms/');
      setRooms(roomsRes.data);

      const bookingsRes = await axios.get('http://127.0.0.1:8000/bookings/');
      // Фільтруємо тільки мої бронювання
      const myBookings = bookingsRes.data.filter((b: any) => b.user_id === user?.user_id);
      
      // Сортуємо: спочатку новіші
      myBookings.sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
      
      setBookings(myBookings);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, []);

  const handleCancel = async (id: string) => {
    if (confirm("Ви впевнені, що хочете видалити цей запис?")) {
      try {
        await axios.delete(`http://127.0.0.1:8000/bookings/${id}`);
        fetchData();
      } catch (e) {
        alert("Не вдалося скасувати");
      }
    }
  };

  const getRoomName = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    return room ? room.name : 'Невідома кімната';
  };

  // --- ФУНКЦІЯ ДЛЯ ВІДОБРАЖЕННЯ СТАТУСУ ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="bg-green-100 text-green-700 border border-green-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            ✅ Підтверджено
          </span>
        );
      case 'pending':
        return (
          <span className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
            ⏳ Очікує підтвердження
          </span>
        );
      case 'rejected':
        return (
          <span className="bg-red-100 text-red-700 border border-red-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            ⛔ Відхилено
          </span>
        );
      default:
        return <span className="text-gray-500 text-xs">{status}</span>;
    }
  };

  if (!user) return <div className="p-8 text-center">Будь ласка, увійдіть у систему.</div>;
  if (loading) return <div className="p-8 text-center">Завантаження...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">📂 Мої бронювання</h1>

      {bookings.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow text-center text-gray-500 border border-dashed border-gray-300">
          <p className="text-xl mb-2">У вас ще немає бронювань 🤷‍♂️</p>
          <p className="text-sm">Перейдіть на сторінку "Забронювати", щоб створити нове.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b: any) => (
            <div key={b.id} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-lg transition">
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-gray-800">{getRoomName(b.room_id)}</h2>
                  {/* Відображення статусу */}
                  {getStatusBadge(b.status)}
                </div>

                <div className="text-gray-600 text-sm">
                  <span className="font-semibold">📅 {new Date(b.start_time).toLocaleDateString()}</span>
                  <span className="mx-2">|</span>
                  ⏰ {new Date(b.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                  &mdash; {new Date(b.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>

                {b.comment && (
                  <div className="mt-2 text-sm bg-gray-50 p-2 rounded border border-gray-100 inline-block">
                    📝 <span className="italic text-gray-600">{b.comment}</span>
                  </div>
                )}
                {b.services && <div className="text-xs text-blue-600 font-bold mt-1 uppercase tracking-wide">🛠 {b.services}</div>}
              </div>
              
              <button 
                onClick={() => handleCancel(b.id)}
                className="bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400 px-4 py-2 rounded-lg font-medium transition text-sm whitespace-nowrap"
              >
                🗑 Видалити
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}