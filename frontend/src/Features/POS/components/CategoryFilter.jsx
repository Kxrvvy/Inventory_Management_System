export default function CategoryFilter({ categories, active, onChange }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
            active === cat
              ? 'bg-slate-800 text-white shadow-sm'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
