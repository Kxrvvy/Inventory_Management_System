import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Clock, History as HistoryIcon } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem('username') || 'Manufacturer';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    navigate('/');
  };

  const linkCls = (path) =>
    `flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg transition ${
      location.pathname === path
        ? 'bg-neutral-700 text-white'
        : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
    }`;

  return (
    <nav className="bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="text-white font-black uppercase tracking-wide text-sm">Manufacturer Portal</span>
        <button onClick={() => navigate('/requests')} className={linkCls('/requests')}>
          <Clock size={15} /> Pending
        </button>
        <button onClick={() => navigate('/history')} className={linkCls('/history')}>
          <HistoryIcon size={15} /> History
        </button>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-neutral-400 text-xs font-bold">{username}</span>
        <button onClick={handleLogout} className="text-neutral-400 hover:text-red-400 transition" title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
}
