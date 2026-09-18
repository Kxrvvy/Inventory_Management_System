import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

const RANK_GRADIENTS = [
    { id: 'grad0', from: '#10b981', to: '#065f46' },  // emerald  — #1
    { id: 'grad1', from: '#6366f1', to: '#312e81' },  // indigo   — #2
    { id: 'grad2', from: '#f59e0b', to: '#92400e' },  // amber    — #3
    { id: 'grad3', from: '#6b7280', to: '#374151' },  // gray     — #4
    { id: 'grad4', from: '#9ca3af', to: '#6b7280' },  // light    — #5
];

function ChartTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const { product_name, size, color, total_sold } = payload[0].payload;
    const rank = payload[0].payload._rank ?? 0;
    const accent = RANK_GRADIENTS[rank]?.from ?? '#171717';
    return (
        <div className="bg-neutral-900 text-white text-xs rounded-xl px-3.5 py-3 shadow-2xl border border-neutral-700">
            <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: accent }} />
                <p className="font-black text-white leading-tight">{product_name}</p>
            </div>
            <p className="text-neutral-400 pl-4">{size} · {color}</p>
            <p className="font-black text-lg pl-4 mt-1" style={{ color: accent }}>{total_sold} <span className="text-xs font-bold text-neutral-400">units sold</span></p>
        </div>
    );
}

const ReportsPage = () => {
    const [reportData, setReportData] = useState(null);
    const [filter, setFilter] = useState('daily');
    const [loading, setLoading] = useState(true);

    const fetchReport = async (period) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`http://localhost:8000/reports/${period}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReportData(response.data);
        } catch (error) {
            console.error("Error fetching report:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReport(filter); }, [filter]);

    return (
        <div className="p-8">
            {/* Header matching Staff component */}
            <h1 className="text-2xl font-black mb-8">REPORTS</h1>
            
            {/* Filters matching your button style */}
            <div className="flex gap-4 mb-8">
                {['daily', 'weekly', 'monthly'].map((p) => (
                    <button 
                        key={p}
                        onClick={() => setFilter(p)}
                        className={`px-4 py-1 rounded-3xl font-black text-xs transition ${
                            filter === p ? 'bg-neutral-700 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                    >
                        {p.toUpperCase()}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-20">Loading analytics...</div>
            ) : (
                <>
                    <div className="rounded-xl border border-neutral-200 shadow-sm mb-8 overflow-hidden">
                        {/* Card header */}
                        <div className="bg-neutral-900 px-6 py-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-black text-white uppercase tracking-wide">Top Selling Items</h2>
                                <p className="text-[10px] text-neutral-400 mt-0.5">
                                    {filter === 'daily' ? 'Last 24 hours' : filter === 'weekly' ? 'Last 7 days' : 'Last 30 days'}
                                </p>
                            </div>
                            {/* Rank legend */}
                            <div className="hidden sm:flex items-center gap-3">
                                {RANK_GRADIENTS.slice(0, 3).map((g, i) => (
                                    <div key={i} className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: g.from }} />
                                        <span className="text-[10px] font-bold text-neutral-400">#{i + 1}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Chart area */}
                        <div className="bg-neutral-100 px-6 pb-6 pt-5">
                            {reportData?.top_items?.length > 0 ? (
                                <div style={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <BarChart
                                            data={reportData.top_items.map((item, i) => ({ ...item, _rank: i }))}
                                            barCategoryGap="10%"
                                        >
                                            <defs>
                                                {RANK_GRADIENTS.map((g) => (
                                                    <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor={g.from} stopOpacity={1} />
                                                        <stop offset="100%" stopColor={g.to} stopOpacity={0.9} />
                                                    </linearGradient>
                                                ))}
                                            </defs>
                                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e5e5e5" />
                                            <XAxis
                                                dataKey="product_name"
                                                fontSize={10}
                                                fontWeight={700}
                                                tickLine={false}
                                                axisLine={false}
                                                tick={{ fill: '#737373' }}
                                                tickFormatter={(v) => v.length > 14 ? v.slice(0, 13) + '…' : v}
                                            />
                                            <YAxis
                                                fontSize={10}
                                                fontWeight={700}
                                                tickLine={false}
                                                axisLine={false}
                                                tick={{ fill: '#a3a3a3' }}
                                                width={28}
                                            />
                                            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 8 }} />
                                            <Bar dataKey="total_sold" radius={[8, 8, 0, 0]}>
                                                <LabelList
                                                    dataKey="total_sold"
                                                    position="top"
                                                    style={{ fontSize: 10, fontWeight: 900, fill: '#525252' }}
                                                />
                                                {reportData.top_items.map((_, i) => (
                                                    <Cell
                                                        key={i}
                                                        fill={`url(#${RANK_GRADIENTS[Math.min(i, RANK_GRADIENTS.length - 1)].id})`}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-75 flex items-center justify-center text-neutral-400 text-xs font-bold">
                                    NO SALES DATA AVAILABLE
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="bg-neutral-100 p-6 rounded-xl border border-neutral-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-black text-neutral-900">ALL TRANSACTIONS</h2>
                            <span className="text-xs font-bold text-neutral-500">
                                {reportData?.recent_transactions?.length ?? 0} records
                            </span>
                        </div>
                        <div className="overflow-y-auto max-h-96 scrollbar-thin">
                            <table className="w-full text-left text-xs font-bold text-neutral-600">
                                <thead className="sticky top-0 bg-neutral-100">
                                    <tr className="border-b border-neutral-200 text-neutral-500">
                                        <th className="pb-3 font-black w-16">ID</th>
                                        <th className="pb-3 font-black">ITEMS PURCHASED</th>
                                        <th className="pb-3 font-black w-28">AMOUNT</th>
                                        <th className="pb-3 font-black w-20">METHOD</th>
                                        <th className="pb-3 font-black w-36">DATE & TIME</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData?.recent_transactions?.map((tx) => (
                                        <tr key={tx.transaction_id} className="border-b border-neutral-200 last:border-0 align-top">
                                            <td className="py-3 font-black text-neutral-900">#{tx.transaction_id}</td>
                                            <td className="py-3 text-neutral-700">
                                                {tx.items?.length > 0 ? (
                                                    <ul className="space-y-0.5">
                                                        {tx.items.map((item, i) => (
                                                            <li key={i}>
                                                                <span className="font-black text-neutral-900">{item.product_name}</span>
                                                                <span className="text-neutral-400 font-medium"> · {item.size} / {item.color} × {item.quantity_sold}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <span className="text-neutral-400">—</span>
                                                )}
                                            </td>
                                            <td className="py-3">₱{tx.total_amount?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                                            <td className="py-3 uppercase">{tx.payment_method}</td>
                                            <td className="py-3">{new Date(tx.purchased_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ReportsPage;