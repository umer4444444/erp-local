import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, Package, Plus, Trash, CreditCard, Banknote, Search, 
  ArrowRight, Zap, Target, X, Printer, Minus, UserPlus, History, DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { salesAPI, inventoryAPI, customerAPI, shiftAPI } from '../api';

const Sales = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [globalDiscount, setGlobalDiscount] = useState('');
  const [cashTendered, setCashTendered] = useState('');
  const [splitAmount, setSplitAmount] = useState({ cash: 0, card: 0 });

  const searchRef = useRef();

  useEffect(() => {
    const fetchProducts = () => inventoryAPI.getProducts().then(res => setProducts(res.data));
    fetchProducts();
    const interval = setInterval(fetchProducts, 3000); // Live stock sync every 3s

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

  const addToCart = (product) => {
    const existing = cart.find(i => i.productId === product.id);
    if (existing) {
      setCart(cart.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { 
        productId: product.id, 
        name: product.name, 
        price: parseFloat(product.price), 
        quantity: 1, 
        stock: product.stock,
        discountAmount: 0 
      }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const subtotal = cart.reduce((sum, i) => sum + (i.price * i.quantity) - i.discountAmount, 0);
  const total = Math.max(subtotal - parseFloat(globalDiscount || 0), 0);
  const changeDue = paymentMethod === 'cash' && cashTendered ? Math.max(parseFloat(cashTendered) - total, 0) : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Cart is empty');
    setProcessing(true);
    try {
      const saleData = {
        items: cart,
        customerId: selectedCustomer?.id,
        totalAmount: subtotal,
        discount: parseFloat(globalDiscount || 0),
        grandTotal: total,
        paymentMethod,
        cashAmount: paymentMethod === 'split' ? splitAmount.cash : (paymentMethod === 'cash' ? total : 0),
        cardAmount: paymentMethod === 'split' ? splitAmount.card : (paymentMethod === 'card' ? total : 0),
      };
      const res = await salesAPI.createSale(saleData);
      setReceipt({ ...res.data, items: [...cart], changeDue, cashTendered: cashTendered || total });
      setCart([]);
      setSelectedCustomer(null);
      setGlobalDiscount('');
      setCashTendered('');
      setPaymentMethod('cash');
    } catch (err) {
      alert(err.response?.data?.message || 'Checkout failed');
    } finally {
      setProcessing(false);
    }
  };

  const ProductCard = ({ product }) => (
    <motion.div 
      whileHover={{ y: -5, boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }}
      whileTap={{ scale: 0.98 }}
      onClick={() => addToCart(product)}
      style={{
        background: 'white', borderRadius: 20, padding: 20, cursor: 'pointer',
        border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
        display: 'flex', flexDirection: 'column', gap: 12
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          <Package size={22} />
        </div>
        <div style={{ background: product.stock < 10 ? '#fff1f2' : '#f0fdf4', color: product.stock < 10 ? '#e11d48' : '#16a34a', fontSize: 11, fontWeight: 800, padding: '4px 8px', borderRadius: 6 }}>
          {product.stock} in stock
        </div>
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{product.name}</div>
        <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{product.sku || 'No SKU'}</div>
      </div>
      <div style={{ fontSize: 20, fontWeight: 900, color: '#0a84ff' }}>${product.price}</div>
    </motion.div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', height: '100vh', background: '#f1f5f9', overflow: 'hidden' }}>
      {/* Left Side: Product Grid */}
      <div style={{ padding: 40, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>Sales Terminal</h1>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 24 }}>
          {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>

      {/* Right Side: Cart */}
      <div style={{ background: 'white', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: 32, flex: 1, overflowY: 'auto', minHeight: 250 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 24 }}>Current Cart</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <AnimatePresence>
              {cart.map(item => (
                <motion.div 
                  layout key={item.productId} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                  style={{ display: 'flex', gap: 16, alignItems: 'center' }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>${item.price} × {item.quantity}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>${(item.price * item.quantity).toFixed(2)}</div>
                  <button onClick={() => removeFromCart(item.productId)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash size={18} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div style={{ padding: 32, background: '#f8fafc', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#64748b', fontWeight: 700 }}>
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ color: '#64748b', fontWeight: 700 }}>Discount ($)</span>
            <input 
              type="number" 
              min="0"
              value={globalDiscount} 
              onChange={e => setGlobalDiscount(e.target.value)} 
              style={{ width: 100, padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 700 }} 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>Grand Total</span>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#0a84ff' }}>${total.toFixed(2)}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
            {['cash', 'card', 'split'].map(method => (
              <button 
                key={method}
                onClick={() => setPaymentMethod(method)}
                style={{
                  padding: '12px', borderRadius: 12, fontWeight: 800, fontSize: 12, cursor: 'pointer',
                  border: '2px solid', textTransform: 'capitalize',
                  borderColor: paymentMethod === method ? '#0a84ff' : 'transparent',
                  background: paymentMethod === method ? '#eff6ff' : 'white',
                  color: paymentMethod === method ? '#0a84ff' : '#64748b'
                }}
              >
                {method}
              </button>
            ))}
          </div>

          {paymentMethod === 'cash' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>Cash Tendered ($)</span>
                <input 
                  type="number" 
                  min="0"
                  value={cashTendered} 
                  onChange={e => setCashTendered(e.target.value)} 
                  style={{ width: 120, padding: '10px 12px', borderRadius: 10, border: '1px solid #0a84ff', textAlign: 'right', fontWeight: 800, fontSize: 16 }} 
                  placeholder="0.00"
                />
              </div>
              {cashTendered && parseFloat(cashTendered) >= total && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#dcfce7', padding: 12, borderRadius: 10 }}>
                  <span style={{ color: '#16a34a', fontWeight: 800 }}>Change Due</span>
                  <span style={{ color: '#16a34a', fontWeight: 900, fontSize: 18 }}>${changeDue.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          <button 
            disabled={processing || cart.length === 0}
            onClick={handleCheckout}
            style={{
              width: '100%', padding: '20px', borderRadius: 20, background: '#0f172a', color: 'white',
              fontSize: 18, fontWeight: 900, border: 'none', cursor: 'pointer', opacity: processing ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12
            }}
          >
            {processing ? 'Processing...' : 'Complete Payment'} <ArrowRight size={22} />
          </button>
        </div>
      </div>

      {/* Receipt Modal (Invoice) */}
      {receipt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'white', width: '100%', maxWidth: 450, padding: 32, borderRadius: 32, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            
            <div id="printable-invoice" style={{ flex: 1, overflowY: 'auto', paddingRight: 10 }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: 0 }}>ENTERPRISE ERP</h2>
                <p style={{ color: '#64748b', fontWeight: 600, fontSize: 13, margin: '4px 0 0 0' }}>Official Sales Invoice</p>
                <div style={{ marginTop: 12, fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                  Txn: {receipt.id.split('-')[0].toUpperCase()}<br/>
                  Date: {new Date(receipt.createdAt).toLocaleString()}
                </div>
              </div>
              
              <div style={{ borderTop: '2px dashed #e2e8f0', borderBottom: '2px dashed #e2e8f0', padding: '16px 0', margin: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {receipt.items && receipt.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      {item.quantity}x {item.name}
                    </div>
                    <div style={{ fontWeight: 700 }}>${(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#64748b', fontWeight: 600 }}>
                  <span>Subtotal</span>
                  <span>${receipt.totalAmount}</span>
                </div>
                {parseFloat(receipt.discount) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#ef4444', fontWeight: 700 }}>
                    <span>Discount</span>
                    <span>-${receipt.discount}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, color: '#0f172a', fontWeight: 900, marginTop: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                  <span>Grand Total</span>
                  <span>${receipt.grandTotal}</span>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 16, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontWeight: 600 }}>
                  <span style={{ color: '#64748b' }}>Payment Method</span>
                  <span style={{ textTransform: 'capitalize', color: '#0f172a' }}>{receipt.paymentMethod}</span>
                </div>
                {receipt.paymentMethod === 'cash' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontWeight: 600 }}>
                      <span style={{ color: '#64748b' }}>Tendered</span>
                      <span style={{ color: '#0f172a' }}>${parseFloat(receipt.cashTendered).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                      <span style={{ color: '#64748b' }}>Change</span>
                      <span style={{ color: '#16a34a' }}>${parseFloat(receipt.changeDue).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
              <div style={{ textAlign: 'center', marginTop: 32, color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>
                Thank you for your business!
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button 
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>Invoice - ${receipt.id.split('-')[0].toUpperCase()}</title>
                        <style>
                          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; max-width: 400px; margin: 0 auto; color: #0f172a; }
                        </style>
                      </head>
                      <body onload="window.print(); window.close();">
                        ${document.getElementById('printable-invoice').innerHTML}
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                }} 
                style={{ flex: 1, padding: 14, borderRadius: 16, background: '#f1f5f9', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
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
