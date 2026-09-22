import { useState, useEffect, useCallback } from 'react';
import { Truck, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const API_BASE = 'http://localhost:8000';
const STATUS_FILTERS = ['All', 'Pending', 'Shipped', 'Declined', 'Received'];

const STATUS_STYLES = {
  pending: 'bg-neutral-200 text-neutral-700',
  shipped: 'bg-blue-100 text-blue-700',
  declined: 'bg-red-100 text-red-700',
  received: 'bg-green-100 text-green-700',
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function RestockRequests() {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const fetchRequests = useCallback(async () => {
    setFetching(true);
    setError(null);
    const token = localStorage.getItem('token');
    try {
      const qs = statusFilter !== 'All' ? `?status=${statusFilter.toLowerCase()}` : '';
      const res = await fetch(`${API_BASE}/restock-requests/${qs}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to fetch restock requests');
      setRequests(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleConfirmReceived = async (requestId) => {
    setBusyId(requestId);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/restock-requests/${requestId}/receive`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to confirm receipt');
      await fetchRequests();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="bg-neutral-100 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Truck size={20} />
            <h1 className="font-black text-2xl">RESTOCK REQUESTS ({requests.length})</h1>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-100 border border-red-300 rounded-lg px-4 py-3 mb-4">
            <AlertCircle size={16} />
            <span className="text-sm font-bold">{error}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition ${
                statusFilter === s
                  ? 'bg-neutral-800 text-white'
                  : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {fetching ? (
          <div className="flex items-center justify-center py-16 gap-2 text-neutral-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm font-bold">Loading requests...</span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-neutral-800 text-white text-left">
                  <th className="px-4 py-3 font-black">Variant</th>
                  <th className="px-4 py-3 font-black text-center">Requested</th>
                  <th className="px-4 py-3 font-black text-center">Shipped</th>
                  <th className="px-4 py-3 font-black">Status</th>
                  <th className="px-4 py-3 font-black">Requested At</th>
                  <th className="px-4 py-3 font-black">Responded At</th>
                  <th className="px-4 py-3 font-black">Received At</th>
                  <th className="px-4 py-3 font-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.request_id} className="border-t border-neutral-200">
                    <td className="px-4 py-3">
                      <p className="font-black text-neutral-900">{r.product_name}</p>
                      <p className="text-neutral-500">{r.size} &middot; {r.color}</p>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-neutral-700">{r.requested_quantity}</td>
                    <td className="px-4 py-3 text-center font-bold text-neutral-700">{r.response_quantity ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${STATUS_STYLES[r.status] || 'bg-neutral-200 text-neutral-700'}`}>
                        {r.status}
                      </span>
                      {r.status === 'declined' && r.response_note && (
                        <p className="text-red-500 mt-1 italic max-w-[180px]">"{r.response_note}"</p>
                      )}
                      {r.status === 'shipped' && r.response_note && (
                        <p className="text-neutral-500 mt-1 italic max-w-[180px]">"{r.response_note}"</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{formatDate(r.requested_at)}</td>
                    <td className="px-4 py-3 text-neutral-500">{formatDate(r.responded_at)}</td>
                    <td className="px-4 py-3 text-neutral-500">{formatDate(r.received_at)}</td>
                    <td className="px-4 py-3">
                      {r.status === 'shipped' ? (
                        <button
                          onClick={() => handleConfirmReceived(r.request_id)}
                          disabled={busyId === r.request_id}
                          className="flex items-center gap-1 bg-green-700 hover:bg-green-800 text-white text-[11px] font-black px-3 py-1.5 rounded-lg transition disabled:opacity-50 whitespace-nowrap"
                        >
                          <CheckCircle2 size={13} />
                          {busyId === r.request_id ? 'Saving...' : 'Confirm Received'}
                        </button>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}

                {requests.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-neutral-400 py-10 font-bold">
                      No restock requests{statusFilter !== 'All' ? ` with status "${statusFilter.toLowerCase()}"` : ''} yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
