import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const fmt = (n) => Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const { sales, transactions, date } = payload[0].payload;
  return (
    <div className="bg-neutral-900 text-white text-xs rounded-xl px-3 py-2.5 shadow-xl">
      <p className="font-black text-white mb-1">{date}</p>
      <p className="text-neutral-300">₱{fmt(sales)}</p>
      <p className="text-neutral-500">{transactions} transaction{transactions !== 1 ? 's' : ''}</p>
    </div>
  );
}

export default function SalesChart({ data }) {
  if (!data || data.length === 0) return null;

  const maxSales = Math.max(...data.map((d) => d.sales), 1);
  const today = new Date().toLocaleDateString('en-PH', { weekday: 'short' });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis
          dataKey="day"
          fontSize={10}
          fontWeight={700}
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#a3a3a3' }}
        />
        <YAxis
          fontSize={10}
          fontWeight={700}
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#a3a3a3' }}
          tickFormatter={(v) => v >= 1000 ? `₱${(v / 1000).toFixed(0)}k` : `₱${v}`}
          width={45}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 8 }} />
        <Bar dataKey="sales" radius={[6, 6, 0, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.day}
              fill={
                entry.day === today
                  ? '#171717'
                  : entry.sales === maxSales
                  ? '#404040'
                  : '#e5e5e5'
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
