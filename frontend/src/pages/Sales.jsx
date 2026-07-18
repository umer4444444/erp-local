import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ShoppingCart, Package, Plus, Trash, CreditCard, Banknote, Search, 
  ArrowRight, Zap, Target, X, Printer, Minus, UserPlus, History, DollarSign,
  Star, User, Gift, ChevronDown, AlertCircle, Wifi, WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { salesAPI, inventoryAPI, customerAPI, shiftAPI } from '../api';

// IndexedDB helpers for offline queue
const DB_NAME = 'erp_offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending_sales';

const openDB = () => new Promise((resolve, reject) => {
  const req = indexedDB.open(DB_NAME, DB_VERSION);
  req.onupgradeneeded = e => e.target.result.createObjectStore(STORE_NAME, { keyPath: 'localId', autoIncrement: true });
  req.onsuccess = e => resolve(e.target.result);
  req.onerror = () => reject(req.error);
});

const queueOfflineSale = async (saleData) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add({ ...saleData, queuedAt: Date.now() });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
};

const getPendingSales = async () => {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result);
  });
};

const clearPendingSale = async (localId) => {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(localId);
    tx.oncomplete = resolve;
  });
};

const TIER_CONFIG = {
  Bronze: { color: '#cd7f32', bg: '#fdf6ec', min: 0 },
  Silver: { color: '#94a3b8', bg: '#f1f5f9', min: 500 },
  Gold:   { color: '#f59e0b', bg: '#fffbeb', min: 1500 },
  Platinum: { color: '#8b5cf6', bg: '#f5f3ff', min: 5000 },
};

