const INPUT_CLS = 'w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600 scheme-dark';

// Optional per-product discount: a percentage plus the date range it applies to.
export default function DiscountFields({ form, onChange }) {
  return (
    <div className="border border-gray-700 rounded-xl p-3 space-y-3">
      <div>
        <p className="text-gray-300 text-sm font-semibold">Discount <span className="text-gray-500 font-normal">(optional)</span></p>
        <p className="text-gray-500 text-xs mt-0.5">Applied automatically at the POS on the dates below.</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-gray-400 text-xs mb-1">Percent off</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              value={form.discount_percent}
              onChange={(e) => onChange('discount_percent', e.target.value)}
              placeholder="e.g. 20"
              className={`${INPUT_CLS} pr-7`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
          </div>
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1">From</label>
          <input
            type="date"
            value={form.discount_start}
            onChange={(e) => {
              const start = e.target.value;
              onChange('discount_start', start);
              // Keep the range valid: if the end is now before the start, move it to the start day
              if (start && form.discount_end && form.discount_end < start) onChange('discount_end', start);
            }}
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1">Until</label>
          <input
            type="date"
            min={form.discount_start || undefined}
            value={form.discount_end}
            onChange={(e) => onChange('discount_end', e.target.value)}
            className={INPUT_CLS}
          />
        </div>
      </div>
      <p className="text-gray-600 text-xs italic">
        For a one-day discount, pick the same date in both. Leave the dates empty to keep it on until you clear the percent.
      </p>
    </div>
  );
}
