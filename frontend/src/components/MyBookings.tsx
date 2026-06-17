import { useEffect, useState } from 'react';
import axios from 'axios';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Стейт для фільтрів ---
  const [filterTime, setFilterTime] = useState('all'); // 'all', 'upcoming', 'ongoing', 'completed'
  const [filterRoom, setFilterRoom] = useState('all');

  // --- Стейт для редагування ---
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [editServices, setEditServices] = useState({ projector: false, coffee: false, whiteboard: false });
  const [editComment, setEditComment] = useState('');

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const fetchData = async () => {
    try {
      const roomsRes = await axios.get('/rooms/');
      setRooms(roomsRes.data);

      const bookingsRes = await axios.get('/bookings/');
      
      // Залишаємо тільки бронювання поточного користувача
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
    if (confirm("Ви впевнені, що хочете скасувати це бронювання?")) {
      try {
        await axios.delete(`/bookings/${id}`);
        fetchData();
      } catch (e) {
        alert("Не вдалося скасувати");
      }
    }
  };

  // --- ЛОГІКА РЕДАГУВАННЯ ---
  const openEditModal = (b: any) => {
    setEditingBooking(b);
    setEditComment(b.comment || '');
    const s = b.services || '';
    setEditServices({
      projector: s.includes('Проектор'),
      coffee: s.includes('Кава'),
      whiteboard: s.includes('Дошка')
    });
  };

  const saveEdit = async () => {
    const servicesList = [];
    if (editServices.projector) servicesList.push("Проектор");
    if (editServices.coffee) servicesList.push("Кава");
    if (editServices.whiteboard) servicesList.push("Дошка");

    try {
      await axios.put(`/bookings/${editingBooking.id}`, {
        services: servicesList.join(', '),
        comment: editComment
      });
      alert("Бронювання успішно оновлено! ✅");
      setEditingBooking(null);
      fetchData();
    } catch (e) {
      alert("Помилка оновлення");
    }
  };

  // --- ЛОГІКА ФІЛЬТРАЦІЇ ---
  const getFilteredBookings = () => {
    const now = new Date();
    
    return bookings.filter((b: any) => {
      // 1. Фільтр за кімнатою
      if (filterRoom !== 'all' && b.room_id !== filterRoom) return false;

      // 2. Фільтр за часом
      const start = new Date(b.start_time);
      const end = new Date(b.end_time);

      if (filterTime === 'upcoming' && start <= now) return false; // Тільки ті, що ще не почались
      if (filterTime === 'ongoing' && !(start <= now && end >= now)) return false; // Тільки ті, що йдуть прямо зараз
      if (filterTime === 'completed' && end > now) return false; // Тільки ті, що вже закінчились

      return true;
    });
  };

  const filteredBookings = getFilteredBookings();

  const getRoomName = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    return room ? room.name : 'Невідома кімната';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <span className="bg-green-100 text-green-700 border border-green-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">✅ Підтверджено</span>;
      case 'pending': return <span className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">⏳ Очікує підтвердження</span>;
      case 'rejected': return <span className="bg-red-100 text-red-700 border border-red-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">⛔ Відхилено</span>;
      default: return <span className="text-gray-500 text-xs">{status}</span>;
    }
  };

  if (!user) return <div className="p-8 text-center">Будь ласка, увійдіть у систему.</div>;
  if (loading) return <div className="p-8 text-center">Завантаження...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">📂 Мої бронювання</h1>

      {/* --- ПАНЕЛЬ ФІЛЬТРІВ --- */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-gray-500 font-bold">🔍 Фільтри:</span>
        </div>
        
        <select 
          className="border border-gray-300 rounded-lg p-2 bg-gray-50 text-gray-700 font-medium w-full md:w-auto"
          value={filterTime} 
          onChange={(e) => setFilterTime(e.target.value)}
        >
          <option value="all">Усі часи</option>
          <option value="upcoming">⏳ Заплановані (Майбутні)</option>
          <option value="ongoing">🔥 Тривають зараз</option>
          <option value="completed">✅ Завершені</option>
        </select>

        <select 
          className="border border-gray-300 rounded-lg p-2 bg-gray-50 text-gray-700 font-medium w-full md:w-auto"
          value={filterRoom} 
          onChange={(e) => setFilterRoom(e.target.value)}
        >
          <option value="all">Усі кімнати</option>
          {rooms.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        
        <div className="md:ml-auto text-sm text-gray-500 font-medium">
          Знайдено: {filteredBookings.length}
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow text-center text-gray-500 border border-dashed border-gray-300">
          <p className="text-xl mb-2">За вашими критеріями бронювань не знайдено 🤷‍♂️</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b: any) => (
            <div key={b.id} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-lg transition">
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-gray-800">{getRoomName(b.room_id)}</h2>
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
              
              <div className="flex gap-2 w-full md:w-auto">
                <button 
                  onClick={() => openEditModal(b)}
                  className="flex-1 md:flex-none bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg font-medium transition text-sm whitespace-nowrap"
                >
                  ✏️ Редагувати
                </button>
                <button 
                  onClick={() => handleCancel(b.id)}
                  className="flex-1 md:flex-none bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400 px-4 py-2 rounded-lg font-medium transition text-sm whitespace-nowrap"
                >
                  ❌ Скасувати
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- МОДАЛЬНЕ ВІКНО РЕДАГУВАННЯ --- */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-bounce-in">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Редагування бронювання</h2>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="font-bold text-sm mb-2">Додаткові послуги:</p>
              <div className="space-y-2 text-sm">
                <label className="flex items-center space-x-2"><input type="checkbox" checked={editServices.projector} onChange={e => setEditServices({...editServices, projector: e.target.checked})} /><span>📽️ Проектор</span></label>
                <label className="flex items-center space-x-2"><input type="checkbox" checked={editServices.coffee} onChange={e => setEditServices({...editServices, coffee: e.target.checked})} /><span>☕ Кава</span></label>
                <label className="flex items-center space-x-2"><input type="checkbox" checked={editServices.whiteboard} onChange={e => setEditServices({...editServices, whiteboard: e.target.checked})} /><span>🖍️ Дошка</span></label>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Коментар</label>
              <textarea className="w-full p-2 border rounded-lg text-sm" rows={3} value={editComment} onChange={e => setEditComment(e.target.value)} placeholder="Додайте коментар..." />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setEditingBooking(null)} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-bold">Закрити</button>
              <button onClick={saveEdit} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-bold">Зберегти зміни</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}