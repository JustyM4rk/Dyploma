import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Room {
  id: string;
  name: string;
  capacity: number;
}

export default function BookingPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [comment, setComment] = useState('');
  
  // Стан для AI-прогнозу
  const [prediction, setPrediction] = useState<any>(null);

  const [services, setServices] = useState({
    projector: false,
    coffee: false,
    whiteboard: false
  });

  const navigate = useNavigate();

  // Завантаження кімнат
  useEffect(() => {
    axios.get('http://127.0.0.1:8000/rooms/')
      .then(res => setRooms(res.data))
      .catch(console.error);
  }, []);

  // Ефект для отримання прогнозу AI при зміні часу
  useEffect(() => {
    if (startTime) {
      const date = new Date(startTime);
      const day = date.getDay();  // 0-6 (Неділя-Субота)
      const hour = date.getHours(); // 0-23

      axios.get(`http://127.0.0.1:8000/ml/predict?day=${day}&hour=${hour}`)
        .then(res => setPrediction(res.data))
        .catch(err => console.error("AI Error:", err));
    } else {
      setPrediction(null);
    }
  }, [startTime]);

  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const minDateTime = now.toISOString().slice(0, 16);

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
      const res = await axios.post('http://127.0.0.1:8000/bookings/', bookingData);
      
      // Логіка повідомлень (Pending vs Confirmed)
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
    } catch (error: any) {
      alert("Помилка! " + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">📅 Оберіть кімнату</h1>
      
      {rooms.length === 0 ? (
        <div className="text-center text-gray-500">Завантаження кімнат...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-2xl transition duration-300">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{room.name}</h2>
                  <p className="text-sm text-gray-500">Місткість: {room.capacity} осіб</p>
                </div>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">Вільна</span>
              </div>
              <button 
                onClick={() => setSelectedRoom(room)}
                className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Забронювати
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-bounce-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">{selectedRoom.name}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Початок</label>
                <input type="datetime-local" min={minDateTime} className="w-full p-2 border rounded-lg"
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
                <label className="block text-sm font-medium text-gray-700">Кінець</label>
                <input type="datetime-local" min={minDateTime} className="w-full p-2 border rounded-lg"
                  value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-bold text-sm mb-2">Послуги:</p>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2"><input type="checkbox" checked={services.projector} onChange={e => setServices({...services, projector: e.target.checked})} /><span>📽️ Проектор</span></label>
                  <label className="flex items-center space-x-2"><input type="checkbox" checked={services.coffee} onChange={e => setServices({...services, coffee: e.target.checked})} /><span>☕ Кава</span></label>
                  <label className="flex items-center space-x-2"><input type="checkbox" checked={services.whiteboard} onChange={e => setServices({...services, whiteboard: e.target.checked})} /><span>🖍️ Дошка</span></label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Коментар</label>
                <textarea className="w-full p-2 border rounded-lg" rows={2} value={comment} onChange={e => setComment(e.target.value)} />
              </div>
            </div>
            <div className="mt-6 flex gap-4">
              <button onClick={() => setSelectedRoom(null)} className="flex-1 py-2 border rounded-lg">Скасувати</button>
              <button onClick={handleBooking} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold">Підтвердити</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}