const ProductCard = React.memo(({ product, onAdd }) => (
  <motion.div 
    whileHover={{ y: -5, boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }}
    whileTap={{ scale: 0.98 }}
    onClick={() => onAdd(product)}
    style={{
      background: 'white', borderRadius: 16, padding: 14, cursor: 'pointer',
      border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
      display: 'flex', flexDirection: 'column', gap: 10,
      opacity: product.stock <= 0 ? 0.5 : 1,
      pointerEvents: product.stock <= 0 ? 'none' : 'auto'
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        <Package size={18} />
      </div>
      <div style={{ background: product.stock < 10 ? '#fff1f2' : '#f0fdf4', color: product.stock < 10 ? '#e11d48' : '#16a34a', fontSize: 10, fontWeight: 800, padding: '4px 6px', borderRadius: 6 }}>
        {product.stock <= 0 ? 'Out of Stock' : `${product.stock} in stock`}
      </div>
    </div>
    <div>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{product.name}</div>
      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{product.sku || 'No SKU'}</div>
    </div>
    <div style={{ fontSize: 18, fontWeight: 900, color: '#0a84ff' }}>${product.price}</div>
  </motion.div>
));

const Sales = () => {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [globalDiscount, setGlobalDiscount] = useState('');
  const [discountType, setDiscountType] = useState('flat'); // 'flat' or 'percent'
  const [extraCharges, setExtraCharges] = useState('');
  const [extraChargeReason, setExtraChargeReason] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [cashTendered, setCashTendered] = useState('');
  const [splitAmount, setSplitAmount] = useState({ cash: 0, card: 0 });
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncingOffline, setSyncingOffline] = useState(false);

  const [leftPanelWidth, setLeftPanelWidth] = useState(480);
  const isDragging = useRef(false);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    let newWidth = e.clientX;
    if (newWidth < 350) newWidth = 350;
    if (newWidth > window.innerWidth * 0.7) newWidth = window.innerWidth * 0.7;
    setLeftPanelWidth(newWidth);
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = 'default';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const searchRef = useRef();
  const customerSearchRef = useRef();

  // Online/offline detection
  useEffect(() => {
    const onOnline = () => { setIsOnline(true); syncOfflineQueue(); };
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    checkPendingCount();
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const checkPendingCount = async () => {
    const pending = await getPendingSales();
    setPendingCount(pending.length);
  };

  const syncOfflineQueue = async () => {
    const pending = await getPendingSales();
    if (!pending.length) return;
    setSyncingOffline(true);
    for (const sale of pending) {
      try {
        const { localId, queuedAt, ...saleData } = sale;
        await salesAPI.createSale(saleData);
        await clearPendingSale(localId);
      } catch (e) { /* skip failed */ }
    }
    setSyncingOffline(false);
    checkPendingCount();
  };

  useEffect(() => {
    const fetchProducts = () => inventoryAPI.getProducts().then(res => setProducts(res.data)).catch(() => {});
    fetchProducts();
    const interval = setInterval(fetchProducts, 30000);
    window.addEventListener('keydown', handleGlobalKey);
    return () => {
      window.removeEventListener('keydown', handleGlobalKey);
      clearInterval(interval);
    };
  }, []);

  const handleGlobalKey = (e) => {
    if (e.key === 'F2') searchRef.current?.focus();
    if (e.key === 'F8') handleCheckout();
  };

  // Customer search with debounce
  useEffect(() => {
    if (!customerSearch.trim()) { setCustomerResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await customerAPI.search(customerSearch);
        setCustomerResults(res.data.slice(0, 6));
        setShowCustomerDropdown(true);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [customerSearch]);

  const selectCustomer = (c) => {
    setSelectedCustomer(c);
    setCustomerSearch(c.name);
    setWalkinName(c.name);
    setWalkinPhone(c.phone || '');
    setShowCustomerDropdown(false);
    setCustomerResults([]);
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerSearch('');
    setWalkinName('');
    setWalkinPhone('');
    setRedeemPoints(false);
  };

  const addToCart = useCallback((product) => {
    if (product.stock <= 0) {
      alert("Item is out of stock!");
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Cannot add more. Only ${product.stock} in stock.`);
          return prev;
        }
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        return [...prev, { 
          productId: product.id, 
          name: product.name, 
          price: parseFloat(product.price), 
          quantity: 1, 
          stock: product.stock,
          discountAmount: 0 
        }];
      }
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  }, []);

  const updateQty = useCallback((productId, delta) => {
    setCart(prev => prev.map(i => {
      if (i.productId !== productId) return i;
      const newQty = i.quantity + delta;
      if (newQty <= 0) return null;
      if (newQty > i.stock) {
        alert(`Cannot exceed available stock of ${i.stock}.`);
        return i;
      }
      return { ...i, quantity: newQty };
    }).filter(Boolean));
  }, []);

  const subtotal = cart.reduce((sum, i) => sum + (i.price * i.quantity) - i.discountAmount, 0);
  
  // Loyalty redemption: 100 pts = $1
  const loyaltyPoints = selectedCustomer?.loyaltyPoints || 0;
  const maxRedeem = Math.min(loyaltyPoints / 100, subtotal * 0.2); // max 20% off via points
  const loyaltyDiscount = redeemPoints ? maxRedeem : 0;
  
  const rawDiscountVal = parseFloat(globalDiscount || 0);
  const calculatedDiscount = discountType === 'percent' ? (subtotal * rawDiscountVal) / 100 : rawDiscountVal;

  const extraChargesVal = parseFloat(extraCharges || 0);
  const taxAmount = (subtotal - calculatedDiscount - loyaltyDiscount) * (parseFloat(taxRate || 0) / 100);
  const total = Math.max(subtotal - calculatedDiscount - loyaltyDiscount + taxAmount + extraChargesVal, 0);
  const changeDue = paymentMethod === 'cash' && cashTendered ? Math.max(parseFloat(cashTendered) - total, 0) : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Cart is empty');
    setProcessing(true);
    const saleData = {
      items: cart,
      customerId: selectedCustomer?.id,
      customerName: walkinName || selectedCustomer?.name,
      customerPhone: walkinPhone || selectedCustomer?.phone,
      totalAmount: subtotal,
      discount: calculatedDiscount + loyaltyDiscount,
      discountType,
      extraCharges: extraChargesVal,
      extraChargeReason,
      creditReason,
      tax: taxAmount,
      grandTotal: total,
      paymentMethod,
      cashAmount: paymentMethod === 'split' ? splitAmount.cash : (paymentMethod === 'cash' ? total : 0),
      cardAmount: paymentMethod === 'split' ? splitAmount.card : (paymentMethod === 'card' ? total : 0),
      redeemPoints: redeemPoints,
      pointsRedeemed: redeemPoints ? Math.floor(maxRedeem * 100) : 0,
      cashierName: currentUser.name || 'Staff'
    };

    try {
      if (!isOnline) {
        await queueOfflineSale(saleData);
        checkPendingCount();
        setReceipt({ ...saleData, id: 'OFFLINE-' + Date.now(), createdAt: new Date().toISOString(), items: [...cart], changeDue, cashTendered: cashTendered || total, offline: true });
      } else {
        const res = await salesAPI.createSale(saleData);
        setReceipt({ ...res.data, items: [...cart], changeDue, cashTendered: cashTendered || total, cashierName: currentUser.name || 'Staff' });
      }
      setCart([]);
      setSelectedCustomer(null);
      setWalkinName('');
      setWalkinPhone('');
      setGlobalDiscount('');
      setDiscountType('flat');
      setExtraCharges('');
      setExtraChargeReason('');
      setCreditReason('');
      setTaxRate('');
      setCashTendered('');
      setPaymentMethod('cash');
      setCustomerSearch('');
      setRedeemPoints(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Checkout failed');
    } finally {
      setProcessing(false);
    }
  };

  const getTierInfo = (points) => {
    if (points >= 5000) return TIER_CONFIG.Platinum;
    if (points >= 1500) return TIER_CONFIG.Gold;
    if (points >= 500) return TIER_CONFIG.Silver;
    return TIER_CONFIG.Bronze;
  };

  const getTierName = (points) => {
    if (points >= 5000) return 'Platinum';
    if (points >= 1500) return 'Gold';
    if (points >= 500) return 'Silver';
    return 'Bronze';
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `${leftPanelWidth}px 6px 1fr`, height: '100vh', background: '#f1f5f9', overflow: 'hidden' }}>
      
      {/* Left Side: Cart & Checkout (Centered & Larger) */}
      <div style={{ background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>Current Cart</h2>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#0a84ff', background: '#eff6ff', padding: '4px 10px', borderRadius: 8 }}>
              Cashier: {currentUser.name || 'Staff'}
            </div>
          </div>
          
          {/* Customer Search & Direct Details Input */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, border: `1px solid ${selectedCustomer ? '#0a84ff' : '#e2e8f0'}`, background: selectedCustomer ? '#eff6ff' : 'white' }}>
              <User size={16} color={selectedCustomer ? '#0a84ff' : '#94a3b8'} />
              {selectedCustomer ? (
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{selectedCustomer.name}</div>
                    <div style={{ fontSize: 11, color: '#0a84ff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={10} fill="#f59e0b" color="#f59e0b" /> {selectedCustomer.loyaltyPoints || 0} pts · {getTierName(selectedCustomer.loyaltyPoints || 0)}
                    </div>
                  </div>
                  <button onClick={clearCustomer} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}><X size={14} /></button>
                </div>
              ) : (
                <input
                  ref={customerSearchRef}
                  value={customerSearch}
                  onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                  placeholder="Search existing customer..."
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, fontWeight: 600, background: 'transparent' }}
                />
              )}
            </div>
            <AnimatePresence>
              {showCustomerDropdown && customerResults.length > 0 && !selectedCustomer && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden', marginTop: 4 }}>
                  {customerResults.map(c => {
                    const tier = getTierInfo(c.loyaltyPoints || 0);
                    return (
                      <div key={c.id} onClick={() => selectCustomer(c)}
                        style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f8fafc' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{c.phone}</div>
                        </div>
                        <div style={{ padding: '3px 8px', borderRadius: 6, background: tier.bg, color: tier.color, fontSize: 10, fontWeight: 800 }}>
                          {getTierName(c.loyaltyPoints || 0)} · {c.loyaltyPoints || 0}pts
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Walk-in Customer Quick Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input 
              placeholder="Customer Name"
              value={walkinName}
              onChange={e => setWalkinName(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 600 }}
            />
            <input 
              placeholder="Customer Phone"
              value={walkinPhone}
              onChange={e => setWalkinPhone(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 600 }}
            />
          </div>

          {/* Loyalty Redemption Toggle */}
          {selectedCustomer && (selectedCustomer.loyaltyPoints || 0) >= 100 && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: '#fffbeb', border: '1px solid #fde68a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Gift size={14} color="#d97706" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>Redeem {Math.floor(maxRedeem * 100)} pts → -${maxRedeem.toFixed(2)}</span>
              </div>
              <button onClick={() => setRedeemPoints(!redeemPoints)} style={{ padding: '4px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 11, background: redeemPoints ? '#d97706' : '#e2e8f0', color: redeemPoints ? 'white' : '#64748b' }}>
                {redeemPoints ? 'Applied ✓' : 'Apply'}
              </button>
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, padding: '16px 28px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <AnimatePresence>
              {cart.map(item => (
                <motion.div 
                  layout key={item.productId} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                  style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f8fafc' }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>${item.price} each</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => updateQty(item.productId, -1)} style={{ width: 26, height: 26, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={12} /></button>
                    <span style={{ fontSize: 14, fontWeight: 900, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQty(item.productId, 1)} style={{ width: 26, height: 26, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12} /></button>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', minWidth: 65, textAlign: 'right' }}>${(item.price * item.quantity).toFixed(2)}</div>
                  <button onClick={() => removeFromCart(item.productId)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {cart.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                <ShoppingCart size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <div style={{ fontWeight: 700 }}>Cart is empty</div>
              </div>
            )}
          </div>
        </div>

        {/* Totals & Options */}
        <div style={{ padding: '20px 28px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px', marginBottom: 14 }}>
            {/* Subtotal */}
            <div style={{ flex: '1 1 120px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontWeight: 700, fontSize: 13 }}>Subtotal</span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>${subtotal.toFixed(2)}</span>
            </div>
            
            {/* Discount */}
            <div style={{ flex: '1 1 200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#64748b', fontWeight: 700, fontSize: 13 }}>Discount</span>
                <button 
                  onClick={() => setDiscountType(discountType === 'flat' ? 'percent' : 'flat')}
                  style={{ padding: '2px 8px', borderRadius: 6, border: '1px solid #0a84ff', background: '#eff6ff', color: '#0a84ff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                  {discountType === 'flat' ? '$ Flat' : '% Percent'}
                </button>
              </div>
              <input type="number" min="0" value={globalDiscount} onChange={e => setGlobalDiscount(e.target.value)} 
                placeholder={discountType === 'flat' ? '0.00' : '0%'}
                style={{ width: 70, padding: '6px 8px', borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 700, fontSize: 13 }} />
            </div>

            {/* Tax Field */}
            <div style={{ flex: '1 1 140px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontWeight: 700, fontSize: 13 }}>Tax (%)</span>
              <input type="number" min="0" value={taxRate} onChange={e => setTaxRate(e.target.value)} 
                style={{ width: 70, padding: '6px 8px', borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 700, fontSize: 13 }} />
            </div>

            {/* Extra Charges */}
            <div style={{ flex: '1 1 260px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontWeight: 700, fontSize: 13 }}>Extra Charges ($)</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="text" placeholder="Reason (e.g. Delivery)" value={extraChargeReason} onChange={e => setExtraChargeReason(e.target.value)}
                  style={{ width: 110, padding: '6px 8px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600 }} />
                <input type="number" min="0" value={extraCharges} onChange={e => setExtraCharges(e.target.value)} 
                  style={{ width: 70, padding: '6px 8px', borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 700, fontSize: 13 }} placeholder="0.00" />
              </div>
            </div>

            {redeemPoints && loyaltyDiscount > 0 && (
              <div style={{ flex: '1 1 100%', display: 'flex', justifyContent: 'space-between', color: '#d97706', fontWeight: 700, fontSize: 13 }}>
                <span>Loyalty Redemption</span><span>-${loyaltyDiscount.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, paddingTop: 10, borderTop: '2px solid #e2e8f0' }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>Grand Total</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#0a84ff' }}>${total.toFixed(2)}</span>
          </div>

          {/* Payment Method Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6, marginBottom: 14 }}>
            {['cash', 'card', 'credit', 'split'].map(method => (
              <button key={method} onClick={() => setPaymentMethod(method)}
                style={{ padding: '10px 4px', borderRadius: 10, fontWeight: 800, fontSize: 11, cursor: 'pointer', border: '2px solid', textTransform: 'capitalize', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  borderColor: paymentMethod === method ? '#0a84ff' : 'transparent',
                  background: paymentMethod === method ? '#eff6ff' : 'white',
                  color: paymentMethod === method ? '#0a84ff' : '#64748b' }}>
                {method === 'credit' ? 'Loan/Credit' : method}
              </button>
            ))}
          </div>

          {paymentMethod === 'credit' && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 4 }}>CREDIT REASON / NOTES</label>
              <input 
                placeholder="e.g. Approved by Project Director, due next week"
                value={creditReason}
                onChange={e => setCreditReason(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 600 }}
              />
            </div>
          )}

          {paymentMethod === 'cash' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontWeight: 700, fontSize: 13 }}>Cash Tendered ($)</span>
                <input type="number" min="0" value={cashTendered} onChange={e => setCashTendered(e.target.value)} 
                  style={{ width: 110, padding: '8px 10px', borderRadius: 8, border: '1px solid #0a84ff', textAlign: 'right', fontWeight: 800, fontSize: 14 }} placeholder="0.00" />
              </div>
              {cashTendered && parseFloat(cashTendered) >= total && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#dcfce7', padding: 10, borderRadius: 10 }}>
                  <span style={{ color: '#16a34a', fontWeight: 800, fontSize: 13 }}>Change Due</span>
                  <span style={{ color: '#16a34a', fontWeight: 900, fontSize: 16 }}>${changeDue.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'split' && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 4 }}>CASH</label>
                <input type="number" value={splitAmount.cash} onChange={e => setSplitAmount({...splitAmount, cash: parseFloat(e.target.value) || 0})}
                  style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0', fontWeight: 700 }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 4 }}>CARD</label>
                <input type="number" value={splitAmount.card} onChange={e => setSplitAmount({...splitAmount, card: parseFloat(e.target.value) || 0})}
                  style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0', fontWeight: 700 }} />
              </div>
            </div>
          )}

          <button 
            disabled={processing || cart.length === 0}
            onClick={handleCheckout}
            style={{ width: '100%', padding: '16px', borderRadius: 16, background: '#0f172a', color: 'white',
              fontSize: 16, fontWeight: 900, border: 'none', cursor: 'pointer', opacity: processing ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {processing ? 'Processing...' : `Complete Payment`} <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Dragger */}
      <div 
        onMouseDown={(e) => { e.preventDefault(); isDragging.current = true; document.body.style.cursor = 'col-resize'; }}
        style={{ cursor: 'col-resize', background: '#cbd5e1', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, transition: 'background 0.2s' }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#94a3b8'}
        onMouseLeave={(e) => e.currentTarget.style.background = '#cbd5e1'}
      >
        <div style={{ width: 2, height: 24, background: 'white', borderRadius: 2 }} />
      </div>

      {/* Right Side: Product Grid */}
      <div style={{ padding: 40, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>Sales Terminal</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: isOnline ? '#dcfce7' : '#fee2e2', color: isOnline ? '#16a34a' : '#ef4444', fontSize: 11, fontWeight: 800 }}>
                {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </div>
              {pendingCount > 0 && (
                <button onClick={syncOfflineQueue} disabled={!isOnline || syncingOffline} style={{ padding: '4px 10px', borderRadius: 20, background: '#fef3c7', color: '#d97706', fontSize: 11, fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                  {syncingOffline ? 'Syncing...' : `${pendingCount} pending`}
                </button>
              )}
            </div>
            <p style={{ color: '#64748b', fontWeight: 600 }}>Process orders and manage transactions.</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => navigate('/sales/history')} style={{ padding: '12px 20px', borderRadius: 14, border: '1px solid #e2e8f0', background: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <History size={18} /> History
            </button>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                ref={searchRef}
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search products... (F2)" 
                style={{ width: 300, padding: '14px 14px 14px 44px', borderRadius: 16, border: '1px solid #e2e8f0', outline: 'none', fontWeight: 600 }}
              />
            </div>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
          {products
            .filter(p => {
              const term = search.toLowerCase();
              return p.name.toLowerCase().includes(term) || (p.sku && p.sku.toLowerCase().includes(term));
            })
            .slice(0, 36)
            .map(p => (
              <ProductCard key={p.id} product={p} onAdd={addToCart} />
            ))
          }
        </div>
      </div>

      {/* Receipt Modal */}
      {receipt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} 
            style={{ background: 'white', width: '100%', maxWidth: 450, padding: 32, borderRadius: 32, maxHeight: '90vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <button onClick={() => setReceipt(null)} style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <X size={20} color="#64748b" />
            </button>
            {receipt.offline && (
              <div style={{ background: '#fef3c7', padding: 10, borderRadius: 10, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#92400e' }}>
                <WifiOff size={14} /> Saved offline — will sync when connection restored
              </div>
            )}
            <div id="printable-invoice" style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: 0 }}>GlobalAI ERP</h2>
                <p style={{ color: '#64748b', fontWeight: 600, fontSize: 13, margin: '4px 0 0 0' }}>Official Sales Invoice</p>
                <div style={{ marginTop: 12, fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                  Txn: {receipt.id?.split('-')[0]?.toUpperCase()}<br/>
                  Cashier: {receipt.cashierName || 'Staff'}<br/>
                  Date: {new Date(receipt.createdAt).toLocaleString()}
                </div>
              </div>
              
              {(receipt.customerName || receipt.customerPhone || receipt.customerId) && (
                <div style={{ marginBottom: 12, padding: '8px 16px', background: '#f8fafc', borderRadius: 10, fontSize: 12, fontWeight: 700, color: '#64748b', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={12} /> {receipt.customerName || 'Customer'}</div>
                  {receipt.customerPhone && <div style={{ fontSize: 11, color: '#94a3b8' }}>Phone: {receipt.customerPhone}</div>}
                </div>
              )}

              <div style={{ borderTop: '2px dashed #e2e8f0', borderBottom: '2px dashed #e2e8f0', padding: '16px 0', margin: '16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr', gap: 8, fontSize: 12, fontWeight: 800, color: '#64748b', paddingBottom: 6, borderBottom: '1px solid #e2e8f0' }}>
                  <span>Item</span>
                  <span style={{ textAlign: 'center' }}>Qty</span>
                  <span style={{ textAlign: 'right' }}>Unit</span>
                  <span style={{ textAlign: 'right' }}>Total</span>
                </div>
                {receipt.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr', gap: 8, fontSize: 13, alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#0f172a', wordBreak: 'break-all' }}>{item.name}</span>
                    <span style={{ textAlign: 'center', fontWeight: 800, color: '#0f172a' }}>{item.quantity}</span>
                    <span style={{ textAlign: 'right', color: '#64748b' }}>${parseFloat(item.price || 0).toFixed(2)}</span>
                    <span style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#64748b', fontWeight: 600 }}>
                  <span>Subtotal</span><span>${parseFloat(receipt.totalAmount || 0).toFixed(2)}</span>
                </div>
                {parseFloat(receipt.discount) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#ef4444', fontWeight: 700 }}>
                    <span>Discount</span><span>-${parseFloat(receipt.discount).toFixed(2)}</span>
                  </div>
                )}
                {parseFloat(receipt.extraCharges) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#0a84ff', fontWeight: 700 }}>
                    <span>Extra ({receipt.extraChargeReason || 'Charges'})</span><span>+${parseFloat(receipt.extraCharges).toFixed(2)}</span>
                  </div>
                )}
                {parseFloat(receipt.tax) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#64748b', fontWeight: 600 }}>
                    <span>Tax</span><span>+${parseFloat(receipt.tax).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, color: '#0f172a', fontWeight: 900, marginTop: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                  <span>Grand Total</span><span>${parseFloat(receipt.grandTotal || 0).toFixed(2)}</span>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 16, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontWeight: 600 }}>
                  <span style={{ color: '#64748b' }}>Payment Method</span>
                  <span style={{ textTransform: 'capitalize', color: '#0f172a' }}>{receipt.paymentMethod === 'credit' ? 'Loan / Credit' : receipt.paymentMethod}</span>
                </div>
                {receipt.creditReason && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontWeight: 600, fontSize: 12 }}>
                    <span style={{ color: '#64748b' }}>Credit Reason</span>
                    <span style={{ color: '#d97706' }}>{receipt.creditReason}</span>
                  </div>
                )}
                {receipt.paymentMethod === 'cash' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontWeight: 600 }}>
                      <span style={{ color: '#64748b' }}>Tendered</span>
                      <span style={{ color: '#0f172a' }}>${parseFloat(receipt.cashTendered || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                      <span style={{ color: '#64748b' }}>Change</span>
                      <span style={{ color: '#16a34a' }}>${parseFloat(receipt.changeDue || 0).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
              <div style={{ textAlign: 'center', marginTop: 24, color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>Thank you for your business!</div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={() => {
                const printContent = document.getElementById('printable-invoice').innerHTML;
                const iframe = document.createElement('iframe');
                document.body.appendChild(iframe);
                iframe.style.display = 'none';
                iframe.contentDocument.write(`<html><head><title>Invoice</title><style>body{font-family:sans-serif;padding:40px;max-width:400px;margin:0 auto}</style></head><body onload="window.print(); setTimeout(() => window.parent.document.body.removeChild(window.frameElement), 100);">${printContent}</body></html>`);
                iframe.contentDocument.close();
              }} style={{ flex: 1, padding: 14, borderRadius: 16, background: '#f1f5f9', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Printer size={18} /> Print Invoice
              </button>
              <button onClick={() => setReceipt(null)} style={{ flex: 1, padding: 14, borderRadius: 16, background: '#0a84ff', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer' }}>
                New Sale
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Sales;
