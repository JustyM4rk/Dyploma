import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminPanel() {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]); // <--- ДОДАНО: Стейт для користувачів
  const [editing, setEditing] = useState<any>(null);
  
  // --- СТЕЙТИ ДЛЯ ФІЛЬТРІВ ---
  const [filterTime, setFilterTime] = useState('all');
  const [filterRoom, setFilterRoom] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // --- СТЕЙТ ДЛЯ СТВОРЕННЯ КІМНАТИ ---
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [roomData, setRoomData] = useState({
    name: '', capacity: 10, location: '', description: '', area: 0, price_per_hour: 0
  });

  // Завантажуємо бронювання, кімнати ТА користувачів одночасно
  const load = async () => {
    try {
      const [roomsRes, bookingsRes, usersRes] = await Promise.all([
        axios.get('http://127.0.0.1:8000/rooms/'),
        axios.get('http://127.0.0.1:8000/bookings/'),
        axios.get('http://127.0.0.1:8000/users/') // <--- ДОДАНО: Запит за користувачами
      ]);
      setRooms(roomsRes.data);
      setUsers(usersRes.data); // <--- Зберігаємо в стейт
      
      const sortedBookings = bookingsRes.data.sort((a: any, b: any) => 
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      );
      setBookings(sortedBookings);
    } catch (error) {
      console.error("Помилка завантаження даних", error);
    }
  };

  useEffect(() => { load() }, []);

  const del = async (id: string) => {
    if(confirm("Видалити цей запис остаточно?")) {
      await axios.delete(`http://127.0.0.1:8000/bookings/${id}`);
      load();
    }
  };

  const approve = async (b: any) => {
    try {
      await axios.put(`http://127.0.0.1:8000/bookings/${b.id}`, { ...b, status: 'confirmed' });
      alert("Бронювання підтверджено! ✅");
      load();
    } catch (e) {
      alert("Помилка оновлення");
    }
  };

  const reject = async (b: any) => {
    if(confirm("Відхилити цю заявку?")) {
      try {
        await axios.put(`http://127.0.0.1:8000/bookings/${b.id}`, { ...b, status: 'rejected' });
        load();
      } catch (e) {
        alert("Помилка оновлення");
      }
    }
  };

  const save = async () => {
    await axios.put(`http://127.0.0.1:8000/bookings/${editing.id}`, editing);
    setEditing(null);
    load();
  };

  const handleCreateRoom = async () => {
    if (!roomData.name) {
      alert("⚠️ Назва кімнати є обов'язковою!");
      return;
    }
    try {
      await axios.post('http://127.0.0.1:8000/rooms/', roomData);
      alert("Кімнату успішно створено! 🎉");
      setIsRoomModalOpen(false);
      setRoomData({ name: '', capacity: 10, location: '', description: '', area: 0, price_per_hour: 0 }); 
      load();
    } catch (e: any) {
      alert("Помилка створення кімнати: " + (e.response?.data?.detail || "Невідома помилка"));
    }
  };

  const getRoomName = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    return room ? room.name : 'Невідома кімната';
  };

  // <--- ДОДАНО: Функція для отримання імені користувача --->
  const getUserName = (userId: string) => {
    const u = users.find(u => u.id === userId);
    return u ? u.name : 'Невідомий користувач';
  };

  // --- ЛОГІКА ФІЛЬТРАЦІЇ ---
  const getFilteredBookings = () => {
    const now = new Date();
    
    return bookings.filter((b: any) => {
      if (filterRoom !== 'all' && b.room_id !== filterRoom) return false;

      const start = new Date(b.start_time);
      const end = new Date(b.end_time);

      if (filterTime === 'upcoming' && start <= now) return false; 
      if (filterTime === 'ongoing' && !(start <= now && end >= now)) return false; 
      if (filterTime === 'completed' && end > now) return false; 

      // <--- ОНОВЛЕНО: Тепер шукає по імені --->
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const userName = getUserName(b.user_id).toLowerCase();
        
        const matchName = userName.includes(query);
        const matchComment = b.comment?.toLowerCase().includes(query);
        
        if (!matchName && !matchComment) return false;
      }

      return true;
    });
  };

  const filteredBookings = getFilteredBookings();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">⚙️ Панель Адміністратора</h1>
        
        <button 
          onClick={() => setIsRoomModalOpen(true)} 
          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 transition shadow-md"
        >
          ➕ Створити кімнату
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 w-full">
          <select 
            className="border border-gray-300 rounded-lg p-2 bg-gray-50 text-gray-700 font-medium w-full md:w-auto"
            value={filterTime} onChange={(e) => setFilterTime(e.target.value)}
          >
            <option value="all">Усі статуси часу</option>
            <option value="upcoming">⏳ Заплановані</option>
            <option value="ongoing">🔥 Тривають зараз</option>
            <option value="completed">✅ Завершені</option>
          </select>

          <select 
            className="border border-gray-300 rounded-lg p-2 bg-gray-50 text-gray-700 font-medium w-full md:w-auto"
            value={filterRoom} onChange={(e) => setFilterRoom(e.target.value)}
          >
            <option value="all">Усі кімнати</option>
            {rooms.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>

          <input 
            type="text" 
            placeholder="🔍 Пошук по Імені користувача або коментарю..." 
            className="border border-gray-300 rounded-lg p-2 bg-gray-50 w-full md:w-80"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="text-sm text-gray-500 font-bold bg-gray-100 px-3 py-1 rounded-lg whitespace-nowrap">
          Знайдено: {filteredBookings.length}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="p-3 text-left">Статус</th>
              <th className="p-3 text-left">Коли</th>
              <th className="p-3 text-left">Інфо</th>
              <th className="p-3 text-center">Дії</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-500">За вашими фільтрами нічого не знайдено.</td>
              </tr>
            ) : (
              filteredBookings.map((b: any) => (
                <tr key={b.id} className={`border-b hover:bg-gray-50 transition 
                  ${b.status === 'pending' ? 'bg-yellow-50' : ''} 
                  ${b.status === 'rejected' ? 'bg-red-50' : ''}`}>
                  
                  <td className="p-3">
                    {b.status === 'pending' && <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs font-bold animate-pulse">⏳ Очікує</span>}
                    {b.status === 'confirmed' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">✅ ОК</span>}
                    {b.status === 'rejected' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">⛔ Відхилено</span>}
                    {!['pending', 'confirmed', 'rejected'].includes(b.status) && <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">{b.status}</span>}
                  </td>

                  <td className="p-3 text-sm">
                    <span className="font-bold">{new Date(b.start_time).toLocaleDateString()}</span><br/>
                    {new Date(b.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} &mdash; {new Date(b.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </td>

                  <td className="p-3 max-w-xs break-words text-sm">
                    <div className="font-bold text-gray-800 text-base">{getRoomName(b.room_id)}</div>
                    {/* <--- ДОДАНО: Виводимо ІМ'Я замість ID ---> */}
                    <div className="text-xs text-blue-800 font-semibold mt-1 bg-blue-50 inline-block px-2 py-0.5 rounded">
                      👤 {getUserName(b.user_id)}
                    </div>
                    {b.services && <div className="text-xs text-blue-600 font-bold mt-1">🛠 {b.services}</div>}
                    {b.comment && <div className="mt-1 italic text-gray-600 border-l-2 border-gray-300 pl-2">"{b.comment}"</div>}
                  </td>

                  <td className="p-3 text-center space-x-2 flex justify-center items-center h-full mt-2">
                    {b.status === 'pending' && (
                      <>
                        <button onClick={() => approve(b)} title="Підтвердити" className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition text-xs">✅</button>
                        <button onClick={() => reject(b)} title="Відхилити" className="bg-orange-500 text-white p-2 rounded hover:bg-orange-600 transition text-xs">⛔</button>
                      </>
                    )}
                    {b.status === 'rejected' && (
                        <button onClick={() => approve(b)} title="Повернути та підтвердити" className="bg-gray-300 text-gray-700 p-2 rounded hover:bg-green-200 transition text-xs">↩️</button>
                    )}
                    <button onClick={() => setEditing(b)} className="bg-blue-400 text-white p-2 rounded hover:bg-blue-500 text-xs shadow-sm">✎</button>
                    <button onClick={() => del(b.id)} className="bg-red-500 text-white p-2 rounded hover:bg-red-600 text-xs shadow-sm">🗑</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Модальні вікна */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
           <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
             <h2 className="text-xl font-bold mb-4">Редагування бронювання</h2>
             <textarea className="border w-full p-2 rounded mb-2" value={editing.comment} onChange={e=>setEditing({...editing, comment: e.target.value})} placeholder="Коментар"/>
             <div className="flex gap-2">
               <button onClick={() => setEditing(null)} className="flex-1 py-2 border rounded hover:bg-gray-50">Скасувати</button>
               <button onClick={save} className="flex-1 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700">Зберегти</button>
             </div>
           </div>
        </div>
      )}

      {isRoomModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
           <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
             <h2 className="text-2xl font-bold mb-4 text-purple-700">Створити нову кімнату</h2>
             <div className="space-y-3">
               <div><label className="block text-sm font-bold text-gray-700">Назва</label><input className="border w-full p-2 rounded" value={roomData.name} onChange={e => setRoomData({...roomData, name: e.target.value})} /></div>
               <div className="flex gap-2">
                 <div className="flex-1"><label className="block text-sm font-bold text-gray-700">Місткість</label><input type="number" className="border w-full p-2 rounded" value={roomData.capacity} onChange={e => setRoomData({...roomData, capacity: parseInt(e.target.value) || 0})} /></div>
                 <div className="flex-1"><label className="block text-sm font-bold text-gray-700">Площа</label><input type="number" className="border w-full p-2 rounded" value={roomData.area} onChange={e => setRoomData({...roomData, area: parseFloat(e.target.value) || 0})} /></div>
               </div>
               <div className="flex gap-2">
                 <div className="flex-1"><label className="block text-sm font-bold text-gray-700">Ціна</label><input type="number" className="border w-full p-2 rounded" value={roomData.price_per_hour} onChange={e => setRoomData({...roomData, price_per_hour: parseFloat(e.target.value) || 0})} /></div>
                 <div className="flex-1"><label className="block text-sm font-bold text-gray-700">Локація</label><input className="border w-full p-2 rounded" value={roomData.location} onChange={e => setRoomData({...roomData, location: e.target.value})} /></div>
               </div>
               <div><label className="block text-sm font-bold text-gray-700">Опис</label><textarea className="border w-full p-2 rounded" rows={3} value={roomData.description} onChange={e => setRoomData({...roomData, description: e.target.value})} /></div>
             </div>
             <div className="flex gap-2 mt-6">
               <button onClick={() => setIsRoomModalOpen(false)} className="flex-1 py-2 border rounded font-bold">Скасувати</button>
               <button onClick={handleCreateRoom} className="flex-1 py-2 bg-purple-600 text-white rounded font-bold">Створити</button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}