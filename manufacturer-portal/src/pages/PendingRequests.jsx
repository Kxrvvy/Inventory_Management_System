import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, FileText, Ban, Truck, BadgeCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import RespondModal from '../components/RespondModal';
import { STATUS_META, ACTION_STATUSES, formatDate, formatMoney } from '../utils/restock';

const API_BASE = 'http://localhost:8000';

export default function PendingRequests() {
  const [requests, setRequests] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);
  const [responding, setResponding] = useState(null); // { request, action }
  const [busyId, setBusyId] = useState(null);

  const username = localStorage.getItem('username');

  const fetchRequests = useCallback(async () => {
    setFetching(true);
    setError(null);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/restock-requests/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to fetch requests');
      setRequests(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // New requests are open to any manufacturer; once quoted, an order belongs to the manufacturer who quoted it
  const todo = requests.filter(
    (r) => ACTION_STATUSES.includes(r.status) && (r.status === 'pending' || r.manufacturer_username === username)
  );

  const act = async (request, path, method, body) => {
    setBusyId(request.request_id);
    setError(null);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/restock-requests/${request.request_id}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Something went wrong');
      await fetchRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const submittedPayment = (r) => r.payments.find((p) => p.status === 'submitted');

  const renderBody = (r) => {
    if (r.status === 'pending') {
      return (
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setResponding({ request: r, action: 'quote' })}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
          >
            <FileText size={14} /> Send Quote
          </button>
          <button
            onClick={() => setResponding({ request: r, action: 'decline' })}
            className="flex items-center gap-1.5 bg-neutral-700 hover:bg-red-900/60 text-red-400 text-xs font-bold px-3 py-2 rounded-lg transition"
          >
            <Ban size={14} /> Decline
          </button>
        </div>
      );
    }

    if (r.status === 'deposit_paid') {
      return (
        <button
          onClick={() => act(r, '/ship', 'PATCH', {})}
          disabled={busyId === r.request_id}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition disabled:opacity-50 shrink-0"
        >
          <Truck size={14} /> {busyId === r.request_id ? 'Saving...' : 'Mark as Shipped'}
        </button>
      );
    }

    // deposit_submitted / balance_submitted: confirm the payment the admin says they made
    const payment = submittedPayment(r);
    return payment ? (
      <button
        onClick={() => act(r, `/payments/${payment.payment_id}/confirm`, 'PATCH')}
        disabled={busyId === r.request_id}
        className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition disabled:opacity-50 shrink-0"
      >
        <BadgeCheck size={14} /> {busyId === r.request_id ? 'Saving...' : `Confirm ${payment.kind} received`}
      </button>
    ) : null;
  };

  const renderDetail = (r) => {
    if (r.status === 'pending') {
      return <p className="text-neutral-500 text-xs mt-1">Requested by {r.requested_by_username} on {formatDate(r.requested_at)}</p>;
    }
    if (r.status === 'deposit_paid') {
      return <p className="text-neutral-500 text-xs mt-1">Deposit of {formatMoney(r.deposit_amount)} confirmed. You can ship {r.response_quantity} units now.</p>;
    }
    const payment = submittedPayment(r);
    if (!payment) return null;
    return (
      <div className="mt-2 text-xs bg-neutral-900/60 rounded-lg p-2.5">
        <p className="text-neutral-200 font-bold">
          <span className="capitalize">{payment.kind}</span> payment of {formatMoney(payment.amount)}
        </p>
        <p className="text-neutral-400 mt-0.5">
          {payment.method} &middot; Ref <span className="text-neutral-200">{payment.reference_no}</span> &middot; sent by {payment.paid_by_username} on {formatDate(payment.paid_at)}
        </p>
        {payment.note && <p className="text-neutral-500 italic mt-0.5">"{payment.note}"</p>}
        <p className="text-neutral-500 mt-1">Check your account, then confirm once the money has arrived.</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-900">
      <Navbar />
      <div className="p-8 max-w-3xl mx-auto">
        <h1 className="text-white text-xl font-black uppercase tracking-wide mb-6">Action Needed</h1>

        {error && (
          <div className="flex items-center gap-2 text-red-300 bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {fetching ? (
          <div className="flex items-center justify-center py-16 gap-2 text-neutral-500">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm font-bold">Loading requests...</span>
          </div>
        ) : todo.length === 0 ? (
          <p className="text-neutral-500 text-sm text-center py-16">Nothing needs your attention right now.</p>
        ) : (
          <div className="space-y-3">
            {todo.map((r) => {
              const meta = STATUS_META[r.status];
              return (
                <div key={r.request_id} className="bg-neutral-800 border border-neutral-700 rounded-xl p-4 flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-bold text-sm">{r.product_name}</p>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${meta.style}`}>{meta.label}</span>
                    </div>
                    <p className="text-neutral-400 text-xs mt-0.5">
                      {r.size} &middot; {r.color} &middot; {r.status === 'pending'
                        ? `Requested ${r.requested_quantity} units`
                        : `${r.response_quantity} units at ${formatMoney(r.unit_price)} = ${formatMoney(r.total_amount)}`}
                    </p>
                    {renderDetail(r)}
                  </div>
                  {renderBody(r)}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {responding && (
        <RespondModal
          request={responding.request}
          action={responding.action}
          onClose={() => setResponding(null)}
          onResponded={fetchRequests}
        />
      )}
    </div>
  );
}
