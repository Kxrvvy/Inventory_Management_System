import { useState } from 'react';
import { X, Loader2, FileText, Ban } from 'lucide-react';
import { formatMoney, splitTotal } from '../utils/restock';

const API_BASE = 'http://localhost:8000';

export default function RespondModal({ request, action, onClose, onResponded }) {
  const [quantity, setQuantity] = useState(String(request.requested_quantity));
  const [unitPrice, setUnitPrice] = useState('');
  const [instructions, setInstructions] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isQuote = action === 'quote';
  const qty = Number(quantity);
  const price = Number(unitPrice);
  const validQuote = qty > 0 && price > 0;
  const split = validQuote ? splitTotal(qty, price) : null;

  const handleSubmit = async () => {
    if (isQuote) {
      if (!qty || qty <= 0) {
        setError('Enter a quantity greater than zero.');
        return;
      }
      if (!price || price <= 0) {
        setError('Enter a unit price greater than zero.');
        return;
      }
      if (!instructions.trim()) {
        setError('Add payment instructions so the admin knows where to pay.');
        return;
      }
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
          quantity: isQuote ? qty : null,
          unit_price: isQuote ? price : null,
          payment_instructions: isQuote ? instructions.trim() : null,
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
      <div
        className="bg-neutral-800 border border-neutral-700 rounded-2xl w-full max-w-sm p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white text-lg font-bold">{isQuote ? 'Send Quote' : 'Decline Request'}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition"><X size={20} /></button>
        </div>

        <div className="bg-neutral-700/50 rounded-xl p-3 mb-4">
          <p className="text-white text-sm font-bold">{request.product_name}</p>
          <p className="text-neutral-400 text-xs mt-0.5">{request.size} &middot; {request.color}</p>
          <p className="text-neutral-500 text-xs mt-1">Requested quantity: {request.requested_quantity}</p>
        </div>

        {isQuote && (
          <>
            <label className="block text-neutral-300 text-sm mb-1">Quantity you can supply</label>
            <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputCls} />
            <p className="text-neutral-500 text-xs mt-1.5 italic">Doesn't have to match the requested amount — quote what you actually have available.</p>

            <label className="block text-neutral-300 text-sm mb-1 mt-4">Price per unit (₱)</label>
            <input type="number" min="0" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder="e.g., 250.00" className={inputCls} />

            {split && (
              <div className="bg-neutral-700/50 rounded-xl p-3 mt-3 text-xs space-y-1">
                <div className="flex justify-between"><span className="text-neutral-400">Total</span><span className="text-white font-bold">{formatMoney(split.total)}</span></div>
                <div className="flex justify-between"><span className="text-neutral-400">Deposit (50%) — due before you ship</span><span className="text-neutral-200">{formatMoney(split.deposit)}</span></div>
                <div className="flex justify-between"><span className="text-neutral-400">Balance (50%) — due after it arrives</span><span className="text-neutral-200">{formatMoney(split.balance)}</span></div>
              </div>
            )}

            <label className="block text-neutral-300 text-sm mb-1 mt-4">Payment instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              placeholder="e.g., GCash 0917 123 4567 — Juan Dela Cruz, or BDO acct 0012 3456 7890"
              className={`${inputCls} resize-none`}
            />
          </>
        )}

        <label className="block text-neutral-300 text-sm mb-1 mt-4">
          {isQuote ? 'Note (optional)' : 'Reason for declining'}
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder={isQuote ? 'e.g., ships within 3 days of deposit' : 'e.g., out of raw material this cycle'}
          className={`${inputCls} resize-none`}
        />

        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full mt-5 font-bold py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 ${
            isQuote ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-red-700 hover:bg-red-600 text-white'
          }`}
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
            : isQuote
              ? <><FileText size={15} /> Send Quote</>
              : <><Ban size={15} /> Confirm Decline</>}
        </button>
      </div>
    </div>
  );
}
