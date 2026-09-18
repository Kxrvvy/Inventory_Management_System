export default function LogoutModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="bg-gray-200 p-8 rounded-[32px] w-full max-w-sm shadow-2xl relative z-10 text-center">
        <h2 className="text-m font-black text-gray-700 mb-6">
          Are you sure you want to log out?
        </h2>
        
        <div className="flex justify-center gap-4">
          <button 
            onClick={onClose} 
            className="px-8 py-2 rounded-full border-2 border-black font-bold text-black hover:bg-gray-300 transition-all"
          >
            CANCEL
          </button>
          <button 
            onClick={onConfirm} 
            className="px-8 py-2 rounded-full bg-red-500 font-bold text-white shadow-lg hover:bg-red-600 transition-all"
          >
            LOG OUT
          </button>
        </div>
      </div>
    </div>
  );
}