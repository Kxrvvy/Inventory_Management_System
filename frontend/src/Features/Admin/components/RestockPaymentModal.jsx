import { useState } from 'react';
import { X, Loader2, CheckCircle2, XCircle, Wallet, Clock } from 'lucide-react';
import { STATUS_META, PAYMENT_METHODS, formatMoney, formatDate } from '../restockStatus';

const API_BASE = 'http://localhost:8000';

// What the admin is waiting on when it isn't their turn
const WAITING_MESSAGES = {
  pending: 'Waiting for the manufacturer to send a quote.',
  deposit_submitted: 'Deposit recorded. Waiting for the manufacturer to confirm they received it.',
  deposit_paid: 'Deposit confirmed. Waiting for the manufacturer to ship the order.',
  balance_submitted: 'Balance recorded. Waiting for the manufacturer to confirm they received it.',
  completed: 'This order is fully paid and complete.',
  declined: 'The manufacturer declined this request.',
  cancelled: 'You rejected the quote, so this request was cancelled.',
};

function Row({ label, value, strong }) {
  return (
    <div className="flex justify-between text-xs py-1">
      <span className="text-gray-400">{label}</span>
      <span className={strong ? 'text-white font-bold' : 'text-gray-200'}>{value}</span>
    </div>
  );
}

export default function RestockPaymentModal({ request, onClose, onChanged }) {
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [referenceNo, setReferenceNo] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const status = request.status;
  const meta = STATUS_META[status];
  const dueKind = status === 'awaiting_deposit' ? 'deposit' : status === 'awaiting_balance' ? 'balance' : null;
  const dueAmount = dueKind === 'deposit' ? request.deposit_amount : request.balance_amount;
  const hasQuote = request.total_amount !== null;

  const act = async (path, method_ = 'PATCH', body) => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/restock-requests/${request.request_id}${path}`, {
        method: method_,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Something went wrong');
      onChanged?.();
      onClose();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleReject = () => {
    if (window.confirm('Reject this quote? The request will be cancelled and you can send a new one.')) {
      act('/reject');
    }
  };

  const handlePay = () => {
    if (!referenceNo.trim()) {
      setError('Enter the reference number of your payment.');
      return;
    }
    act('/payments', 'POST', { method, reference_no: referenceNo.trim(), note: note.trim() || null });
  };

  const inputCls = 'w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600';
  const primaryBtn = 'w-full font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-lg font-semibold">Restock Order</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl p-3 mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-white text-sm font-bold">{request.product_name}</p>
            <p className="text-gray-400 text-xs mt-0.5">{request.size} &middot; {request.color}</p>
            <p className="text-gray-500 text-xs mt-1">Requested {request.requested_quantity} &middot; by {request.manufacturer_username || 'manufacturer'}</p>
          </div>
          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full whitespace-nowrap ${meta.style}`}>{meta.label}</span>
        </div>

        {hasQuote && (
          <>
            <div className="bg-gray-800 rounded-xl p-3 mb-3">
              <p className="text-gray-300 text-xs font-bold uppercase tracking-wide mb-1">Quote</p>
              <Row label="Quantity" value={request.response_quantity} />
              <Row label="Unit price" value={formatMoney(request.unit_price)} />
              <Row label="Total" value={formatMoney(request.total_amount)} strong />
              <div className="border-t border-gray-700 my-1.5" />
              <Row label="Deposit (50%) — before shipping" value={formatMoney(request.deposit_amount)} />
              <Row label="Balance (50%) — after arrival" value={formatMoney(request.balance_amount)} />
            </div>

            <div className="bg-gray-800 rounded-xl p-3 mb-3">
              <p className="text-gray-300 text-xs font-bold uppercase tracking-wide mb-1">How to pay</p>
              <p className="text-gray-200 text-xs whitespace-pre-wrap">{request.payment_instructions}</p>
              {request.response_note && <p className="text-gray-500 text-xs italic mt-2">"{request.response_note}"</p>}
            </div>

            {request.payments.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-3 mb-3">
                <p className="text-gray-300 text-xs font-bold uppercase tracking-wide mb-1">Payments</p>
                {request.payments.map((p) => (
                  <div key={p.payment_id} className="text-xs py-1.5 border-t first:border-t-0 border-gray-700">
                    <div className="flex justify-between">
                      <span className="text-gray-200 font-bold capitalize">{p.kind} &middot; {formatMoney(p.amount)}</span>
                      <span className={p.status === 'confirmed' ? 'text-green-400 font-bold' : 'text-amber-400 font-bold'}>
                        {p.status === 'confirmed' ? 'Confirmed' : 'Awaiting confirmation'}
                      </span>
                    </div>
                    <p className="text-gray-500 mt-0.5">{p.method} &middot; Ref {p.reference_no} &middot; {formatDate(p.paid_at)}</p>
                    {p.note && <p className="text-gray-500 italic">"{p.note}"</p>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {status === 'quoted' && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => act('/accept')}
              disabled={loading}
              className={`${primaryBtn} bg-green-700 hover:bg-green-600 text-white`}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={15} />} Accept quote
            </button>
            <button
              onClick={handleReject}
              disabled={loading}
              className={`${primaryBtn} bg-gray-800 hover:bg-red-900/60 text-red-400`}
            >
              <XCircle size={15} /> Reject
            </button>
          </div>
        )}

        {dueKind && (
          <div className="mt-4">
            <p className="text-gray-300 text-sm font-bold mb-2">
              Record your {dueKind} payment of {formatMoney(dueAmount)}
            </p>
            <p className="text-gray-500 text-xs mb-3">
              Pay using the instructions above, then enter the details here so the manufacturer can confirm it.
            </p>

            <label className="block text-gray-300 text-sm mb-1">Payment method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputCls}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>

            <label className="block text-gray-300 text-sm mb-1 mt-3">Reference number</label>
            <input
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="e.g., transaction or receipt number"
              className={inputCls}
            />

            <label className="block text-gray-300 text-sm mb-1 mt-3">Note (optional)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={`${inputCls} resize-none`} />

            <button
              onClick={handlePay}
              disabled={loading}
              className={`${primaryBtn} mt-4 bg-gray-200 hover:bg-white text-gray-900`}
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
                : <><Wallet size={15} /> I've paid {formatMoney(dueAmount)}</>}
            </button>
          </div>
        )}

        {status === 'shipped' && (
          <div className="mt-4">
            <p className="text-gray-400 text-xs mb-3">
              Confirming arrival adds {request.response_quantity} to stock
              {hasQuote ? ` and makes the ${formatMoney(request.balance_amount)} balance due.` : '.'}
            </p>
            <button
              onClick={() => act('/receive')}
              disabled={loading}
              className={`${primaryBtn} bg-green-700 hover:bg-green-600 text-white`}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={15} />} Confirm received
            </button>
          </div>
        )}

        {WAITING_MESSAGES[status] && (
          <div className="mt-4 flex items-start gap-2 text-gray-400 text-xs">
            <Clock size={14} className="shrink-0 mt-0.5" />
            <span>{WAITING_MESSAGES[status]}{status === 'declined' && request.response_note ? ` "${request.response_note}"` : ''}</span>
          </div>
        )}

        {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
      </div>
    </div>
  );
}
