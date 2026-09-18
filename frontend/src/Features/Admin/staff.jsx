import { useEffect, useState } from 'react';
import AddEmployeeModal from './components/addEmployeeModal';
import DeleteAccountModal from './components/deleteAccountModal';

export default function Staff() {
  const [staffList, setStaffList] = useState([]);
  const [modals, setModals] = useState({ add: false, delete: false });
  const [selectedStaff, setSelectedStaff] = useState(null);

  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.split(" ").filter(Boolean);
    return parts.length === 1 
      ? parts[0][0].toUpperCase() 
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const fetchStaff = async () => {
    try {
      const response = await fetch('http://localhost:8000/users/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStaffList(Array.isArray(data) ? data : []);
      }
    } catch (err) { console.error("Fetch error:", err); }
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleDelete = async () => {
    const response = await fetch(`http://localhost:8000/users/${selectedStaff.user_id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (response.ok) {
      fetchStaff();
      setModals(prev => ({ ...prev, delete: false }));
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black">EMPLOYEE</h1>
        <button 
          onClick={() => setModals({ ...modals, add: true })} 
          className="bg-neutral-700 text-white px-6 py-2 rounded-lg font-black text-xs hover:bg-neutral-800 transition"
        >
          + ADD EMPLOYEE
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffList.map((staff) => (
          <div key={staff.user_id} className="group relative bg-neutral-100 p-6 rounded-xl border border-neutral-200 shadow-sm">
            <div className="absolute inset-0 bg-neutral-900/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 rounded-xl">
              <div className="flex gap-2 w-full px-6">
                <button onClick={() => { setSelectedStaff(staff); setModals(prev => ({ ...prev, delete: true })); }} className="flex-1 bg-white text-red-600 py-2 rounded-lg font-black text-xs hover:bg-gray-200">Delete</button>
                <button onClick={() => { setSelectedStaff(staff); setModals(prev => ({ ...prev, add: true })); }} className="flex-1 bg-white text-black py-2 rounded-lg font-black text-xs hover:bg-gray-200">Edit</button>
              </div>
            </div>

            <div className="w-12 h-12 bg-neutral-700 rounded-full flex items-center justify-center text-white font-black text-l mb-4">
              {getInitials(staff.name)}
            </div>
            
            <div className="flex items-center justify-between mb-0.5">
              <h3 className="font-black text-sm text-neutral-900">{staff.name}</h3>
              <div className="flex gap-2">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                    staff.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>
                    {staff.role || 'staff'}
                </span>
              </div>
            </div>
            <p className="text-xs font-bold text-neutral-500 mb-6">{staff.username}</p>
            
            <div className="bg-neutral-700 text-white p-4 rounded-2xl text-[10px]">
              <div className="flex justify-between mb-2">
                <span className="text-neutral-400 font-black">HIRED DATE</span> 
                <span className="font-black">{staff.dateHired}</span>
              </div>
              <div className="flex items-center gap-2 mb-1 truncate font-bold"><span>✉️</span> {staff.email}</div>
              <div className="flex items-center gap-2 font-bold"><span>📞</span> {staff.phone}</div>
            </div>
          </div>
        ))}
      </div>

      <AddEmployeeModal 
        isOpen={modals.add} 
        onClose={() => { setModals(prev => ({...prev, add: false})); setSelectedStaff(null); }} 
        onAdd={fetchStaff}
        initialData={selectedStaff}
      />
      <DeleteAccountModal 
        isOpen={modals.delete} 
        onClose={() => setModals(prev => ({...prev, delete: false}))}
        onConfirm={handleDelete}
      />
    </div>
  );
}