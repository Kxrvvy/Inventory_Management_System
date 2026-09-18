import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react'; 

export default function AddEmployeeModal({ isOpen, onClose, onAdd, initialData }) {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    phone: '',
    dateHired: '',
    password: '',
    role: 'staff',
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        password: '' 
      });
    } else {
      setFormData({ 
        username: '', name: '', email: '', phone: '', dateHired: '', 
        password: '', role: 'staff' 
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    const payload = { ...formData };
    if (!payload.password) delete payload.password;

    const url = initialData
      ? `http://localhost:8000/users/${initialData.user_id}`
      : 'http://localhost:8000/users/';

    const method = initialData ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        onAdd();
        onClose();
      } else {
        const err = await response.json();
        alert(err.detail || 'Failed to save employee');
      }
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-gray-200 p-8 rounded-[32px] w-full max-w-lg shadow-2xl relative z-10">
        <h2 className="text-xl font-black text-neutral-600 mb-6 uppercase tracking-wider text-center">
          {initialData ? 'Edit Employee' : 'Add New Employee'}
        </h2>

        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4 mb-2">
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-700">Role</label>
              <select 
                name="role" 
                value={formData.role} 
                onChange={handleChange}
                className="bg-gray-300 rounded-lg p-2 text-xs w-32 font-bold uppercase"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-700">Date Hired:</label>
              <input 
                name="dateHired" 
                type="date" 
                value={formData.dateHired} 
                onChange={handleChange} 
                className="bg-gray-300 rounded-lg p-2 text-xs w-32" 
              />
            </div>
          </div>

          <label className="block text-[10px] font-black uppercase text-gray-700">Name</label>
          <input name="name" value={formData.name} onChange={handleChange} className="w-full bg-gray-300 text-xs rounded-lg p-3" />

          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block text-[10px] font-black uppercase text-gray-700">Email</label>
              <input name="email" value={formData.email} onChange={handleChange} className="w-full text-xs bg-gray-300 rounded-lg p-3" />
            </div>
            <div className="w-1/2">
              <label className="block text-[10px] font-black uppercase text-gray-700">Phone</label>
              <input name="phone" value={formData.phone} onChange={handleChange} className="w-full text-xs bg-gray-300 rounded-lg p-3" />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-400">
            <h3 className="text-center font-black text-neutral-600 mb-4 tracking-wider">ACCOUNT DETAILS</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-700">Employee ID</label>
                <input name="username" value={formData.username} onChange={handleChange} className="w-full text-xs bg-gray-300 rounded-lg p-3" />
              </div>
              <div className="relative">
                <label className="block text-[10px] font-black uppercase text-gray-700">Password</label>
                <input 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  value={formData.password} 
                  onChange={handleChange} 
                  placeholder={initialData ? "Leave empty to keep current" : "Enter password"}
                  className="w-full text-xs bg-gray-300 rounded-lg p-3 pr-12" 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-7 text-gray-600 text-xl"
                >
                  {showPassword ? <Eye size={18}/> : <EyeOff size={18}/>}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-8 gap-4">
          <button 
            onClick={onClose} 
            className="px-12 py-3 rounded-full border-2 border-neutral-600 font-bold text-neutral-600 hover:bg-neutral-300"
          >
            CANCEL
          </button>
          <button 
            onClick={handleSubmit} 
            className="px-12 py-3 rounded-full bg-neutral-500 font-bold text-white shadow-lg hover:bg-neutral-600"
          >
            {initialData ? 'UPDATE' : 'SAVE'}
          </button>
        </div>
      </div>
    </div>
  );
}