import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, Truck, Ban } from 'lucide-react';
import Navbar from '../components/Navbar';
import RespondModal from '../components/RespondModal';

const API_BASE = 'http://localhost:8000';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function PendingRequests() {
  const [requests, setRequests] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);
  const [responding, setResponding] = useState(null); // { request, action }

  const fetchRequests = useCallback(async () => {
    setFetching(true);
    setError(null);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/restock-requests/?status=pending`, {
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

  return (
    <div className="min-h-screen bg-neutral-900">
      <Navbar />
      <div className="p-8 max-w-3xl mx-auto">
        <h1 className="text-white text-xl font-black uppercase tracking-wide mb-6">Pending Requests</h1>

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
        ) : requests.length === 0 ? (
          <p className="text-neutral-500 text-sm text-center py-16">No pending restock requests right now.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.request_id} className="bg-neutral-800 border border-neutral-700 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-white font-bold text-sm">{r.product_name}</p>
                  <p className="text-neutral-400 text-xs mt-0.5">{r.size} &middot; {r.color} &middot; Requested {r.requested_quantity} units</p>
                  <p className="text-neutral-500 text-xs mt-1">Requested by {r.requested_by_username} on {formatDate(r.requested_at)}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setResponding({ request: r, action: 'ship' })}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
                  >
                    <Truck size={14} /> Ship
                  </button>
                  <button
                    onClick={() => setResponding({ request: r, action: 'decline' })}
                    className="flex items-center gap-1.5 bg-neutral-700 hover:bg-red-900/60 text-red-400 text-xs font-bold px-3 py-2 rounded-lg transition"
                  >
                    <Ban size={14} /> Decline
                  </button>
                </div>
              </div>
            ))}
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
