// Restock request lifecycle (mirrors backend/app/models/restock_request.py):
// pending -> quoted -> awaiting_deposit -> deposit_submitted -> deposit_paid -> shipped
//   -> awaiting_balance -> balance_submitted -> completed      (side exits: declined, cancelled)

export const STATUS_META = {
  pending: { label: 'Pending', style: 'bg-neutral-600 text-neutral-100' },
  quoted: { label: 'Quoted', style: 'bg-amber-900/60 text-amber-300' },
  awaiting_deposit: { label: 'Awaiting deposit', style: 'bg-amber-900/60 text-amber-300' },
  deposit_submitted: { label: 'Confirm deposit', style: 'bg-orange-900/60 text-orange-300' },
  deposit_paid: { label: 'Ready to ship', style: 'bg-sky-900/60 text-sky-300' },
  shipped: { label: 'Shipped', style: 'bg-blue-900/60 text-blue-300' },
  awaiting_balance: { label: 'Awaiting balance', style: 'bg-amber-900/60 text-amber-300' },
  balance_submitted: { label: 'Confirm balance', style: 'bg-orange-900/60 text-orange-300' },
  completed: { label: 'Completed', style: 'bg-green-900/60 text-green-300' },
  declined: { label: 'Declined', style: 'bg-red-900/60 text-red-300' },
  cancelled: { label: 'Cancelled', style: 'bg-red-900/60 text-red-300' },
};

// Statuses where the manufacturer is the one who has to act next
export const ACTION_STATUSES = ['pending', 'deposit_submitted', 'deposit_paid', 'balance_submitted'];

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

export function formatMoney(value) {
  return value === null || value === undefined ? '—' : peso.format(value);
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
}

// Same split the backend computes: the deposit is half the total rounded half-up to the cent,
// the balance is whatever remains, so the two always add up to the total.
export function splitTotal(quantity, unitPrice) {
  const totalCents = Math.round(quantity * unitPrice * 100);
  const depositCents = Math.floor((totalCents + 1) / 2);
  return {
    total: totalCents / 100,
    deposit: depositCents / 100,
    balance: (totalCents - depositCents) / 100,
  };
}

// Sum of payments the manufacturer has confirmed
export function amountPaid(request) {
  return request.payments
    .filter((p) => p.status === 'confirmed')
    .reduce((sum, p) => sum + p.amount, 0);
}
