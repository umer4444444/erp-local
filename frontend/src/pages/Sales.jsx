import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ShoppingCart, Package, Plus, Trash, CreditCard, Banknote, Search, 
  ArrowRight, ArrowLeft, Zap, Target, X, Printer, Minus, UserPlus, History, DollarSign,
  Star, User, Gift, ChevronDown, AlertCircle, Wifi, WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { salesAPI, inventoryAPI, customerAPI, shiftAPI } from '../api';
import Barcode from 'react-barcode';
import AdvancedSalesTerminal from './AdvancedSalesTerminal';

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
  Silver: { color: 'var(--text-muted)', bg: '#f1f5f9', min: 500 },
  Gold:   { color: '#f59e0b', bg: '#fffbeb', min: 1500 },
  Platinum: { color: '#8b5cf6', bg: '#f5f3ff', min: 5000 },
};

const ProductCard = React.memo(({ product, onAdd }) => (
  <motion.div 
    whileHover={{ y: -5, boxShadow: '0 12px 30px var(--shadow-strong-rgb)' }}
    whileTap={{ scale: 0.98 }}
    onClick={() => onAdd(product)}
    style={{
      background: 'var(--bg-panel)', borderRadius: 16, padding: 14, cursor: 'pointer',
      border: '1px solid var(--border-color-rgb)', boxShadow: '0 4px 12px var(--shadow-color-rgb)',
      display: 'flex', flexDirection: 'column', gap: 10,
      opacity: product.stock <= 0 ? 0.5 : 1,
      pointerEvents: product.stock <= 0 ? 'none' : 'auto'
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        <Package size={18} />
      </div>
      <div style={{ background: product.stock < 10 ? '#fff1f2' : '#f0fdf4', color: product.stock < 10 ? '#e11d48' : '#16a34a', fontSize: 10, fontWeight: 800, padding: '4px 6px', borderRadius: 6 }}>
        {product.stock <= 0 ? 'Out of Stock' : `${product.stock} in stock`}
      </div>
    </div>
    <div>
      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)' }}>{product.name}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{product.sku || 'No SKU'}</div>
    </div>
    <div style={{ fontSize: 18, fontWeight: 900, color: '#0a84ff' }}>SAR {product.price}</div>
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
  const [pricingMode, setPricingMode] = useState('retail');
  const [unknownBarcode, setUnknownBarcode] = useState(null);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  
  const [inlineSearch, setInlineSearch] = useState('');
  const [showInlineDropdown, setShowInlineDropdown] = useState(false);
  const inlineSearchRef = useRef(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(700);
  const isDragging = useRef(false);
  const barcodeBuffer = useRef('');
  const barcodeTimeout = useRef(null);
  const cartRef = useRef(cart);
  const productsRef = useRef(products);
  const [selectedCartIndex, setSelectedCartIndex] = useState(-1);

  useEffect(() => { cartRef.current = cart; }, [cart]);
  useEffect(() => { productsRef.current = products; }, [products]);

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

  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

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
    return () => clearInterval(interval);
  }, []);



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
        const itemPrice = pricingMode === 'wholesale' && product.wholesalePrice ? parseFloat(product.wholesalePrice) : parseFloat(product.price);
        return [...prev, { 
          productId: product.id, 
          name: product.name, 
          price: itemPrice, 
          quantity: 1, 
          stock: product.stock,
          discountAmount: 0 
        }];
      }
    });
  }, [pricingMode]);

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

  const inlineFilteredProducts = inlineSearch.trim() ? products.filter(p => p.name.toLowerCase().includes(inlineSearch.toLowerCase()) || p.sku?.toLowerCase() === inlineSearch.toLowerCase() || p.barcode === inlineSearch) : [];

  const subtotal = cart.reduce((sum, i) => sum + (i.price * i.quantity) - i.discountAmount, 0);
  
  // Loyalty redemption: 100 pts = SAR 1
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
    if (cart.length === 0 || processing || unknownBarcode) return alert('Cart is empty');
    setProcessing(true);
    
    let lat = null;
    let lng = null;
    try {
      if (navigator.geolocation) {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }
    } catch (err) {
      console.warn("GPS failed", err);
    }

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
      latitude: lat,
      longitude: lng,
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

  useEffect(() => {
    const handleGlobalKey = (e) => {
      if (pricingMode === 'wholesale') return; // Let AdvancedSalesTerminal handle its own hotkeys
      
      const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT';

      // Hotkeys
      if (e.key === 'F1') { e.preventDefault(); setShowKeyboardShortcuts(true); return; }
      if (e.key === 'F2') { e.preventDefault(); searchRef.current?.focus(); return; }
      if (e.key === 'F3') { e.preventDefault(); customerSearchRef.current?.focus(); return; }
      if (e.key === 'F4') { e.preventDefault(); setPricingMode(prev => prev === 'retail' ? 'wholesale' : 'retail'); return; }
      if (e.key === 'F8') { e.preventDefault(); handleCheckout(); return; }
      if (e.key === 'F11') { 
        e.preventDefault(); 
        if (receipt) handlePrint(); 
        else alert("Please checkout (F8) first to print a retail receipt."); 
        return; 
      }
      if (e.key === 'Escape') {
         if (unknownBarcode) {
             setUnknownBarcode(null);
             setNewProductName('');
             setNewProductPrice('');
             return;
         }
         if (showKeyboardShortcuts) {
             setShowKeyboardShortcuts(false);
             return;
         }
         if (receipt) setReceipt(null);
         setCustomerSearch('');
         setSearch('');
         return;
      }

      if (receipt && e.key === 'Enter') {
         e.preventDefault();
         handlePrint();
         return;
      }
      
      // Barcode Scanner logic (fast typing)
      if (!isInput || e.target === searchRef.current) {
        if (e.key === 'Enter' && barcodeBuffer.current.length > 2) {
          e.preventDefault();
          const scannedCode = barcodeBuffer.current.toLowerCase();
          const match = productsRef.current.find(p => (p.sku && p.sku.toLowerCase() === scannedCode) || (p.barcode && p.barcode.toLowerCase() === scannedCode));
          if (match) {
            addToCart(match);
            setSearch(''); 
          } else {
            setUnknownBarcode(scannedCode);
          }
          barcodeBuffer.current = '';
        } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
           barcodeBuffer.current += e.key;
           if (barcodeTimeout.current) clearTimeout(barcodeTimeout.current);
           barcodeTimeout.current = setTimeout(() => {
             barcodeBuffer.current = ''; 
           }, 80);
        }
      }
      
      // Cart Navigation (when not typing)
      if (!isInput && cartRef.current.length > 0 && !receipt) {
         if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedCartIndex(prev => prev < cartRef.current.length - 1 ? prev + 1 : prev);
         } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedCartIndex(prev => prev > 0 ? prev - 1 : prev);
         } else if ((e.key === '+' || e.key === '=') && selectedCartIndex >= 0 && selectedCartIndex < cartRef.current.length) {
            e.preventDefault();
            const item = cartRef.current[selectedCartIndex];
            if (item.quantity < item.stock) updateQty(item.productId, 1);
         } else if ((e.key === '-' || e.key === '_') && selectedCartIndex >= 0 && selectedCartIndex < cartRef.current.length) {
            e.preventDefault();
            const item = cartRef.current[selectedCartIndex];
            updateQty(item.productId, -1);
         } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedCartIndex >= 0 && selectedCartIndex < cartRef.current.length) {
            e.preventDefault();
            removeFromCart(cartRef.current[selectedCartIndex].productId);
            setSelectedCartIndex(prev => prev > 0 ? prev - 1 : 0);
         }
      }
    };
    
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [selectedCartIndex, receipt, showKeyboardShortcuts, unknownBarcode, addToCart, removeFromCart, updateQty, handleCheckout, pricingMode]);

  const handleQuickAddProduct = async () => {
    if (!newProductName || !newProductPrice) return;
    try {
      const res = await inventoryAPI.createProduct({
        name: newProductName,
        price: Number(newProductPrice),
        barcode: unknownBarcode,
        sku: unknownBarcode,
        category: 'Uncategorized',
        stock: 100 // default stock so it can be sold immediately
      });
      const newProd = res.data;
      setProducts(prev => [...prev, newProd]);
      addToCart(newProd);
      setUnknownBarcode(null);
      setNewProductName('');
      setNewProductPrice('');
    } catch (e) {
      alert("Failed to add product: " + (e.response?.data?.message || e.message));
    }
  };

  const handlePrint = () => {
    if (!document.getElementById('printable-invoice')) return;
    const printContent = document.getElementById('printable-invoice').innerHTML;
    
    // Create a temporary container at the root of the document
    const printContainer = document.createElement('div');
    printContainer.id = 'print-container';
    
    // Set thermal receipt specific styles
    printContainer.innerHTML = `
      <div style="font-family: 'Courier New', Courier, monospace; padding: 20px; color: #000; margin: 0 auto; max-width: 320px; text-align: left; direction: ltr;">
        ${printContent}
      </div>
    `;
    
    document.body.appendChild(printContainer);
    document.body.classList.add('printing');
    
    // Trigger native print dialog
    window.print();
    
    // Cleanup immediately after print dialog closes
    document.body.classList.remove('printing');
    document.body.removeChild(printContainer);
  };

  if (pricingMode === 'wholesale') {
    return <AdvancedSalesTerminal onClose={() => setPricingMode('retail')} />;
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'grid', gridTemplateColumns: `${leftPanelWidth}px 6px 1fr`, height: '100vh', background: '#f1f5f9', overflow: 'hidden' }}>
      
      {/* Left Side: Cart & Checkout (Centered & Larger) */}
      <div style={{ background: 'var(--bg-panel)', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>Current Cart</h2>
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                onClick={() => setPricingMode(pricingMode === 'retail' ? 'wholesale' : 'retail')}
                style={{ fontSize: 11, fontWeight: 800, color: pricingMode === 'wholesale' ? '#fff' : '#0a84ff', background: pricingMode === 'wholesale' ? '#8b5cf6' : '#eff6ff', border: 'none', padding: '4px 10px', borderRadius: 8, cursor: 'pointer' }}
              >
                {pricingMode === 'retail' ? 'RETAIL' : 'WHOLESALE'} MODE (F4)
              </button>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0a84ff', background: '#eff6ff', padding: '4px 10px', borderRadius: 8 }}>
                Cashier: {currentUser.name || 'Staff'}
              </div>
            </div>
          </div>
          
          {/* Customer Search & Direct Details Input */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, border: `1px solid ${selectedCustomer ? '#0a84ff' : 'var(--border-color)'}`, background: selectedCustomer ? '#eff6ff' : 'var(--bg-panel)' }}>
              <User size={16} color={selectedCustomer ? '#0a84ff' : 'var(--text-muted)'} />
              {selectedCustomer ? (
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)' }}>{selectedCustomer.name}</div>
                    <div style={{ fontSize: 11, color: '#0a84ff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={10} fill="#f59e0b" color="#f59e0b" /> {selectedCustomer.loyaltyPoints || 0} pts · {getTierName(selectedCustomer.loyaltyPoints || 0)}
                    </div>
                  </div>
                  <button onClick={clearCustomer} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>
                </div>
              ) : (
                <input
                  ref={customerSearchRef}
                  value={customerSearch}
                  onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                  placeholder="Search existing customer... (F3)"
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, fontWeight: 600, background: 'transparent' }}
                />
              )}
            </div>
            <AnimatePresence>
              {showCustomerDropdown && customerResults.length > 0 && !selectedCustomer && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-panel)', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 8px 24px var(--shadow-strong-rgb)', zIndex: 100, overflow: 'hidden', marginTop: 4 }}>
                  {customerResults.map(c => {
                    const tier = getTierInfo(c.loyaltyPoints || 0);
                    return (
                      <div key={c.id} onClick={() => selectCustomer(c)}
                        style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f8fafc' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-main)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)' }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{c.phone}</div>
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
              <button onClick={() => setRedeemPoints(!redeemPoints)} style={{ padding: '4px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 11, background: redeemPoints ? '#d97706' : 'var(--border-color)', color: redeemPoints ? 'var(--bg-panel)' : 'var(--text-muted)' }}>
                {redeemPoints ? 'Applied ✓' : 'Apply'}
              </button>
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, padding: '16px 28px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <AnimatePresence>
              {cart.map((item, index) => (
                <motion.div 
                  layout key={item.productId} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                  style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--border-color)', background: index === selectedCartIndex ? 'rgba(10, 132, 255, 0.1)' : 'transparent', borderRadius: 12, border: index === selectedCartIndex ? '1px solid #0a84ff' : '1px solid transparent' }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)' }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>SAR {item.price} each</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => updateQty(item.productId, -1)} style={{ width: 26, height: 26, borderRadius: 8, border: '1px solid #e2e8f0', background: 'var(--bg-panel)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={12} /></button>
                    <span style={{ fontSize: 14, fontWeight: 900, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQty(item.productId, 1)} style={{ width: 26, height: 26, borderRadius: 8, border: '1px solid #e2e8f0', background: 'var(--bg-panel)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12} /></button>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-main)', minWidth: 65, textAlign: 'right' }}>SAR {(item.price * item.quantity).toFixed(2)}</div>
                  <button onClick={() => removeFromCart(item.productId)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {/* Inline Product Search */}
            <div style={{ position: 'relative', marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-panel)', borderRadius: 12, border: '2px dashed var(--border-color)' }}>
                <Search size={18} color="var(--text-muted)" />
                <input 
                  ref={inlineSearchRef}
                  value={inlineSearch}
                  onChange={e => { setInlineSearch(e.target.value); setShowInlineDropdown(true); }}
                  placeholder="Type product name or barcode to add a row..."
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      if (inlineFilteredProducts.length > 0) {
                        addToCart(inlineFilteredProducts[0]);
                        setInlineSearch('');
                        setShowInlineDropdown(false);
                      } else {
                        // trigger unknown barcode logic if not empty
                        if (inlineSearch.trim()) {
                          setUnknownBarcode(inlineSearch.trim());
                          setInlineSearch('');
                        }
                      }
                    }
                  }}
                />
              </div>
              <AnimatePresence>
                {showInlineDropdown && inlineFilteredProducts.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-panel)', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 8px 24px var(--shadow-strong-rgb)', zIndex: 100, overflow: 'hidden', marginTop: 4 }}>
                    {inlineFilteredProducts.slice(0, 5).map(p => (
                      <div key={p._id} onClick={() => { addToCart(p); setInlineSearch(''); setShowInlineDropdown(false); inlineSearchRef.current?.focus(); }}
                        style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f8fafc' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-main)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)' }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{p.sku || p.barcode}</div>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#0a84ff' }}>SAR {p.price}</div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Totals & Options */}
        <div style={{ padding: '20px 28px', background: 'var(--bg-main)', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px', marginBottom: 14 }}>
            {/* Subtotal */}
            <div style={{ flex: '1 1 120px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 13 }}>Subtotal</span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>SAR {subtotal.toFixed(2)}</span>
            </div>
            
            {/* Discount */}
            <div style={{ flex: '1 1 200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 13 }}>Discount</span>
                <button 
                  onClick={() => setDiscountType(discountType === 'flat' ? 'percent' : 'flat')}
                  style={{ padding: '2px 8px', borderRadius: 6, border: '1px solid #0a84ff', background: '#eff6ff', color: '#0a84ff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                  {discountType === 'flat' ? 'SAR  Flat' : '% Percent'}
                </button>
              </div>
              <input type="number" min="0" value={globalDiscount} onChange={e => setGlobalDiscount(e.target.value)} 
                placeholder={discountType === 'flat' ? '0.00' : '0%'}
                style={{ width: 70, padding: '6px 8px', borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 700, fontSize: 13 }} />
            </div>

            {/* Tax Field */}
            <div style={{ flex: '1 1 140px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 13 }}>Tax (%)</span>
              <input type="number" min="0" value={taxRate} onChange={e => setTaxRate(e.target.value)} 
                style={{ width: 70, padding: '6px 8px', borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 700, fontSize: 13 }} />
            </div>

            {/* Extra Charges */}
            <div style={{ flex: '1 1 260px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 13 }}>Extra Charges (SAR)</span>
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
            <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-main)' }}>Grand Total</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#0a84ff' }}>SAR {total.toFixed(2)}</span>
          </div>

          {/* Payment Method Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 4, marginBottom: 14 }}>
            {['cash', 'card', 'bank_transfer', 'credit', 'split'].map(method => (
              <button key={method} onClick={() => setPaymentMethod(method)}
                style={{ padding: '10px 2px', borderRadius: 10, fontWeight: 800, fontSize: 10, cursor: 'pointer', border: '2px solid', textTransform: 'capitalize', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  borderColor: paymentMethod === method ? '#0a84ff' : 'transparent',
                  background: paymentMethod === method ? '#eff6ff' : 'var(--bg-panel)',
                  color: paymentMethod === method ? '#0a84ff' : 'var(--text-muted)' }}>
                {method === 'credit' ? 'Loan/Credit' : method.replace('_', ' ')}
              </button>
            ))}
          </div>

          {paymentMethod === 'credit' && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>CREDIT REASON / NOTES</label>
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
                <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 13 }}>Cash Tendered (SAR)</span>
                <input type="number" min="0" value={cashTendered} onChange={e => setCashTendered(e.target.value)} 
                  style={{ width: 110, padding: '8px 10px', borderRadius: 8, border: '1px solid #0a84ff', textAlign: 'right', fontWeight: 800, fontSize: 14 }} placeholder="0.00" />
              </div>
              {cashTendered && parseFloat(cashTendered) >= total && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#dcfce7', padding: 10, borderRadius: 10 }}>
                  <span style={{ color: '#16a34a', fontWeight: 800, fontSize: 13 }}>Change Due</span>
                  <span style={{ color: '#16a34a', fontWeight: 900, fontSize: 16 }}>SAR {changeDue.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'split' && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>CASH</label>
                <input type="number" value={splitAmount.cash} onChange={e => setSplitAmount({...splitAmount, cash: parseFloat(e.target.value) || 0})}
                  style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0', fontWeight: 700 }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>CARD</label>
                <input type="number" value={splitAmount.card} onChange={e => setSplitAmount({...splitAmount, card: parseFloat(e.target.value) || 0})}
                  style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0', fontWeight: 700 }} />
              </div>
            </div>
          )}

          <button 
            disabled={processing || cart.length === 0}
            onClick={handleCheckout}
            style={{ width: '100%', padding: '16px', borderRadius: 16, background: 'var(--text-main)', color: 'var(--bg-panel)',
              fontSize: 16, fontWeight: 900, border: 'none', cursor: 'pointer', opacity: processing ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {processing ? 'Processing...' : `Complete Payment (F8)`} <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Dragger */}
      <div 
        onMouseDown={(e) => { e.preventDefault(); isDragging.current = true; document.body.style.cursor = 'col-resize'; }}
        style={{ cursor: 'col-resize', background: '#cbd5e1', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, transition: 'background 0.2s' }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--text-muted)'}
        onMouseLeave={(e) => e.currentTarget.style.background = '#cbd5e1'}
      >
        <div style={{ width: 2, height: 24, background: 'var(--bg-panel)', borderRadius: 2 }} />
      </div>

      {/* Right Side: Product Grid */}
      <div style={{ padding: 40, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-main)' }}>Sales Terminal</h1>
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
            <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Process orders and manage transactions.</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setShowKeyboardShortcuts(true)} style={{ padding: '12px 20px', borderRadius: 14, border: '1px solid #e2e8f0', background: 'var(--bg-panel)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              Shortcuts
            </button>
            <button onClick={() => navigate('/')} style={{ padding: '12px 20px', borderRadius: 14, border: '1px solid #e2e8f0', background: 'var(--bg-panel)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ArrowLeft size={18} /> Dashboard
            </button>
            <button onClick={() => navigate('/sales/history')} style={{ padding: '12px 20px', borderRadius: 14, border: '1px solid #e2e8f0', background: 'var(--bg-panel)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <History size={18} /> History
            </button>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
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
            style={{ background: 'var(--bg-panel)', width: '100%', maxWidth: 450, padding: 32, borderRadius: 32, maxHeight: '90vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <button onClick={() => setReceipt(null)} style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <X size={20} color='var(--text-muted)' />
            </button>
            {receipt.offline && (
              <div style={{ background: '#fef3c7', padding: 10, borderRadius: 10, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#92400e' }}>
                <WifiOff size={14} /> Saved offline — will sync when connection restored
              </div>
            )}
            <div id="printable-invoice" style={{ flex: 1, overflowY: 'auto', paddingRight: 8, direction: 'ltr' }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                {/* Simulated BTG Logo */}
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 60, height: 60, borderRadius: '50%', background: '#0a84ff', color: '#fff', fontSize: 24, fontWeight: 900, letterSpacing: -1, marginBottom: 12 }}>BTG</div>
                <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 4px', textTransform: 'uppercase' }}>Tax Invoice / فاتورة ضريبية</h2>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, fontWeight: 600 }}>
                  Txn: {receipt.id?.split('-')[0]?.toUpperCase()}<br/>
                  Cashier: {receipt.cashierName || 'Staff'}<br/>
                  Date: {new Date(receipt.createdAt).toLocaleString()}
                </div>
              </div>
              
              {(receipt.customerName || receipt.customerPhone || receipt.customerId) && (
                <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Customer / العميل</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}><User size={14} /> {receipt.customerName || 'Customer'}</div>
                  {receipt.customerPhone && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={12} /> {receipt.customerPhone}</div>}
                </div>
              )}

              <div style={{ borderTop: '2px dashed #cbd5e1', borderBottom: '2px dashed #cbd5e1', padding: '16px 0', margin: '16px 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, fontSize: 11, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', paddingBottom: 8, borderBottom: '1px solid #e2e8f0', marginBottom: 8 }}>
                  <span>Item / الصنف</span>
                  <span style={{ textAlign: 'center' }}>Qty / الكمية</span>
                  <span style={{ textAlign: 'right' }}>Total / المجموع</span>
                </div>
                {receipt.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, fontSize: 13, paddingBottom: 8, paddingTop: 8, borderBottom: '1px dashed #f1f5f9' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{item.name}</div>
                      {item.nameAr && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', direction: 'rtl' }}>{item.nameAr}</div>}
                    </div>
                    <div style={{ textAlign: 'center', fontWeight: 700 }}>{item.quantity}</div>
                    <div style={{ textAlign: 'right', fontWeight: 800 }}>SAR {(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
                
                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
                  <Barcode value={receipt.id} width={1.5} height={40} fontSize={12} background="transparent" />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24, padding: '0 8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-muted)', fontWeight: 700 }}>
                  <span>Subtotal <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 4 }}>المجموع الفرعي</span></span><span>SAR {parseFloat(receipt.totalAmount || 0).toFixed(2)}</span>
                </div>
                {parseFloat(receipt.discount) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#ef4444', fontWeight: 800 }}>
                    <span>Discount <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 4 }}>الخصم</span></span><span>-SAR {parseFloat(receipt.discount).toFixed(2)}</span>
                  </div>
                )}
                {parseFloat(receipt.extraCharges) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#0a84ff', fontWeight: 800 }}>
                    <span>Extra <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 4 }}>إضافي</span></span><span>+SAR {parseFloat(receipt.extraCharges).toFixed(2)}</span>
                  </div>
                )}
                {parseFloat(receipt.tax) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-muted)', fontWeight: 700 }}>
                    <span>VAT 15% <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 4 }}>ضريبة القيمة المضافة</span></span><span>+SAR {parseFloat(receipt.tax).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 20, color: 'var(--text-main)', fontWeight: 900, marginTop: 12, paddingTop: 12, borderTop: '2px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>Grand Total</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', direction: 'rtl' }}>الإجمالي النهائي</span>
                  </div>
                  <span>SAR {parseFloat(receipt.grandTotal || 0).toFixed(2)}</span>
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 16, borderRadius: 16, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontWeight: 700 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Payment Method <span style={{ fontSize: 11, marginLeft: 4 }}>طريقة الدفع</span></span>
                  <span style={{ textTransform: 'capitalize', color: 'var(--text-main)', fontWeight: 900 }}>{receipt.paymentMethod === 'credit' ? 'Credit / أجل' : (receipt.paymentMethod === 'card' ? 'Card / بطاقة' : 'Cash / نقداً')}</span>
                </div>
                {receipt.creditReason && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontWeight: 600, fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Credit Reason</span>
                    <span style={{ color: '#d97706' }}>{receipt.creditReason}</span>
                  </div>
                )}
                {receipt.paymentMethod === 'cash' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontWeight: 700 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Tendered <span style={{ fontSize: 11, marginLeft: 4 }}>المدفوع</span></span>
                      <span style={{ color: 'var(--text-main)' }}>SAR {parseFloat(receipt.cashTendered || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 14 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Change <span style={{ fontSize: 11, marginLeft: 4 }}>الباقي</span></span>
                      <span style={{ color: '#16a34a' }}>SAR {parseFloat(receipt.changeDue || 0).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
              <div style={{ textAlign: 'center', marginTop: 32, paddingBottom: 16 }}>
                <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: 14, marginBottom: 4 }}>Thank you for your business!</div>
                <div style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 13, direction: 'rtl' }}>شكراً لتعاملكم معنا!</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={handlePrint} style={{ flex: 1, padding: 14, borderRadius: 16, background: '#f1f5f9', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Printer size={18} /> Print Invoice (F11/Enter)
              </button>
              <button onClick={() => setReceipt(null)} style={{ flex: 1, padding: 14, borderRadius: 16, background: '#0a84ff', color: 'var(--bg-panel)', border: 'none', fontWeight: 800, cursor: 'pointer' }}>
                New Sale (Esc)
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcuts && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} 
            style={{ background: 'var(--bg-panel)', width: '100%', maxWidth: 500, padding: 32, borderRadius: 24, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setShowKeyboardShortcuts(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <X size={24} color='var(--text-muted)' />
            </button>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 20 }}>Keyboard Shortcuts</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Search Products</span>
                <span style={{ fontWeight: 900, color: '#0a84ff', background: '#eff6ff', padding: '4px 10px', borderRadius: 8 }}>F2</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Search Customer</span>
                <span style={{ fontWeight: 900, color: '#0a84ff', background: '#eff6ff', padding: '4px 10px', borderRadius: 8 }}>F3</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Toggle Retail/Wholesale</span>
                <span style={{ fontWeight: 900, color: '#0a84ff', background: '#eff6ff', padding: '4px 10px', borderRadius: 8 }}>F4</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Complete Payment</span>
                <span style={{ fontWeight: 900, color: '#0a84ff', background: '#eff6ff', padding: '4px 10px', borderRadius: 8 }}>F8</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Select Cart Item (Up/Down)</span>
                <span style={{ fontWeight: 900, color: '#0a84ff', background: '#eff6ff', padding: '4px 10px', borderRadius: 8 }}>↑ / ↓</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Adjust Quantity of Selected Item</span>
                <span style={{ fontWeight: 900, color: '#0a84ff', background: '#eff6ff', padding: '4px 10px', borderRadius: 8 }}>+ / -</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Remove Selected Item</span>
                <span style={{ fontWeight: 900, color: '#ef4444', background: '#fef2f2', padding: '4px 10px', borderRadius: 8 }}>Delete</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Print Invoice (when open)</span>
                <span style={{ fontWeight: 900, color: '#0a84ff', background: '#eff6ff', padding: '4px 10px', borderRadius: 8 }}>Enter</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10 }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Close Modal / New Sale</span>
                <span style={{ fontWeight: 900, color: '#0a84ff', background: '#eff6ff', padding: '4px 10px', borderRadius: 8 }}>Esc</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Unknown Barcode Quick Add Modal */}
      <AnimatePresence>
        {unknownBarcode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000 }}
            onClick={() => setUnknownBarcode(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--bg-panel)', padding: 32, borderRadius: 24, width: '100%', maxWidth: 400, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
            >
              <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8, color: 'var(--text-main)' }}>Unknown Barcode</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Barcode <strong>{unknownBarcode}</strong> was not found. Register it now?</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--text-muted)' }}>Product Name</label>
                  <input
                    autoFocus
                    value={newProductName}
                    onChange={e => setNewProductName(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') document.getElementById('quick-add-price').focus();
                        e.stopPropagation();
                    }}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid var(--border-color)', fontSize: 16, background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none' }}
                    placeholder="e.g. Coca Cola 330ml"
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--text-muted)' }}>Price (SAR)</label>
                  <input
                    id="quick-add-price"
                    type="number"
                    value={newProductPrice}
                    onChange={e => setNewProductPrice(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') handleQuickAddProduct();
                        e.stopPropagation();
                    }}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid var(--border-color)', fontSize: 16, background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none' }}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                <button
                  onClick={() => setUnknownBarcode(null)}
                  style={{ flex: 1, padding: 16, borderRadius: 16, background: 'var(--bg-main)', color: 'var(--text-main)', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                >
                  Cancel (Esc)
                </button>
                <button
                  onClick={handleQuickAddProduct}
                  style={{ flex: 1, padding: 16, borderRadius: 16, background: '#16a34a', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                >
                  Save & Add
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Sales;
