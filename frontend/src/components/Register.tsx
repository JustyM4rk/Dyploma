import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    department: ''
  });
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      await axios.post('http://127.0.0.1:8000/users/', formData);
      alert("Реєстрація успішна! Тепер увійдіть.");
      navigate('/login');
    } catch (e: any) {
      alert("Помилка: " + (e.response?.data?.detail || "Щось пішло не так"));
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">Реєстрація</h1>
        <div className="space-y-3">
          <input className="w-full border p-2 rounded" placeholder="Email" 
            onChange={e => setFormData({...formData, email: e.target.value})} />
          <input className="w-full border p-2 rounded" type="password" placeholder="Пароль" 
            onChange={e => setFormData({...formData, password: e.target.value})} />
          <input className="w-full border p-2 rounded" placeholder="ПІБ (напр. Іван Петренко)" 
            onChange={e => setFormData({...formData, name: e.target.value})} />
          <input className="w-full border p-2 rounded" placeholder="Відділ (напр. IT)" 
            onChange={e => setFormData({...formData, department: e.target.value})} />
          
          <button onClick={handleRegister} className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700 mt-4">
            Зареєструватися
          </button>
          
          <div className="text-center text-sm mt-4">
            <span className="text-gray-500">Вже є акаунт? </span>
            <a href="/login" className="text-blue-600 font-bold hover:underline">Увійти</a>
          </div>
        </div>
      </div>
    </div>
  );
}