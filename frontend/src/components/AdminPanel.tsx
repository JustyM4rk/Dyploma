import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminPanel() {
  const [bookings, setBookings] = useState([]);
  const [editing, setEditing] = useState<any>(null);

  const load = () => axios.get('http://127.0.0.1:8000/bookings/').then(r => setBookings(r.data));
  useEffect(() => { load() }, []);

  const del = async (id: string) => {
    if(confirm("Видалити цей запис остаточно?")) {
      await axios.delete(`http://127.0.0.1:8000/bookings/${id}`);
      load();
    }
  };

  // Функція схвалення (Approve)
  const approve = async (b: any) => {
    try {
      await axios.put(`http://127.0.0.1:8000/bookings/${b.id}`, { ...b, status: 'confirmed' });
      alert("Бронювання підтверджено! ✅");
      load();
    } catch (e) {
      alert("Помилка оновлення");
    }
  };

  // Функція відхилення (Reject)
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

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">⚙️ Панель Адміністратора</h1>
      
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
            {bookings.map((b: any) => (
              <tr key={b.id} className={`border-b hover:bg-gray-50 
                ${b.status === 'pending' ? 'bg-yellow-50' : ''} 
                ${b.status === 'rejected' ? 'bg-red-50' : ''}`}>
                
                <td className="p-3">
                  {b.status === 'pending' && (
                    <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs font-bold animate-pulse">⏳ Очікує</span>
                  )}
                  {b.status === 'confirmed' && (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">✅ ОК</span>
                  )}
                  {b.status === 'rejected' && (
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">⛔ Відхилено</span>
                  )}
                  {/* Якщо статус невідомий або старий */}
                  {!['pending', 'confirmed', 'rejected'].includes(b.status) && (
                     <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">{b.status}</span>
                  )}
                </td>

                <td className="p-3 text-sm">
                  {new Date(b.start_time).toLocaleString()} <br/>
                  ⬇️ <br/>
                  {new Date(b.end_time).toLocaleString()}
                </td>

                <td className="p-3 max-w-xs break-words text-sm">
                  <div>Room: {b.room_id.slice(0,4)}...</div>
                  {b.comment && <div className="italic text-gray-600">"{b.comment}"</div>}
                </td>

                <td className="p-3 text-center space-x-2 flex justify-center items-center">
                  
                  {/* Кнопки для Pending (Очікує) */}
                  {b.status === 'pending' && (
                    <>
                      <button onClick={() => approve(b)} title="Підтвердити" className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition text-xs">
                        ✅
                      </button>
                      <button onClick={() => reject(b)} title="Відхилити" className="bg-orange-500 text-white p-2 rounded hover:bg-orange-600 transition text-xs">
                        ⛔
                      </button>
                    </>
                  )}

                  {/* Кнопка "Повернути" для Rejected (якщо помилково відхилили) */}
                  {b.status === 'rejected' && (
                      <button onClick={() => approve(b)} title="Все ж таки підтвердити" className="bg-gray-300 text-gray-700 p-2 rounded hover:bg-green-200 transition text-xs">
                        ↩️
                      </button>
                  )}

                  {/* Стандартні кнопки */}
                  <button onClick={() => setEditing(b)} className="bg-blue-400 text-white p-2 rounded hover:bg-blue-500 text-xs">✎</button>
                  <button onClick={() => del(b.id)} className="bg-red-500 text-white p-2 rounded hover:bg-red-600 text-xs">🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Модальне вікно редагування */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
           <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
             <h2 className="text-xl font-bold mb-4">Редагування</h2>
             <textarea className="border w-full p-2 rounded mb-2" value={editing.comment} onChange={e=>setEditing({...editing, comment: e.target.value})} placeholder="Коментар"/>
             <div className="flex gap-2">
               <button onClick={() => setEditing(null)} className="flex-1 py-2 border rounded">Скасувати</button>
               <button onClick={save} className="flex-1 py-2 bg-green-600 text-white rounded">Зберегти</button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}