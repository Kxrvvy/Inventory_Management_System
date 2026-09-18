export default function DeleteAccountModal({ isOpen, onClose, onConfirm, username }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Content */}
      <div className="bg-gray-200 p-8 rounded-[32px] w-full max-w-sm shadow-2xl relative z-10 text-center">
        <h2 className="text-m font-black text-gray-700 mb-6">
          Are you sure you want to delete the account?
        </h2>
        
        <div className="flex justify-center gap-4">
          <button 
            onClick={onClose} 
            className="px-8 py-2 rounded-full border-2 border-black font-bold text-black hover:bg-gray-300"
          >
            CANCEL
          </button>
          <button 
            onClick={onConfirm} 
            className="px-8 py-2 rounded-full bg-orange-400 font-bold text-white shadow-lg hover:bg-orange-500"
          >
            DELETE
          </button>
        </div>
      </div>
    </div>
  );
}