import { useState } from 'react';
import { X, Loader2, Send } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export default function RequestRestockModal({ variant, onClose, onRequested }) {
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setError('Enter a quantity greater than zero.');
      return;
    }

    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/restock-requests/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ variant_id: variant.variant_id, requested_quantity: qty }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to send restock request');
      onRequested?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-2xl w-full max-w-sm p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white text-lg font-semibold">Request Restock</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl p-3 mb-4">
          <p className="text-white text-sm font-bold">{variant.product_name}</p>
          <p className="text-gray-400 text-xs mt-0.5">{variant.size} &middot; {variant.color}</p>
          <p className="text-gray-500 text-xs mt-1">Currently in stock: {variant.quantity_in_stock}</p>
        </div>

        <label className="block text-gray-300 text-sm mb-1">Quantity to request</label>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="e.g., 50"
          className={inputCls}
        />
        <p className="text-gray-600 text-xs mt-1.5 italic">
          This is a suggestion for the manufacturer — they'll confirm how many units they can actually ship.
        </p>

        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-5 bg-gray-200 hover:bg-white text-gray-900 font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Sending...</>
            : <><Send size={15} /> Send Request</>}
        </button>
      </div>
    </div>
  );
}
