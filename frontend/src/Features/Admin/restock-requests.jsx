import { useState, useEffect, useCallback } from 'react';
import RequestRestockModal from './components/RequestRestockModal';
import RestockPaymentModal from './components/RestockPaymentModal';
import { STATUS_META, STATUS_FILTERS, TERMINAL_STATUSES, formatMoney, formatDate, amountPaid } from './restockStatus';
import { Truck, Loader2, AlertCircle, CheckCircle2, RotateCw, Wallet, FileText, Eye } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

// The next thing the admin can do for a request, shown as the row's action button
const ROW_ACTIONS = {
  quoted: { label: 'Review quote', icon: FileText, style: 'bg-amber-600 hover:bg-amber-700' },
  awaiting_deposit: { label: 'Pay deposit', icon: Wallet, style: 'bg-amber-600 hover:bg-amber-700' },
  awaiting_balance: { label: 'Pay balance', icon: Wallet, style: 'bg-amber-600 hover:bg-amber-700' },
};

export default function RestockRequests() {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [reorderingVariant, setReorderingVariant] = useState(null);
  const [openRequestId, setOpenRequestId] = useState(null);

  const fetchRequests = useCallback(async () => {
    setFetching(true);
    setError(null);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/restock-requests/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to fetch restock requests');
      setRequests(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const visibleRequests = STATUS_FILTERS[statusFilter]
    ? requests.filter((r) => STATUS_FILTERS[statusFilter].includes(r.status))
    : requests;
  const openRequest = requests.find((r) => r.request_id === openRequestId) || null;

  // Opens the request pop-up pre-filled with the earlier quantity, which the admin can change before sending.
  const handleReorder = (r) => setReorderingVariant({
    variant_id: r.variant_id,
    product_name: r.product_name,
    size: r.size,
    color: r.color,
    quantity_in_stock: r.quantity_in_stock,
    max_stock: r.max_stock,
    suggested_quantity: r.requested_quantity,
  });

  // A variant with an unsettled request can't be reordered until that one is finished.
  const activeVariantIds = new Set(
    requests.filter((r) => !TERMINAL_STATUSES.includes(r.status)).map((r) => r.variant_id)
  );

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

  const renderAction = (r) => {
    if (r.status === 'shipped') {
      return (
        <button
          onClick={() => handleConfirmReceived(r.request_id)}
          disabled={busyId === r.request_id}
          className="flex items-center gap-1 bg-green-700 hover:bg-green-800 text-white text-[11px] font-black px-3 py-1.5 rounded-lg transition disabled:opacity-50 whitespace-nowrap"
        >
          <CheckCircle2 size={13} />
          {busyId === r.request_id ? 'Saving...' : 'Confirm Received'}
        </button>
      );
    }
    const action = ROW_ACTIONS[r.status];
    if (action) {
      const Icon = action.icon;
      return (
        <button
          onClick={() => setOpenRequestId(r.request_id)}
          className={`flex items-center gap-1 text-white text-[11px] font-black px-3 py-1.5 rounded-lg transition whitespace-nowrap ${action.style}`}
        >
          <Icon size={13} />
          {action.label}
        </button>
      );
    }
    if (r.total_amount !== null) {
      return (
        <button
          onClick={() => setOpenRequestId(r.request_id)}
          className="flex items-center gap-1 text-neutral-600 hover:text-neutral-900 text-[11px] font-black px-3 py-1.5 rounded-lg transition whitespace-nowrap"
        >
          <Eye size={13} />
          Details
        </button>
      );
    }
    return <span className="text-neutral-400">—</span>;
  };

  return (
    <div className="p-8">
      <div className="bg-neutral-100 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Truck size={20} />
            <h1 className="font-black text-2xl">RESTOCK REQUESTS ({visibleRequests.length})</h1>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-100 border border-red-300 rounded-lg px-4 py-3 mb-4">
            <AlertCircle size={16} />
            <span className="text-sm font-bold">{error}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {Object.keys(STATUS_FILTERS).map((s) => (
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
                  <th className="px-4 py-3 font-black text-center">Offered</th>
                  <th className="px-4 py-3 font-black">Status</th>
                  <th className="px-4 py-3 font-black">Total</th>
                  <th className="px-4 py-3 font-black">Requested At</th>
                  <th className="px-4 py-3 font-black">Received At</th>
                  <th className="px-4 py-3 font-black text-center">Reorder</th>
                  <th className="px-4 py-3 font-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRequests.map((r) => {
                  const meta = STATUS_META[r.status] || { label: r.status, style: 'bg-neutral-200 text-neutral-700' };
                  return (
                    <tr key={r.request_id} className="border-t border-neutral-200">
                      <td className="px-4 py-3">
                        <p className="font-black text-neutral-900">{r.product_name}</p>
                        <p className="text-neutral-500">{r.size} &middot; {r.color}</p>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-neutral-700">{r.requested_quantity}</td>
                      <td className="px-4 py-3 text-center font-bold text-neutral-700">{r.response_quantity ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-[10px] font-black uppercase px-2.5 py-1 rounded-full whitespace-nowrap ${meta.style}`}>
                          {meta.label}
                        </span>
                        {r.status === 'declined' && r.response_note && (
                          <p className="text-red-500 mt-1 italic max-w-[180px]">"{r.response_note}"</p>
                        )}
                        {r.status === 'shipped' && r.response_note && (
                          <p className="text-neutral-500 mt-1 italic max-w-[180px]">"{r.response_note}"</p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.total_amount !== null ? (
                          <>
                            <p className="font-black text-neutral-900">{formatMoney(r.total_amount)}</p>
                            <p className="text-neutral-500">Paid {formatMoney(amountPaid(r))}</p>
                          </>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">{formatDate(r.requested_at)}</td>
                      <td className="px-4 py-3 text-neutral-500">{formatDate(r.received_at)}</td>
                      <td className="px-4 py-3 text-center">
                        {activeVariantIds.has(r.variant_id) ? (
                          <span className="text-neutral-400" title="This variant already has an active request">—</span>
                        ) : r.quantity_in_stock >= r.max_stock ? (
                          <span
                            className="text-neutral-400 font-bold"
                            title={`Stock is full: ${r.quantity_in_stock} of ${r.max_stock}`}
                          >
                            Stock full
                          </span>
                        ) : (
                          <button
                            onClick={() => handleReorder(r)}
                            className="inline-flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-black px-3 py-1.5 rounded-lg transition whitespace-nowrap"
                          >
                            <RotateCw size={12} />
                            Reorder
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">{renderAction(r)}</td>
                    </tr>
                  );
                })}

                {visibleRequests.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center text-neutral-400 py-10 font-bold">
                      No restock requests{statusFilter !== 'All' ? ` under "${statusFilter}"` : ''} yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {reorderingVariant && (
        <RequestRestockModal
          variant={reorderingVariant}
          onClose={() => setReorderingVariant(null)}
          onRequested={fetchRequests}
        />
      )}

      {openRequest && (
        <RestockPaymentModal
          request={openRequest}
          onClose={() => setOpenRequestId(null)}
          onChanged={fetchRequests}
        />
      )}
    </div>
  );
}
