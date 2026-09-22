import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';

export default function CartTable({ cart, onUpdateQuantity, onRemove, onClear }) {
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <>
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <ShoppingCart size={16} className="text-neutral-400" />
          <span className="text-white font-bold text-sm">Current Sale</span>
          {totalItems > 0 && (
            <span className="bg-neutral-700 text-neutral-300 text-xs font-bold px-2 py-0.5 rounded-full">
              {totalItems} item{totalItems !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {cart.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-red-400 hover:text-red-300 font-semibold transition"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-dark">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 gap-3 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-neutral-800 flex items-center justify-center">
              <ShoppingCart size={22} className="text-neutral-600" />
            </div>
            <p className="text-neutral-500 text-sm font-medium leading-snug">
              No items yet.<br />
              <span className="text-neutral-600">Click a product to add it to the cart.</span>
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/60">
            {cart.map((item) => (
              <div key={item.cartId} className="flex items-center gap-3 px-5 py-3 hover:bg-neutral-800/30 transition">
                {/* Thumbnail */}
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-neutral-700">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.item_name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-xs font-black">
                      {item.item_name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-bold truncate leading-snug">{item.item_name}</p>
                  <p className="text-neutral-400 text-xs">{item.size} · {item.color}</p>
                  <p className="text-neutral-200 text-xs font-bold mt-0.5">
                    ₱{(item.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Qty controls + remove */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() =>
                      item.quantity === 1 ? onRemove(item.variant_id) : onUpdateQuantity(item.variant_id, -1)
                    }
                    className="w-6 h-6 rounded bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-neutral-300 transition"
                  >
                    <Minus size={10} />
                  </button>
                  <span className="w-6 text-center text-white text-xs font-bold select-none">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.variant_id, 1)}
                    disabled={item.quantity >= item.available_stock}
                    className="w-6 h-6 rounded bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-neutral-300 transition disabled:opacity-30"
                  >
                    <Plus size={10} />
                  </button>
                  <button
                    onClick={() => onRemove(item.variant_id)}
                    className="w-6 h-6 rounded hover:bg-red-900/50 flex items-center justify-center text-neutral-600 hover:text-red-400 transition ml-0.5"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
