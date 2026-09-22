import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './Features/login';
import AdminDashboard from './Features/Admin/dashboard';
import AdminInventory from './Features/Admin/Inventory';
import Staff from './Features/Admin/staff';
import POSDashboard from './Features/POS/POSDashboard';
import MainLayout from './Features/MainLayout';
import Reports from './Features/Admin/reports';

// Redirects to login if no token
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" replace />;
  return children;
}

// Redirects staff to /pos — admin-only pages only
function AdminRoute({ children }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');
  if (!token) return <Navigate to="/" replace />;
  if (role !== 'admin') return <Navigate to="/pos" replace />;
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/inventory" element={<AdminRoute><AdminInventory /></AdminRoute>} />
          <Route path="/staff" element={<AdminRoute><Staff /></AdminRoute>} />
          <Route path="/pos" element={<POSDashboard />} />
          <Route path="/reports" element={<AdminRoute><Reports /></AdminRoute>} />
        </Route>
      </Routes>
    </Router>
  );
}