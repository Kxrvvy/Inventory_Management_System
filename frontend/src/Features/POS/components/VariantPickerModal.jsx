import { useState, useEffect } from 'react';
import { X, Loader2, Plus, Minus } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const CATEGORY_COLORS = {
  Jackets: 'bg-blue-500',
  Shorts: 'bg-indigo-500',
  Pants: 'bg-slate-500',
  Shirts: 'bg-cyan-600',
  'Tank Tops': 'bg-teal-500',
};

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

function getInitials(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function VariantPickerModal({ product, onClose, onAdd }) {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/product_variants/product/${product.product_id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const active = data.filter((v) => v.status === 'active');
        setVariants(active);
        // Auto-select color if only one exists
        const colors = [...new Set(active.map((v) => v.color))];
        if (colors.length === 1) setSelectedColor(colors[0]);
      })
      .catch(() => setVariants([]))
      .finally(() => setLoading(false));
  }, [product.product_id]);

  // Unique colors, preserving insertion order
  const uniqueColors = [...new Set(variants.map((v) => v.color))];

  // Variants for the selected color, sorted by size order
  const sizesForColor = variants
    .filter((v) => v.color === selectedColor)
    .sort((a, b) => {
      const ai = SIZE_ORDER.indexOf(a.size);
      const bi = SIZE_ORDER.indexOf(b.size);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

  const maxQty = selectedVariant?.quantity_in_stock ?? 1;

  const pickColor = (color) => {
    setSelectedColor(color);
    setSelectedVariant(null);
    setQuantity(1);
  };

  const pickSize = (v) => {
    if (v.quantity_in_stock === 0) return;
    setSelectedVariant(v);
    setQuantity(1);
  };

  const handleAdd = () => {
    if (!selectedVariant) return;
    onAdd({
      cartId: `${selectedVariant.variant_id}-${Date.now()}`,
      product_id: product.product_id,
      item_name: product.item_name,
      variant_id: selectedVariant.variant_id,
      size: selectedVariant.size,
      color: selectedVariant.color,
      price: product.base_price,
      quantity,
      image_url: product.image_url || '',
      available_stock: selectedVariant.quantity_in_stock,
    });
  };

  const fmt = (n) =>
    Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
          {/* Product thumbnail */}
          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-white border border-gray-100">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.item_name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={`w-full h-full items-center justify-center text-white text-xs font-black
                ${CATEGORY_COLORS[product.category] || 'bg-gray-400'}
                ${product.image_url ? 'hidden' : 'flex'}`}
            >
              {getInitials(product.item_name)}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-black text-gray-900 text-sm leading-tight truncate">
              {product.item_name}
            </p>
            <p className="text-gray-400 text-xs mt-0.5">{product.category}</p>
            <p className="text-base font-black text-slate-800 mt-0.5">₱{fmt(product.base_price)}</p>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
          >
            <X size={15} className="text-gray-500" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 scrollbar-thin">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : variants.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-10">
              No variants available for this product.
            </p>
          ) : (
            <>
              {/* ── Step 1: Color ── */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">
                  1 · Color
                </p>
                <div className="flex flex-wrap gap-2">
                  {uniqueColors.map((color) => {
                    const colorVariants = variants.filter((v) => v.color === color);
                    const allOut = colorVariants.every((v) => v.quantity_in_stock === 0);
                    const isActive = selectedColor === color;

                    return (
                      <button
                        key={color}
                        onClick={() => !allOut && pickColor(color)}
                        disabled={allOut}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 text-sm font-bold transition-all ${
                          allOut
                            ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                            : isActive
                            ? 'border-slate-800 bg-slate-800 text-white shadow-md'
                            : 'border-gray-200 text-gray-700 hover:border-slate-400 bg-white'
                        }`}
                      >
                        {/* Color swatch dot */}
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: color.toLowerCase() }}
                        />
                        {color}
                        {allOut && (
                          <span className="text-[10px] font-black text-gray-300 ml-0.5">
                            SOLD OUT
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Step 2: Size ── */}
              {selectedColor && (
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">
                    2 · Size
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {sizesForColor.map((v) => {
                      const outOfStock = v.quantity_in_stock === 0;
                      const lowStock = !outOfStock && v.quantity_in_stock <= v.stock_threshold;
                      const isSelected = selectedVariant?.variant_id === v.variant_id;

                      return (
                        <button
                          key={v.variant_id}
                          onClick={() => pickSize(v)}
                          disabled={outOfStock}
                          className={`relative flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all ${
                            outOfStock
                              ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-40'
                              : isSelected
                              ? 'border-slate-800 bg-slate-800 shadow-md scale-[1.03]'
                              : 'border-gray-200 bg-white hover:border-slate-400 hover:shadow-sm'
                          }`}
                        >
                          <span
                            className={`text-sm font-black leading-none ${
                              isSelected ? 'text-white' : 'text-gray-800'
                            }`}
                          >
                            {v.size}
                          </span>
                          <span
                            className={`text-[10px] font-bold mt-1 leading-none ${
                              outOfStock
                                ? 'text-gray-300'
                                : lowStock
                                ? 'text-amber-500'
                                : isSelected
                                ? 'text-slate-300'
                                : 'text-gray-400'
                            }`}
                          >
                            {outOfStock ? '—' : `${v.quantity_in_stock} left`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Step 3: Quantity ── */}
              {selectedVariant && (
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">
                    3 · Quantity
                  </p>
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <span className="text-sm text-gray-500">
                      Max <span className="font-black text-gray-800">{maxQty}</span>
                    </span>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:bg-gray-100 flex items-center justify-center shadow-sm transition"
                      >
                        <Minus size={13} className="text-gray-600" />
                      </button>
                      <span className="w-6 text-center font-black text-gray-900 text-xl tabular-nums">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                        disabled={quantity >= maxQty}
                        className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:bg-gray-100 flex items-center justify-center shadow-sm transition disabled:opacity-30"
                      >
                        <Plus size={13} className="text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer CTA ── */}
        <div className="px-5 pb-5 pt-2 shrink-0">
          {!selectedColor && !loading && variants.length > 0 && (
            <p className="text-center text-xs text-gray-400 mb-3">Select a color to continue</p>
          )}
          {selectedColor && !selectedVariant && (
            <p className="text-center text-xs text-gray-400 mb-3">Select a size to continue</p>
          )}
          <button
            onClick={handleAdd}
            disabled={!selectedVariant}
            className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-xl transition text-sm"
          >
            {selectedVariant
              ? `Add ${quantity}× to Cart  —  ₱${fmt(product.base_price * quantity)}`
              : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
