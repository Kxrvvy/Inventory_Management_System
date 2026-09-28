// Restock request lifecycle (mirrors backend/app/models/restock_request.py):
// pending -> quoted -> awaiting_deposit -> deposit_submitted -> deposit_paid -> shipped
//   -> awaiting_balance -> balance_submitted -> completed      (side exits: declined, cancelled)

export const STATUS_META = {
  pending: { label: 'Pending', style: 'bg-neutral-200 text-neutral-700' },
  quoted: { label: 'Quote received', style: 'bg-amber-100 text-amber-700' },
  awaiting_deposit: { label: 'Deposit due', style: 'bg-amber-100 text-amber-700' },
  deposit_submitted: { label: 'Deposit sent', style: 'bg-neutral-200 text-neutral-700' },
  deposit_paid: { label: 'Deposit paid', style: 'bg-sky-100 text-sky-700' },
  shipped: { label: 'Shipped', style: 'bg-blue-100 text-blue-700' },
  awaiting_balance: { label: 'Balance due', style: 'bg-amber-100 text-amber-700' },
  balance_submitted: { label: 'Balance sent', style: 'bg-neutral-200 text-neutral-700' },
  completed: { label: 'Completed', style: 'bg-green-100 text-green-700' },
  declined: { label: 'Declined', style: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', style: 'bg-red-100 text-red-700' },
};

export const TERMINAL_STATUSES = ['declined', 'cancelled', 'completed'];

// Filter chips. `null` = no filtering. Grouped by who has to act next.
export const STATUS_FILTERS = {
  All: null,
  'Needs action': ['quoted', 'awaiting_deposit', 'shipped', 'awaiting_balance'],
  'Waiting on manufacturer': ['pending', 'deposit_submitted', 'deposit_paid', 'balance_submitted'],
  Completed: ['completed'],
  'Declined / Cancelled': ['declined', 'cancelled'],
};

export const PAYMENT_METHODS = ['GCash', 'Maya', 'Bank transfer', 'Cash', 'Other'];

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

export function formatMoney(value) {
  return value === null || value === undefined ? '—' : peso.format(value);
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
}

// Sum of payments the manufacturer has confirmed
export function amountPaid(request) {
  return request.payments
    .filter((p) => p.status === 'confirmed')
    .reduce((sum, p) => sum + p.amount, 0);
}
