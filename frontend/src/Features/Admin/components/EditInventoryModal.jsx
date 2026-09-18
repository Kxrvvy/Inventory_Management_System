import { useState, useEffect } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import ImageUpload from './ImageUpload';

const API_BASE = 'http://localhost:8000';
const CATEGORIES = ['All', 'Jackets', 'Shorts', 'Pants', 'Shirts', 'Tank Tops'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const EMPTY_VARIANT = () => ({ size: 'M', color: '', quantity_in_stock: '', stock_threshold: '' });

const INPUT_CLS = 'w-full bg-gray-700 text-white text-sm rounded-lg px-2 py-1.5 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500';

export default function EditInventoryModal({ item, onClose, onSave, loading }) {
  const [form, setForm] = useState({
    item_name: item.item_name,
    category: item.category,
    base_price: item.base_price,
    image_url: item.image_url || '',
    status: item.status,
  });

  const [variants, setVariants] = useState([]);
  const [fetchingVariants, setFetchingVariants] = useState(true);
  const [variantBusy, setVariantBusy] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [variantEditForm, setVariantEditForm] = useState({});
  const [restockAmounts, setRestockAmounts] = useState({});
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [newVariant, setNewVariant] = useState(EMPTY_VARIANT());

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/product_variants/product/${item.product_id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setVariants)
      .catch(() => {})
      .finally(() => setFetchingVariants(false));
  }, [item.product_id]);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = () => {
    if (!form.item_name.trim()) return;
    onSave(item.product_id, form);
  };

  // ── Restock ──
  const handleRestock = async (variantId) => {
    const amount = Number(restockAmounts[variantId]);
    if (!amount || amount <= 0) return alert('Enter a positive quantity to restock.');
    const token = localStorage.getItem('token');
    setVariantBusy(true);
    try {
      const res = await fetch(`${API_BASE}/restock/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ variant_id: variantId, quantity_added: amount }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Restock failed');
      setVariants((prev) =>
        prev.map((v) =>
          v.variant_id === variantId
            ? { ...v, quantity_in_stock: v.quantity_in_stock + amount }
            : v
        )
      );
      setRestockAmounts((prev) => ({ ...prev, [variantId]: '' }));
    } catch (err) { alert(err.message); }
    finally { setVariantBusy(false); }
  };

  // ── Edit variant ──
  const startEdit = (v) => {
    setEditingVariantId(v.variant_id);
    setVariantEditForm({ size: v.size, color: v.color, stock_threshold: v.stock_threshold });
  };

  const handleSaveVariantEdit = async (variantId) => {
    const token = localStorage.getItem('token');
    setVariantBusy(true);
    try {
      const res = await fetch(`${API_BASE}/product_variants/${variantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          size: variantEditForm.size,
          color: variantEditForm.color,
          stock_threshold: Number(variantEditForm.stock_threshold) || 0,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Update failed');
      const updated = await res.json();
      setVariants((prev) => prev.map((v) => (v.variant_id === variantId ? updated : v)));
      setEditingVariantId(null);
    } catch (err) { alert(err.message); }
    finally { setVariantBusy(false); }
  };

  // ── Delete variant ──
  const handleDeleteVariant = async (variantId) => {
    if (!window.confirm('Delete this variant permanently?')) return;
    const token = localStorage.getItem('token');
    setVariantBusy(true);
    try {
      const res = await fetch(`${API_BASE}/product_variants/${variantId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Delete failed');
      setVariants((prev) => prev.filter((v) => v.variant_id !== variantId));
    } catch (err) { alert(err.message); }
    finally { setVariantBusy(false); }
  };

  // ── Add variant ──
  const handleAddVariant = async () => {
    if (!newVariant.size || !(newVariant.color || '').trim()) return alert('Size and color are required.');
    const token = localStorage.getItem('token');
    setVariantBusy(true);
    try {
      const res = await fetch(`${API_BASE}/product_variants/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          product_id: item.product_id,
          size: newVariant.size,
          color: newVariant.color.trim(),
          quantity_in_stock: Number(newVariant.quantity_in_stock) || 0,
          stock_threshold: Number(newVariant.stock_threshold) || 0,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to add variant');
      const created = await res.json();
      setVariants((prev) => [...prev, created]);
      setNewVariant(EMPTY_VARIANT());
      setShowAddVariant(false);
    } catch (err) { alert(err.message); }
    finally { setVariantBusy(false); }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-lg font-semibold">Edit Product</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* ── Product fields ── */}
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-1">Product name *</label>
            <input type="text" value={form.item_name} onChange={handleChange('item_name')}
              className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500" />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-1">Category</label>
            <select value={form.category} onChange={handleChange('category')}
              className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500">
              {CATEGORIES.filter((c) => c !== 'All').map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-1">Base price (₱)</label>
            <input type="number" min="0" value={form.base_price} onChange={handleChange('base_price')}
              className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500" />
          </div>
          <ImageUpload
            inputId={`edit-product-photo-${item.product_id}`}
            value={form.image_url}
            onChange={(url) => setForm((prev) => ({ ...prev, image_url: url }))}
            label="Product photo"
          />
          <div>
            <label className="block text-gray-300 text-sm mb-1">Status</label>
            <select value={form.status} onChange={handleChange('status')}
              className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* ── Variants & Stock ── */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-300 text-sm font-semibold">Variants &amp; Stock</span>
            <button
              onClick={() => { setShowAddVariant(true); setNewVariant(EMPTY_VARIANT()); }}
              className="flex items-center gap-1 text-xs text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition"
            >
              <Plus size={13} /> Add Variant
            </button>
          </div>

          {fetchingVariants ? (
            <div className="flex items-center gap-2 text-gray-500 text-xs py-2">
              <Loader2 size={14} className="animate-spin" /> Loading variants...
            </div>
          ) : (
            <div className="space-y-3">
              {variants.length === 0 && !showAddVariant && (
                <p className="text-gray-500 text-xs italic">No variants yet. Click "Add Variant" to create one.</p>
              )}

              {variants.map((v) => (
                <div key={v.variant_id} className="bg-gray-800 rounded-xl p-3 space-y-2">

                  {/* Info row */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold bg-gray-700 text-white px-2 py-0.5 rounded">{v.size}</span>
                      <span className="text-gray-300 text-xs font-medium">{v.color}</span>
                      <span className={`text-xs font-bold ${v.quantity_in_stock <= v.stock_threshold ? 'text-red-400' : 'text-green-400'}`}>
                        Qty: {v.quantity_in_stock}
                      </span>
                      <span className="text-gray-500 text-xs">Min: {v.stock_threshold}</span>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => editingVariantId === v.variant_id ? setEditingVariantId(null) : startEdit(v)}
                        className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded-lg transition"
                      >
                        {editingVariantId === v.variant_id ? 'Cancel' : 'Edit'}
                      </button>
                      <button
                        onClick={() => handleDeleteVariant(v.variant_id)}
                        disabled={variantBusy}
                        className="text-xs bg-gray-700 hover:bg-red-900/60 text-red-400 px-2 py-1 rounded-lg transition disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Restock row */}
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty to add"
                      value={restockAmounts[v.variant_id] || ''}
                      onChange={(e) => setRestockAmounts((prev) => ({ ...prev, [v.variant_id]: Number(e.target.value) }))}
                      className="flex-1 bg-gray-700 text-white text-xs rounded-lg px-2 py-1.5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                    />
                    <button
                      onClick={() => handleRestock(v.variant_id)}
                      disabled={variantBusy || !restockAmounts[v.variant_id]}
                      className="text-xs bg-green-800 hover:bg-green-700 text-green-200 font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-40 shrink-0"
                    >
                      + Restock
                    </button>
                  </div>

                  {/* Inline edit form */}
                  {editingVariantId === v.variant_id && (
                    <div className="border-t border-gray-700 pt-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-gray-400 text-xs mb-1">Size</label>
                          <select value={variantEditForm.size}
                            onChange={(e) => setVariantEditForm((p) => ({ ...p, size: e.target.value }))}
                            className={INPUT_CLS}>
                            {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-400 text-xs mb-1">Color</label>
                          <input type="text" value={variantEditForm.color}
                            onChange={(e) => setVariantEditForm((p) => ({ ...p, color: e.target.value }))}
                            className={INPUT_CLS} placeholder="e.g., Black" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-400 text-xs mb-1">Low-stock threshold</label>
                        <input type="number" min="0" value={variantEditForm.stock_threshold}
                          onChange={(e) => setVariantEditForm((p) => ({ ...p, stock_threshold: e.target.value }))}
                          className={INPUT_CLS} placeholder="5" />
                      </div>
                      <button
                        onClick={() => handleSaveVariantEdit(v.variant_id)}
                        disabled={variantBusy}
                        className="w-full text-xs bg-gray-200 hover:bg-white text-gray-900 font-bold py-1.5 rounded-lg transition disabled:opacity-50"
                      >
                        {variantBusy ? 'Saving...' : 'Save Variant'}
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Add new variant form */}
              {showAddVariant && (
                <div className="bg-gray-800 rounded-xl p-4 space-y-3 border border-gray-600">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wide">New Variant</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">Size *</label>
                      <select value={newVariant.size}
                        onChange={(e) => setNewVariant((p) => ({ ...p, size: e.target.value }))}
                        className={INPUT_CLS}>
                        {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">Color *</label>
                      <input type="text" value={newVariant.color}
                        onChange={(e) => setNewVariant((p) => ({ ...p, color: e.target.value }))}
                        placeholder="e.g., Black" className={INPUT_CLS} />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">Quantity</label>
                      <input type="number" min="0" value={newVariant.quantity_in_stock}
                        onChange={(e) => setNewVariant((p) => ({ ...p, quantity_in_stock: e.target.value }))}
                        placeholder="0" className={INPUT_CLS} />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">Min threshold</label>
                      <input type="number" min="0" value={newVariant.stock_threshold}
                        onChange={(e) => setNewVariant((p) => ({ ...p, stock_threshold: e.target.value }))}
                        placeholder="5" className={INPUT_CLS} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddVariant} disabled={variantBusy}
                      className="flex-1 text-xs bg-gray-200 hover:bg-white text-gray-900 font-bold py-1.5 rounded-lg transition disabled:opacity-50">
                      {variantBusy ? 'Saving...' : 'Save Variant'}
                    </button>
                    <button onClick={() => setShowAddVariant(false)}
                      className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Save product button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-6 bg-gray-200 hover:bg-white text-gray-900 font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Save Product Changes'}
        </button>
      </div>
    </div>
  );
}
