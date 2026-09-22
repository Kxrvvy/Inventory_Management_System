import { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';

const API_BASE = 'http://localhost:8000';

const STATUS_STYLES = {
  pending: 'bg-neutral-600 text-neutral-100',
  shipped: 'bg-blue-900/60 text-blue-300',
  declined: 'bg-red-900/60 text-red-300',
  received: 'bg-green-900/60 text-green-300',
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function History() {
  const [requests, setRequests] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/restock-requests/`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch history');
        return res.json();
      })
      .then(setRequests)
      .catch((err) => setError(err.message))
      .finally(() => setFetching(false));
  }, []);

  return (
    <div className="min-h-screen bg-neutral-900">
      <Navbar />
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-white text-xl font-black uppercase tracking-wide mb-6">Request History</h1>

        {error && (
          <div className="flex items-center gap-2 text-red-300 bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {fetching ? (
          <div className="flex items-center justify-center py-16 gap-2 text-neutral-500">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm font-bold">Loading history...</span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-700">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-neutral-800 text-neutral-300 text-left">
                  <th className="px-4 py-3 font-bold">Variant</th>
                  <th className="px-4 py-3 font-bold text-center">Requested</th>
                  <th className="px-4 py-3 font-bold text-center">Shipped</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Requested At</th>
                  <th className="px-4 py-3 font-bold">Responded At</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.request_id} className="border-t border-neutral-800 bg-neutral-850">
                    <td className="px-4 py-3">
                      <p className="text-white font-bold">{r.product_name}</p>
                      <p className="text-neutral-500">{r.size} &middot; {r.color}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-neutral-300">{r.requested_quantity}</td>
                    <td className="px-4 py-3 text-center text-neutral-300">{r.response_quantity ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${STATUS_STYLES[r.status] || 'bg-neutral-700 text-neutral-300'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{formatDate(r.requested_at)}</td>
                    <td className="px-4 py-3 text-neutral-500">{formatDate(r.responded_at)}</td>
                  </tr>
                ))}

                {requests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-neutral-500 py-10 font-bold">
                      No restock requests yet.
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
