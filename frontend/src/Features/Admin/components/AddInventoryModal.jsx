import { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import ImageUpload from './ImageUpload';

const CATEGORIES = ['All', 'Jackets', 'Shorts', 'Pants', 'Shirts', 'Tank Tops'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function AddInventoryModal({ onClose, onSave, loading }) {
  // ── Product fields ──────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    item_name: '',
    category: 'Jackets',
    base_price: '',
    image_url: '',
    status: 'active',
  });

  // ── Variant matrix state ────────────────────────────────────────────────────
  const [colorInput, setColorInput] = useState('');
  const [colors, setColors] = useState([]);           // ['Black', 'White', 'Red']
  const [selectedSizes, setSelectedSizes] = useState([...SIZES]); // all on by default
  const [quantities, setQuantities] = useState({});    // { 'M||Black': 10 }
  const [defaultQty, setDefaultQty] = useState('');
  const [threshold, setThreshold] = useState('');

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // ── Color tag management ────────────────────────────────────────────────────
  const addColor = () => {
    const c = colorInput.trim();
    if (!c || colors.includes(c)) return;
    setColors((prev) => [...prev, c]);
    setColorInput('');
  };

  const removeColor = (color) => {
    setColors((prev) => prev.filter((c) => c !== color));
    setQuantities((prev) => {
      const n = { ...prev };
      Object.keys(n).filter((k) => k.endsWith(`||${color}`)).forEach((k) => delete n[k]);
      return n;
    });
  };

  // ── Size toggle ─────────────────────────────────────────────────────────────
  const toggleSize = (size) => {
    setSelectedSizes((prev) =>
      prev.includes(size)
        ? prev.filter((s) => s !== size)
        : [...prev, size].sort((a, b) => SIZES.indexOf(a) - SIZES.indexOf(b))
    );
  };

  // ── Quantity grid helpers ───────────────────────────────────────────────────
  const key = (size, color) => `${size}||${color}`;

  const setQty = (size, color, value) =>
    setQuantities((prev) => ({ ...prev, [key(size, color)]: value }));

  const applyDefaultToAll = () => {
    if (defaultQty === '') return;
    const next = {};
    selectedSizes.forEach((s) => colors.forEach((c) => { next[key(s, c)] = defaultQty; }));
    setQuantities(next);
  };

  // ── Build flat variants array for submission ────────────────────────────────
  const buildVariants = () => {
    const variants = [];
    for (const size of selectedSizes) {
      for (const color of colors) {
        variants.push({
          size,
          color,
          quantity_in_stock: Number(quantities[key(size, color)]) || 0,
          stock_threshold: Number(threshold) || 0,
        });
      }
    }
    return variants;
  };

  const handleSubmit = () => {
    if (!(form.item_name || '').trim()) return;
    onSave(form, buildVariants());
  };

  const inputCls = 'bg-gray-800 text-white text-sm rounded-lg px-3 py-2 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600';
  const hasMatrix = colors.length > 0 && selectedSizes.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-2xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-lg font-semibold">Add Product</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* ── Product fields ── */}
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-1">Product name *</label>
            <input type="text" value={form.item_name} onChange={handleChange('item_name')}
              placeholder="e.g., Denim Jacket" className={`w-full ${inputCls}`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm mb-1">Category *</label>
              <select value={form.category} onChange={handleChange('category')} className={`w-full ${inputCls}`}>
                {CATEGORIES.filter((c) => c !== 'All').map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-1">Base price (₱) *</label>
              <input type="number" min="0" value={form.base_price} onChange={handleChange('base_price')}
                placeholder="e.g., 799" className={`w-full ${inputCls}`} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ImageUpload inputId="add-product-photo" value={form.image_url}
              onChange={(url) => setForm((prev) => ({ ...prev, image_url: url }))}
              label="Product photo" />
            <div>
              <label className="block text-gray-300 text-sm mb-1">Status</label>
              <select value={form.status} onChange={handleChange('status')} className={`w-full ${inputCls}`}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Variants matrix ── */}
        <div className="mt-7 border-t border-gray-700 pt-6 space-y-5">
          <h3 className="text-white text-sm font-semibold">Variants</h3>

          {/* Step 1 — Colors */}
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase tracking-wide mb-2">
              1 · Add Colors
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                placeholder="e.g. Black"
                className={`flex-1 ${inputCls}`}
              />
              <button
                onClick={addColor}
                className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 rounded-lg transition flex items-center gap-1"
              >
                <Plus size={14} /> Add
              </button>
            </div>

            {/* Color tags */}
            {colors.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {colors.map((color) => (
                  <span key={color} className="flex items-center gap-1.5 bg-gray-700 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    {color}
                    <button onClick={() => removeColor(color)} className="text-gray-400 hover:text-red-400 transition">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Step 2 — Sizes */}
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase tracking-wide mb-2">
              2 · Select Sizes
            </label>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((size) => {
                const on = selectedSizes.includes(size);
                return (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                      on ? 'bg-gray-200 text-gray-900' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3 — Quantity grid */}
          {hasMatrix && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wide">
                  3 · Set Quantities
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={defaultQty}
                    onChange={(e) => setDefaultQty(e.target.value)}
                    placeholder="Default qty"
                    className="w-28 bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-600"
                  />
                  <button
                    onClick={applyDefaultToAll}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition whitespace-nowrap"
                  >
                    Apply to all
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-700">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-800">
                      <th className="text-left text-gray-400 font-bold px-4 py-2.5 w-16">Size</th>
                      {colors.map((color) => (
                        <th key={color} className="text-center text-gray-300 font-bold px-3 py-2.5 min-w-22.5">
                          {color}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSizes.map((size, ri) => (
                      <tr key={size} className={ri % 2 === 0 ? 'bg-gray-900' : 'bg-gray-850'}>
                        <td className="px-4 py-2">
                          <span className="bg-gray-700 text-white font-black px-2 py-0.5 rounded text-xs">{size}</span>
                        </td>
                        {colors.map((color) => (
                          <td key={color} className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              value={quantities[key(size, color)] ?? ''}
                              onChange={(e) => setQty(size, color, e.target.value)}
                              placeholder="0"
                              className="w-full bg-gray-700 text-white text-xs text-center rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-500 placeholder-gray-600"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Global threshold */}
              <div className="flex items-center gap-3 mt-3">
                <label className="text-gray-400 text-xs whitespace-nowrap">Low-stock threshold (all variants):</label>
                <input
                  type="number"
                  min="0"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder="5"
                  className="w-20 bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-600 placeholder-gray-600"
                />
              </div>

              {/* Preview count */}
              <p className="text-gray-600 text-xs mt-2">
                {selectedSizes.length * colors.length} variant{selectedSizes.length * colors.length !== 1 ? 's' : ''} will be created
              </p>
            </div>
          )}

          {!hasMatrix && (
            <p className="text-gray-600 text-xs italic">
              Add at least one color and select at least one size to build the variant grid.
            </p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-6 bg-gray-200 hover:bg-white text-gray-900 font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
            : `Save Product${hasMatrix ? ` + ${selectedSizes.length * colors.length} Variants` : ''}`}
        </button>
      </div>
    </div>
  );
}
