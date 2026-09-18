import { useState, useEffect } from 'react';
import SalesChart from './components/SalesChart';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const getInitials = (name) => {
    if (!name) return "??";
    const parts = name.split(" ").filter(Boolean);
    return parts.length === 1 
      ? parts[0][0].toUpperCase() 
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  useEffect(() => {
    fetch('http://localhost:8000/dashboard/admin-dashboard', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then((res) => res.json())
      .then((data) => {
        setDashboardData(data);
        setLoading(false);
      })
      .catch((err) => console.error("Failed to fetch dashboard:", err));
  }, []);

  if (loading) return <div className="p-8 font-black text-neutral-600">LOADING DASHBOARD...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black mb-8">DASHBOARD</h1>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
        {[
          { label: 'Total products', val: dashboardData.inventory.total_products },
          { label: 'Total variants', val: dashboardData.inventory.total_variants },
          { label: 'Low stock', val: dashboardData.inventory.low_stock_count },
          { label: 'Total staff', val: dashboardData.staff.total_staff },
          { label: 'Transactions today', val: dashboardData.sales_today.total_transactions },
          { label: "Today's sales", val: `₱${dashboardData.sales_today.total_sales.toLocaleString()}` },
        ].map((stat, i) => (
          <div key={i} className="bg-neutral-100 p-4 rounded-xl border border-neutral-200 shadow-sm">
            <p className="text-[10px] text-neutral-400 font-black uppercase tracking-wider">{stat.label}</p>
            <p className="text-xl font-black mt-1 text-neutral-900">{stat.val}</p>
          </div>
        ))}
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-neutral-100 p-6 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-sm uppercase text-neutral-900">Low stock alerts</h3>
            <span className="text-[10px] font-black text-red-500">{dashboardData.low_stock_alerts.length} item{dashboardData.low_stock_alerts.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
            {dashboardData.low_stock_alerts.length === 0 ? (
              <p className="text-xs text-neutral-400 font-bold">No low stock alerts.</p>
            ) : dashboardData.low_stock_alerts.map((item) => (
              <p key={item.variant_id} className="text-xs font-bold text-red-600 border-l-2 border-red-200 pl-3">
                {item.product_name} <span className="text-neutral-500">({item.size} · {item.color})</span> — {item.quantity_in_stock} LEFT
              </p>
            ))}
          </div>
        </div>

        <div className="bg-neutral-100 p-6 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-sm uppercase text-neutral-900">Recent Transactions</h3>
            <span className="text-[10px] font-black text-neutral-400">{dashboardData.recent_transactions.length} today</span>
          </div>
          <div className="max-h-48 overflow-y-auto pr-1 scrollbar-thin">
            {dashboardData.recent_transactions.map((tx) => (
              <div key={tx.transaction_id} className="flex justify-between items-center py-3 border-b border-neutral-200 last:border-0">
                <span className="text-xs font-bold text-neutral-600">#{tx.transaction_id} · <span className="uppercase">{tx.payment_method}</span></span>
                <span className="text-xs font-black text-neutral-900">₱{tx.total_amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-neutral-100 p-6 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-sm uppercase text-neutral-900">Staff Accounts</h3>
            <span className="text-[10px] font-black text-neutral-400">{dashboardData.staff.total_staff} member{dashboardData.staff.total_staff !== 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
            {dashboardData.staff.staff_list.map((member) => (
              <div key={member.user_id} className="flex items-center gap-3 p-2 border-b border-neutral-200 last:border-0">
                {/* Reusing getInitials logic */}
                <div className="w-10 h-10 bg-neutral-700 text-white rounded-full flex items-center justify-center font-black text-[10px]">
                  {getInitials(member.name || member.username)}
                </div>
                <div>
                  <p className="text-xs font-black text-neutral-900">{member.name || member.username}</p>
                  <p className="text-[10px] font-bold text-neutral-500">{member.email}</p>
                </div>
                
                <span 
                  className={`ml-auto shrink-0 flex items-center justify-center min-w-[50px] h-6 px-2 text-[10px] rounded-full font-black uppercase ${
                    member.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {/* Safety check: use "N/A" if role is missing/undefined */}
                  {(member.role || "staff").toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-neutral-100 p-6 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-black text-sm uppercase text-neutral-900">Sales Analytics</h3>
            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wide">Last 7 Days</span>
          </div>

          {/* Summary stats */}
          {dashboardData.sales_analytics && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white rounded-lg p-3 border border-neutral-200">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wide">Week Total</p>
                <p className="text-sm font-black text-neutral-900 mt-0.5">
                  ₱{Number(dashboardData.sales_analytics.week_total).toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-neutral-200">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wide">Best Day</p>
                <p className="text-sm font-black text-neutral-900 mt-0.5">
                  {dashboardData.sales_analytics.best_day || '—'}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-neutral-200">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wide">Best Sales</p>
                <p className="text-sm font-black text-neutral-900 mt-0.5">
                  ₱{Number(dashboardData.sales_analytics.best_day_sales).toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          )}

          {/* Bar chart */}
          <div className="h-44">
            {dashboardData.sales_analytics?.chart?.length > 0 ? (
              <SalesChart data={dashboardData.sales_analytics.chart} />
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-400 text-xs font-bold">
                NO DATA AVAILABLE
              </div>
            )}
          </div>

          {/* Payment method breakdown */}
          {dashboardData.sales_analytics?.payment_breakdown && (
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wide mb-2">Payment Methods</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(dashboardData.sales_analytics.payment_breakdown).map(([method, count]) => (
                  <span key={method} className="text-[10px] font-black px-2.5 py-1 rounded-full bg-white border border-neutral-200 text-neutral-700 uppercase">
                    {method} · {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}