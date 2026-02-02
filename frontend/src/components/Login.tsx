import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('');
    try {
      // Відправляємо і email, і пароль
      const res = await axios.post('http://127.0.0.1:8000/login/', { email, password });
      
      // Зберігаємо дані
      localStorage.setItem('user', JSON.stringify(res.data));
      
      // Переадресація залежно від ролі
      if (res.data.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/booking');
      }
      
    } catch (e: any) {
      console.error(e);
      // Якщо помилка від сервера - показуємо її, інакше загальну
      const errorMsg = e.response?.data?.detail || 'Невірний логін або пароль!';
      setError(errorMsg);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">Вхід у систему</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="email@example.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
            <input 
              className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
              type="password" 
              placeholder="Ваш пароль" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
          </div>

          <button 
            onClick={handleLogin} 
            className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 transition"
          >
            Увійти
          </button>
        </div>
      </div>
    </div>
  );
}