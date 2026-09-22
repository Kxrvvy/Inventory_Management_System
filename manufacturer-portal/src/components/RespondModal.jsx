import { useState } from 'react';
import { X, Loader2, Truck, Ban } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export default function RespondModal({ request, action, onClose, onResponded }) {
  const [quantity, setQuantity] = useState(String(request.requested_quantity));
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isShip = action === 'ship';

  const handleSubmit = async () => {
    if (isShip && (!Number(quantity) || Number(quantity) <= 0)) {
      setError('Enter a quantity greater than zero.');
      return;
    }

    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/restock-requests/${request.request_id}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          action,
          quantity: isShip ? Number(quantity) : null,
          note: note.trim() || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to respond to request');
      onResponded?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-neutral-700 text-white text-sm rounded-lg px-3 py-2 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-neutral-800 border border-neutral-700 rounded-2xl w-full max-w-sm p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white text-lg font-bold">{isShip ? 'Ship Restock' : 'Decline Request'}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition"><X size={20} /></button>
        </div>

        <div className="bg-neutral-700/50 rounded-xl p-3 mb-4">
          <p className="text-white text-sm font-bold">{request.product_name}</p>
          <p className="text-neutral-400 text-xs mt-0.5">{request.size} &middot; {request.color}</p>
          <p className="text-neutral-500 text-xs mt-1">Requested quantity: {request.requested_quantity}</p>
        </div>

        {isShip && (
          <>
            <label className="block text-neutral-300 text-sm mb-1">Quantity you can ship</label>
            <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputCls} />
            <p className="text-neutral-500 text-xs mt-1.5 italic">Doesn't have to match the requested amount — ship what you actually have available.</p>
          </>
        )}

        <label className="block text-neutral-300 text-sm mb-1 mt-4">
          {isShip ? 'Note (optional)' : 'Reason for declining'}
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder={isShip ? 'e.g., shipping via courier, arrives in 3 days' : 'e.g., out of raw material this cycle'}
          className={`${inputCls} resize-none`}
        />

        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full mt-5 font-bold py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 ${
            isShip ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-red-700 hover:bg-red-600 text-white'
          }`}
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
            : isShip
              ? <><Truck size={15} /> Confirm Shipment</>
              : <><Ban size={15} /> Confirm Decline</>}
        </button>
      </div>
    </div>
  );
}
