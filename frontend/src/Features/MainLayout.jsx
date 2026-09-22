import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Package } from 'lucide-react';
import AdminNavbar from './Admin/admin-navbar';
import LogoutModal from '../Features/logoutModal';

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userData, setUserData] = useState({ name: '', role: '' });
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // POS manages its own top bar — don't duplicate a header above it
  const isPOS = location.pathname === '/pos';

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
    setIsLogoutModalOpen(false);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('http://localhost:8000/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Session expired');
        return res.json();
      })
      .then((data) => setUserData({ name: data.username, role: data.role }))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="relative flex min-h-screen bg-gray-50">

      {/* ── Mobile backdrop ── */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <AdminNavbar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        userName={userData.name}
        userRole={userData.role}
        onLogout={() => setIsLogoutModalOpen(true)}
      />

      {/* ── Page content ── */}
      <main
        className={`flex-1 min-w-0 transition-all duration-300 ${
          isSidebarOpen ? 'md:ml-64' : 'md:ml-20'
        }`}
      >
        {/* Mobile top bar — hidden on POS (POS adds its own hamburger) */}
        {!isPOS && (
          <div className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
            >
              <Menu size={18} className="text-gray-700" />
            </button>
            <div className="flex items-center gap-2">
              <Package size={15} className="text-slate-600" />
              <span className="font-black text-sm text-slate-800 tracking-wide">
                PUPPET'S DIRECTORY
              </span>
            </div>
          </div>
        )}

        {/* Pass sidebar opener down so POS can put it in its own top bar */}
        <Outlet context={{ openSidebar: () => setIsSidebarOpen(true) }} />
      </main>

      {isLogoutModalOpen && (
        <LogoutModal
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={handleLogout}
        />
      )}
    </div>
  );
}
