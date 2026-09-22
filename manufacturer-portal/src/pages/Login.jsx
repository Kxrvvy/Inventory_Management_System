import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const body = new URLSearchParams();
    body.append('username', username);
    body.append('password', password);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Login failed');

      if (data.role !== 'manufacturer') {
        throw new Error('This account does not have manufacturer portal access.');
      }

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('username', data.username);
      navigate('/requests');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900 p-4">
      <div className="w-full max-w-sm bg-neutral-800 border border-neutral-700 rounded-2xl p-8 shadow-xl">
        <h1 className="text-white text-xl font-black uppercase tracking-wide mb-1">Manufacturer Portal</h1>
        <p className="text-neutral-400 text-xs mb-6">Puppet's Directory restock requests</p>

        {error && (
          <div className="mb-4 p-3 bg-red-900/40 border border-red-500/50 text-red-200 rounded-lg text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-neutral-300 text-xs mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="w-full bg-neutral-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-neutral-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-neutral-300 text-xs mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-neutral-700 text-white text-sm rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-neutral-500 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-200 hover:bg-white text-gray-900 font-bold py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
