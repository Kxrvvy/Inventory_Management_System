import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Loader2, Package, Menu, ShoppingCart } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import SearchBar from './components/SearchBar';
import CategoryFilter from './components/CategoryFilter';
import ProductCard from './components/ProductCard';
import VariantPickerModal from './components/VariantPickerModal';
import CartTable from './components/CartTable';
import PaymentPanel from './components/PaymentPanel';

const API_BASE = 'http://localhost:8000';
const CATEGORIES = ['All', 'Jackets', 'Shorts', 'Pants', 'Shirts', 'Tank Tops'];

// ── Receipt modal ────────────────────────────────────────────────────────────
function ReceiptModal({ receipt, cartSnapshot, onClose }) {
  const fmt = (n) => Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });
  const date = new Date(receipt.purchased_at);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm shadow-2xl p-6 flex flex-col max-h-[90vh]">
        <div className="text-center mb-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-xl font-black text-gray-900">Sale Complete!</h2>
          <p className="text-gray-400 text-sm mt-0.5">Transaction #{receipt.transaction_id}</p>
          <p className="text-gray-400 text-xs">
            {date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
            {' · '}
            {date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-2 overflow-y-auto flex-1 mb-4">
          {cartSnapshot.map((item) => (
            <div key={item.cartId} className="flex justify-between items-start text-sm gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 truncate">{item.item_name}</p>
                <p className="text-gray-400 text-xs">{item.size} · {item.color} × {item.quantity}</p>
              </div>
              <span className="font-bold text-gray-800 shrink-0">₱{fmt(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1.5 mb-5 text-sm border-t border-gray-100 pt-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Total</span>
            <span className="font-bold text-gray-900">₱{fmt(receipt.total_amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Amount tendered</span>
            <span className="font-bold text-gray-900">₱{fmt(receipt.amount_tendered)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Change</span>
            <span className="font-black text-emerald-600">₱{fmt(receipt.change)}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-gray-400 text-xs">Payment method</span>
            <span className="text-gray-600 text-xs capitalize font-semibold">{receipt.payment_method}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-black py-3 rounded-xl transition text-sm"
        >
          New Sale
        </button>
      </div>
    </div>
  );
}

// ── Main POS Dashboard ───────────────────────────────────────────────────────
export default function POSDashboard() {
  const { openSidebar } = useOutletContext() || {};

  const [products, setProducts] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [cartSnapshot, setCartSnapshot] = useState([]);

  // Mobile tab: 'products' | 'cart'
  const [mobileTab, setMobileTab] = useState('products');

  // ── Fetch products ──────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    const token = localStorage.getItem('token');
    setFetching(true);
    setFetchError(null);
    try {
      const res = await fetch(`${API_BASE}/products/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(data.filter((p) => p.status === 'active'));
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filteredProducts = products.filter((p) => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory;
    const matchSearch = p.item_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // ── Cart operations ─────────────────────────────────────────────────────
  const addToCart = (cartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.variant_id === cartItem.variant_id);
      if (existing) {
        return prev.map((i) =>
          i.variant_id === cartItem.variant_id
            ? { ...i, quantity: Math.min(i.quantity + cartItem.quantity, cartItem.available_stock) }
            : i
        );
      }
      return [...prev, cartItem];
    });
    setSelectedProduct(null);
    // Auto-switch to cart tab on mobile after adding
    setMobileTab('cart');
  };

  const updateQuantity = (variant_id, delta) => {
    setCart((prev) =>
      prev.map((i) =>
        i.variant_id === variant_id
          ? { ...i, quantity: Math.max(1, Math.min(i.quantity + delta, i.available_stock)) }
          : i
      )
    );
  };

  const removeFromCart = (variant_id) => setCart((prev) => prev.filter((i) => i.variant_id !== variant_id));
  const clearCart = () => setCart([]);

  // ── Checkout ────────────────────────────────────────────────────────────
  const handleCheckout = async (paymentMethod, amountTendered) => {
    const token = localStorage.getItem('token');
    setProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/pos/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          payment_method: paymentMethod,
          amount_tendered: Number(amountTendered),
          items: cart.map((i) => ({ variant_id: i.variant_id, quantity_sold: i.quantity })),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Transaction failed');
      }
      const data = await res.json();
      setCartSnapshot([...cart]);
      setReceipt(data);
      setCart([]);
      setMobileTab('products');
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // ── Live clock ──────────────────────────────────────────────────────────
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-gray-50">

      {/* ─── Left: Product Catalog ─────────────────────────────────────── */}
      <div
        className={`flex flex-col flex-1 min-w-0 overflow-hidden
          ${mobileTab === 'cart' ? 'hidden lg:flex' : 'flex'}`}
      >
        {/* Top bar */}
        <div className="shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          {/* Hamburger — mobile only */}
          <button
            onClick={openSidebar}
            className="lg:hidden w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition shrink-0"
          >
            <Menu size={17} className="text-gray-700" />
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <Package size={17} className="text-neutral-600 hidden sm:block" />
            <span className="font-black text-neutral-800 text-sm tracking-wide hidden sm:block">
              PUPPET'S DIRECTORY
            </span>
            <span className="text-gray-300 hidden sm:block">·</span>
            <span className="text-gray-400 text-xs font-semibold hidden sm:block">POS</span>
          </div>

          <div className="flex-1">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>

          <span className="text-xs text-gray-400 font-mono shrink-0 hidden md:block">
            {time.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        {/* Category filter */}
        <div className="shrink-0 bg-white border-b border-gray-200 px-4 py-3">
          <CategoryFilter categories={CATEGORIES} active={activeCategory} onChange={setActiveCategory} />
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4 pb-20 lg:pb-4">
          {fetching ? (
            <div className="flex items-center justify-center h-full gap-2 text-gray-400">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm font-medium">Loading products...</span>
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <p className="text-red-500 font-semibold text-sm">{fetchError}</p>
              <button onClick={fetchProducts} className="text-xs bg-neutral-800 text-white px-4 py-2 rounded-lg">Retry</button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
              <Package size={36} className="text-gray-300" />
              <p className="text-sm font-medium">No products found</p>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-xs text-neutral-600 underline">Clear search</button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.product_id} product={product} onClick={() => setSelectedProduct(product)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Right: Sale Panel ─────────────────────────────────────────── */}
      <div
        className={`flex flex-col min-h-0 overflow-hidden bg-neutral-900 border-l border-neutral-800
          lg:flex lg:flex-none lg:w-95 xl:w-105
          ${mobileTab === 'cart' ? 'flex flex-1' : 'hidden'}`}
      >
        {/* Mobile cart top bar */}
        <div className="lg:hidden shrink-0 bg-neutral-800 border-b border-neutral-700 px-4 py-3 flex items-center gap-3">
          <button
            onClick={openSidebar}
            className="w-9 h-9 rounded-lg bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center transition"
          >
            <Menu size={17} className="text-neutral-300" />
          </button>
          <span className="text-white font-black text-sm flex-1">Current Sale</span>
          <ShoppingCart size={16} className="text-neutral-400" />
        </div>

        <CartTable
          cart={cart}
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
          onClear={clearCart}
        />
        <PaymentPanel cart={cart} onCheckout={handleCheckout} processing={processing} />
      </div>

      {/* ─── Mobile bottom tab bar ─────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200 flex shadow-lg">
        <button
          onClick={() => setMobileTab('products')}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-bold transition ${
            mobileTab === 'products' ? 'text-neutral-800' : 'text-gray-400'
          }`}
        >
          <Package size={20} />
          <span>Products</span>
          {mobileTab === 'products' && (
            <span className="absolute bottom-0 left-0 right-1/2 h-0.5 bg-neutral-800 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setMobileTab('cart')}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-bold transition relative ${
            mobileTab === 'cart' ? 'text-neutral-800' : 'text-gray-400'
          }`}
        >
          <div className="relative">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center leading-none px-1">
                {cartCount}
              </span>
            )}
          </div>
          <span>Cart{cartCount > 0 ? ` (${cartCount})` : ''}</span>
          {mobileTab === 'cart' && (
            <span className="absolute bottom-0 left-1/2 right-0 h-0.5 bg-neutral-800 rounded-full" />
          )}
        </button>
      </div>

      {/* ─── Modals ────────────────────────────────────────────────────── */}
      {selectedProduct && (
        <VariantPickerModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={addToCart}
        />
      )}

      {receipt && (
        <ReceiptModal
          receipt={receipt}
          cartSnapshot={cartSnapshot}
          onClose={() => setReceipt(null)}
        />
      )}
    </div>
  );
}
