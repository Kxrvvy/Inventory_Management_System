import { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Pencil, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import AddInventoryModal from './components/AddInventoryModal';
import EditInventoryModal from './components/EditInventoryModal';

const API_BASE = 'http://localhost:8000';

const CATEGORIES = ['All', 'Jackets', 'Shorts', 'Pants', 'Shirts', 'Tank Tops'];

const CATEGORY_COLORS = {
  Jackets: 'bg-blue-600',
  Shorts: 'bg-indigo-600',
  Pants: 'bg-slate-600',
  Shirts: 'bg-cyan-700',
  'Tank Tops': 'bg-teal-600',
};

function getInitials(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'NA';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function waitForToken(maxWaitMs = 3000) {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token) { clearInterval(interval); resolve(token); }
    }, 100);
    setTimeout(() => { clearInterval(interval); resolve(null); }, maxWaitMs);
  });
}

export default function AdminInventory() {
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setFetching(true);
    setError(null);

    const token = await waitForToken(3000);

    if (!token) {
      setError('Not authenticated. Please log in again.');
      setFetching(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/products/`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to fetch products');
      }

      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError(err.message || 'Failed to load products. Make sure the server is running.');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredItems =
    activeCategory === 'All'
      ? items
      : items.filter((item) => item.category === activeCategory);

  const handleSaveNewItem = async (form, variants) => {
    const token = localStorage.getItem('token');
    setLoading(true);
    try {
      const productRes = await fetch(`${API_BASE}/products/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          item_name: (form.item_name || '').trim(),
          category: form.category,
          base_price: Number(form.base_price) || 0,
          image_url: (form.image_url || '').trim() || null,
          status: form.status,
        }),
      });

      if (!productRes.ok) {
        const err = await productRes.json();
        throw new Error(err.detail || 'Failed to create product');
      }

      const newProduct = await productRes.json();

      for (const v of variants) {
        const size = (v.size || '').trim();
        const color = (v.color || '').trim();
        if (!size || !color) continue;

        const variantRes = await fetch(`${API_BASE}/product_variants/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            product_id: newProduct.product_id,
            size,
            color,
            quantity_in_stock: Number(v.quantity_in_stock) || 0,
            stock_threshold: Number(v.stock_threshold) || 0,
          }),
        });

        if (!variantRes.ok) {
          const err = await variantRes.json();
          throw new Error(err.detail || `Failed to create variant (${v.size} / ${v.color})`);
        }
      }

      setItems((prev) => [newProduct, ...prev]);
      setIsAddModalOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (product_id, form) => {
    const token = localStorage.getItem('token');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/products/${product_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          item_name: (form.item_name || '').trim(),
          category: form.category,
          base_price: Number(form.base_price) || 0,
          image_url: (form.image_url || '').trim() || null,
          status: form.status,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to update product');
      }

      const updated = await response.json();
      setItems((prev) =>
        prev.map((item) => (item.product_id === product_id ? updated : item))
      );
      setEditingItem(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (product_id, name) => {
    if (!window.confirm(`Delete "${name}" from inventory?`)) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE}/products/${product_id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to delete product');
      }

      setItems((prev) => prev.filter((item) => item.product_id !== product_id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="p-8">
      <div className="bg-neutral-100 rounded-xl p-6">

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Package size={20} />
            <h1 className="font-black text-2xl">
              INVENTORY ({filteredItems.length})
            </h1>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-neutral-700 hover:bg-neutral-800 text-white font-bold text-xs px-6 py-2 rounded-lg transition"
          >
            <Plus size={16} />
            ADD PRODUCT
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-100 border border-red-300 rounded-lg px-4 py-3 mb-4">
            <AlertCircle size={16} />
            <span className="text-sm font-bold">{error}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition ${
                activeCategory === category
                  ? 'bg-neutral-800 text-white'
                  : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {fetching ? (
          <div className="flex items-center justify-center py-16 gap-2 text-neutral-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm font-bold">Loading inventory...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.product_id}
                className="flex flex-wrap items-center justify-between gap-3 bg-white border border-neutral-200 rounded-xl px-4 py-3 shadow-sm"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.item_name}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-10 h-10 rounded-full ${
                      CATEGORY_COLORS[item.category] || 'bg-neutral-600'
                    } flex items-center justify-center text-white text-xs font-black shrink-0 ${
                      item.image_url ? 'hidden' : ''
                    }`}
                  >
                    {getInitials(item.item_name)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-sm text-neutral-900">{item.item_name}</span>
                    <span className="text-neutral-500 text-xs font-bold">
                      {item.category} · ₱{item.base_price}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-xs font-black px-3 py-1 rounded-full ${
                    item.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {item.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="flex items-center gap-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-black px-3 py-1.5 rounded-lg transition border border-neutral-300"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.product_id, item.item_name)}
                    className="flex items-center gap-1 bg-neutral-100 hover:bg-red-100 text-red-600 text-xs font-black px-3 py-1.5 rounded-lg transition border border-neutral-300"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && !fetching && (
              <div className="text-center text-neutral-400 py-10 font-bold">
                No products in this category yet. Click "Add Product" to create one.
              </div>
            )}
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <AddInventoryModal
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSaveNewItem}
          loading={loading}
        />
      )}

      {editingItem && (
        <EditInventoryModal
          key={editingItem.product_id}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveEdit}
          loading={loading}
        />
      )}
    </div>
  );
}
