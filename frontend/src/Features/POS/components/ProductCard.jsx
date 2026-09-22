const CATEGORY_COLORS = {
  Jackets: 'bg-blue-500',
  Shorts: 'bg-indigo-500',
  Pants: 'bg-slate-500',
  Shirts: 'bg-cyan-600',
  'Tank Tops': 'bg-teal-500',
};

function getInitials(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function ProductCard({ product, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 hover:border-gray-200 transition-all duration-150 active:scale-[0.97] flex flex-col overflow-hidden text-left"
    >
      {/* Image */}
      <div className="w-full aspect-square overflow-hidden bg-white">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.item_name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className={`w-full h-full items-center justify-center text-white text-2xl font-black ${CATEGORY_COLORS[product.category] || 'bg-gray-400'} ${product.image_url ? 'hidden' : 'flex'}`}
        >
          {getInitials(product.item_name)}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-0.5 flex-1">
        <span className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug">
          {product.item_name}
        </span>
        <span className="text-xs text-gray-400">{product.category}</span>
        <span className="text-sm font-black text-slate-800 mt-1">
          ₱{Number(product.base_price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </button>
  );
}
