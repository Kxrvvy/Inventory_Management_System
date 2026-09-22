import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, X, LayoutDashboard, Package, FileText,
  Users, LogOut, ShoppingCart,
} from 'lucide-react';
import Logo from '../../assets/logo.png';

export default function AdminNavbar({ isOpen, setIsOpen, userRole = 'Admin', userName = 'Admin User', onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const allMenuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, adminOnly: true },
    { name: 'Inventory',  path: '/inventory',  icon: <Package size={20} />,        adminOnly: true },
    { name: 'POS',        path: '/pos',         icon: <ShoppingCart size={20} />,   adminOnly: false },
    { name: 'Reports',    path: '/reports',     icon: <FileText size={20} />,       adminOnly: true },
    { name: 'Staff',      path: '/staff',       icon: <Users size={20} />,          adminOnly: true },
  ];

  const menuItems = userRole === 'admin'
    ? allMenuItems
    : allMenuItems.filter((item) => !item.adminOnly);

  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.split(' ').filter((p) => p.length > 0);
    return parts.length === 1
      ? parts[0].substring(0, 2).toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <nav
      className={`
        fixed left-0 top-0 h-full bg-neutral-900 p-5 flex flex-col justify-between
        text-white transition-all duration-300 z-50 overflow-y-auto
        ${isOpen
          ? 'w-64 translate-x-0'
          : 'w-64 -translate-x-full md:translate-x-0 md:w-20'}
      `}
    >
      <div>
        {/* Toggle button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-full bg-neutral-600 mb-8 flex items-center justify-center hover:bg-neutral-500 transition text-white shrink-0"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Brand */}
        {isOpen && (
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-14 rounded shrink-0 overflow-hidden">
              <img src={Logo} alt="Logo" className="w-full h-full object-cover rounded" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold leading-none">PUPPET'S</h2>
              <span className="text-[10px] text-white tracking-widest uppercase">DIRECTORY</span>
            </div>
          </div>
        )}

        {/* Nav items */}
        <div className="space-y-1">
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => { navigate(item.path); setIsOpen(false); }}
                className={`flex items-center gap-4 w-full px-3 py-2.5 rounded-lg text-sm transition
                  ${active
                    ? 'bg-neutral-600 text-white font-bold'
                    : 'text-neutral-300 hover:bg-neutral-700 hover:text-white'}
                  ${!isOpen ? 'justify-center' : ''}
                `}
              >
                {item.icon}
                {isOpen && <span>{item.name}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile + logout */}
      <div className={`flex items-center gap-3 px-1 py-2 ${!isOpen ? 'justify-center' : ''}`}>
        <div className="relative group w-10 h-10 flex items-center justify-center rounded-full bg-neutral-600 text-white font-bold text-sm shrink-0 overflow-hidden">
          {getInitials(userName)}
          <button
            onClick={onLogout}
            className="absolute inset-0 w-full h-full bg-neutral-800/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
            title="Logout"
          >
            <LogOut size={18} className="text-red-400" />
          </button>
        </div>
        {isOpen && (
          <div className="flex flex-col overflow-hidden min-w-0">
            <span className="text-xs font-semibold truncate">{userName}</span>
            <span className="text-[10px] text-gray-400 capitalize">{userRole}</span>
          </div>
        )}
      </div>
    </nav>
  );
}
