import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Room {
  id: string;
  name: string;
  capacity: number;
  location?: string;
  description?: string;
  area?: number;
  price_per_hour?: number;
}

export default function BookingPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<any[]>([]); // Зберігаємо всі бронювання
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [comment, setComment] = useState('');
  
  const [prediction, setPrediction] = useState<any>(null);

  const [services, setServices] = useState({
    projector: false,
    coffee: false,
    whiteboard: false
  });

  const navigate = useNavigate();

  // Завантажуємо і кімнати, і актуальні бронювання
  const fetchData = async () => {
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        axios.get('/rooms/'),
        axios.get('/bookings/')
      ]);
      setRooms(roomsRes.data);
      setBookings(bookingsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    // Оновлюємо дані щохвилини для актуальності статусів
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (startTime) {
      const date = new Date(startTime);
      const day = date.getDay();  
      const hour = date.getHours(); 

      axios.get(`/ml/predict?day=${day}&hour=${hour}`)
        .then(res => setPrediction(res.data))
        .catch(err => console.error("AI Error:", err));
    } else {
      setPrediction(null);
    }
  }, [startTime]);

  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const minDateTime = now.toISOString().slice(0, 16);

  // Функція: Перевіряє, чи йде зустріч прямо ЗАРАЗ
  const getCurrentStatus = (roomId: string) => {
    const currentTime = new Date();
    const activeBooking = bookings.find((b: any) => {
      if (b.room_id !== roomId || b.status === 'rejected') return false;
      const bStart = new Date(b.start_time);
      const bEnd = new Date(b.end_time);
      return (currentTime >= bStart && currentTime < bEnd); 
    });
    return activeBooking;
  };

  // Функція: Перевіряє накладання обраного часу на існуючі броні
  const checkOverlap = () => {
    if (!startTime || !endTime || !selectedRoom) return false;
    const s = new Date(startTime);
    const e = new Date(endTime);
    
    return bookings.some((b: any) => {
      if (b.room_id !== selectedRoom.id || b.status === 'rejected') return false;
      
      const bStart = new Date(b.start_time);
      const bEnd = new Date(b.end_time);
      
      return (s < bEnd && e > bStart);
    });
  };

  const isOccupied = checkOverlap();
  const isInvalidTime = startTime && endTime && new Date(endTime) <= new Date(startTime);
  const isSubmitDisabled = isOccupied || isInvalidTime || !startTime || !endTime;

  const handleBooking = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      alert("Спочатку увійдіть у систему!");
      navigate('/login');
      return;
    }
    const user = JSON.parse(userStr);

    const servicesList = [];
    if (services.projector) servicesList.push("Проектор");
    if (services.coffee) servicesList.push("Кава");
    if (services.whiteboard) servicesList.push("Дошка");

    const bookingData = {
      room_id: selectedRoom?.id,
      user_id: user.user_id,
      start_time: startTime,
      end_time: endTime,
      services: servicesList.join(", "),
      comment: comment,
      title: "Бронювання"
    };

    try {
      const res = await axios.post('/bookings/', bookingData);
      
      if (res.data.status === 'pending') {
         alert(`⏳ Заявку прийнято! \nОскільки бронювання довше 3-х годин, воно очікує підтвердження адміністратора.`);
      } else {
         alert(`✅ Успішно! Кімнату ${selectedRoom?.name} заброньовано.`);
      }

      setSelectedRoom(null);
      setStartTime('');
      setEndTime('');
      setComment('');
      setPrediction(null);
      fetchData(); // Одразу оновлюємо дані, щоб кімната "зайнялась"
    } catch (error: any) {
      alert("Помилка! " + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto relative z-0">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">📅 Оберіть кімнату</h1>
      
      {rooms.length === 0 ? (
        <div className="text-center text-gray-500">Завантаження кімнат...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const currentActiveBooking = getCurrentStatus(room.id); 
            
            return (
              <div key={room.id} className="group relative bg-white p-6 rounded-xl shadow-lg border border-gray-100 transition-all duration-300 flex flex-col justify-between cursor-pointer hover:shadow-2xl hover:z-10">
                
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{room.name}</h2>
                    <p className="text-sm text-gray-500">👥 Місткість: {room.capacity} осіб</p>
                  </div>
                  
                  {currentActiveBooking ? (
                    <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold animate-pulse text-center leading-tight">
                      🔴 Зайнята до<br/>{new Date(currentActiveBooking.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  ) : (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">
                      🟢 Вільна зараз
                    </span>
                  )}
                </div>

                <div className="absolute top-full left-0 w-full p-4 bg-white border border-gray-100 rounded-b-xl shadow-xl z-20 transition-all duration-300 ease-in-out opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto">
                  <div className="text-sm text-gray-600 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">📍 Поверх:</span>
                      <span>{room.location || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">📏 Площа:</span>
                      <span>{room.area ? `${room.area} кв.м` : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">💰 Ціна:</span>
                      <span className="text-green-600 font-bold">{room.price_per_hour ? `${room.price_per_hour} ₴/год` : 'Безкоштовно'}</span>
                    </div>
                    {room.description && (
                      <div className="mt-2 bg-gray-50 p-2 rounded text-xs text-gray-500 italic">
                        "{room.description}"
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedRoom(room)}
                  className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition relative z-10"
                >
                  Забронювати
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selectedRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-bounce-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">{selectedRoom.name}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Початок</label>
                <input type="datetime-local" min={minDateTime} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={startTime} onChange={e => setStartTime(e.target.value)} />
                
                {prediction && (
                  <div className={`mt-2 p-3 rounded-lg text-sm font-medium border flex items-center gap-2 
                    ${prediction.status.includes("Вільно") ? "bg-green-50 border-green-200 text-green-700" : 
                      prediction.status.includes("Середнє") ? "bg-yellow-50 border-yellow-200 text-yellow-700" : 
                      "bg-red-50 border-red-200 text-red-700"}`}>
                    <span>🤖 AI Прогноз:</span>
                    <span>{prediction.status} ({prediction.predicted_bookings} людей в офісі)</span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Кінець</label>
                <input type="datetime-local" min={minDateTime} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>

              {isInvalidTime && (
                <div className="p-3 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg text-sm font-bold flex items-center gap-2">
                  ⚠️ Час завершення має бути пізніше часу початку!
                </div>
              )}

              {isOccupied && !isInvalidTime && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-bold flex items-center gap-2 animate-pulse">
                  🚫 Ця кімната вже заброньована на вибраний вами час!
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-bold text-sm mb-2">Додаткові послуги:</p>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" className="accent-blue-600 w-4 h-4" checked={services.projector} onChange={e => setServices({...services, projector: e.target.checked})} /><span>📽️ Проектор</span></label>
                  <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" className="accent-blue-600 w-4 h-4" checked={services.coffee} onChange={e => setServices({...services, coffee: e.target.checked})} /><span>☕ Кава / Чай</span></label>
                  <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" className="accent-blue-600 w-4 h-4" checked={services.whiteboard} onChange={e => setServices({...services, whiteboard: e.target.checked})} /><span>🖍️ Маркерна дошка</span></label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Коментар до зустрічі</label>
                <textarea className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" rows={2} value={comment} onChange={e => setComment(e.target.value)} placeholder="Наприклад: Підготувати 5 стільців додатково" />
              </div>
            </div>
            
            <div className="mt-6 flex gap-4">
              <button onClick={() => setSelectedRoom(null)} className="flex-1 py-2 border rounded-lg hover:bg-gray-50 font-medium">Скасувати</button>
              
              <button 
                onClick={handleBooking} 
                disabled={isSubmitDisabled}
                className={`flex-1 py-2 text-white rounded-lg font-bold transition ${isSubmitDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg'}`}
              >
                Підтвердити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}