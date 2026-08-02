import React, { useState, useEffect } from 'react';
import { Search, Filter, Printer, Eye, X, Calendar, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { salesAPI } from '../api';

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await salesAPI.getHistory({ 
        search, 
        startDate, 
        endDate, 
        status: statusFilter 
      });
      setSales(res.data.rows || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when filters change (except search which is on Enter)
  useEffect(() => {
    fetchHistory();
  }, [startDate, endDate, statusFilter]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'active': return { bg: '#f0fdf4', color: '#16a34a' };
      case 'voided': return { bg: '#fff1f2', color: '#e11d48' };
      default: return { bg: '#f1f5f9', color: 'var(--text-muted)' };
    }
  };

  // Reprint — exact same format as Sales.jsx receipt modal
  const handleReprint = (sale) => {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    iframe.style.display = 'none';

    const itemRows = (sale.Items || []).map(item => `
      <div style="display:grid; grid-template-columns:2.5fr 1fr 1fr 1fr; gap:8px; font-size:13px; align-items:center; padding:8px 0; border-bottom:1px solid #f8fafc;">
        <span style="font-weight:600; color:#0f172a; word-break:break-all;">${item.Product?.name || 'Item'}</span>
        <span style="text-align:center; font-weight:800; color:#0f172a;">${item.quantity}</span>
        <span style="text-align:right; color:#64748b;">SAR ${parseFloat(item.price || 0).toFixed(2)}</span>
        <span style="text-align:right; font-weight:800; color:#0f172a;">SAR ${parseFloat(item.total || 0).toFixed(2)}</span>
      </div>
    `).join('');

    const subtotal = parseFloat(sale.totalAmount || sale.grandTotal || 0);
    const discount = parseFloat(sale.discount || 0);
    const grandTotal = parseFloat(sale.grandTotal || 0);
    const cashAmount = parseFloat(sale.cashAmount || 0);
    const change = sale.paymentMethod === 'cash' && cashAmount > 0 ? Math.max(cashAmount - grandTotal, 0) : 0;

    iframe.contentDocument.write(`
      <html>
        <head>
          <title>Invoice - ${sale.id.slice(0, 8).toUpperCase()}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&display=swap');
            body { font-family: 'Outfit', sans-serif; padding: 40px; max-width: 400px; margin: 0 auto; color: #0f172a; }
          </style>
        </head>
        <body>
          <!-- REPRINT stamp -->
          <div style="text-align:center; margin-bottom:12px;">
            <span style="display:inline-block; border:3px solid #ef4444; color:#ef4444; font-size:13px; font-weight:900; padding:4px 14px; border-radius:4px; letter-spacing:2px; transform:rotate(-5deg);">REPRINT</span>
          </div>

          <!-- Header -->
          <div style="text-align:center; margin-bottom:24px;">
            <h2 style="font-size:28px; font-weight:900; color:#0f172a; margin:0;">GlobalAI ERP</h2>
            <p style="color:#64748b; font-weight:600; font-size:13px; margin:4px 0 0 0;">Official Sales Invoice</p>
            <div style="margin-top:12px; font-size:12px; color:#94a3b8; font-weight:500;">
              Txn: ${sale.id.slice(0, 8).toUpperCase()}<br/>
              Cashier: ${sale.cashierName || sale.User?.name || 'Staff'}<br/>
              Date: ${new Date(sale.createdAt).toLocaleString()}
            </div>
          </div>

          ${sale.Customer?.name ? `
          <div style="margin-bottom:12px; padding:8px 16px; background:#f8fafc; border-radius:10px; font-size:12px; font-weight:700; color:#64748b; display:flex; align-items:center; gap:6px;">
            Customer: ${sale.Customer.name}
          </div>` : ''}

          <!-- Items -->
          <div style="border-top:2px dashed #e2e8f0; border-bottom:2px dashed #e2e8f0; padding:16px 0; margin:16px 0;">
            <div style="display:grid; grid-template-columns:2.5fr 1fr 1fr 1fr; gap:8px; font-size:12px; font-weight:800; color:#64748b; padding-bottom:6px; border-bottom:1px solid #e2e8f0;">
              <span>Item</span>
              <span style="text-align:center;">Qty</span>
              <span style="text-align:right;">Unit</span>
              <span style="text-align:right;">Total</span>
            </div>
            ${itemRows}
          </div>

          <!-- Totals -->
          <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:24px;">
            <div style="display:flex; justify-content:space-between; font-size:14px; color:#64748b; font-weight:600;">
              <span>Subtotal</span><span>SAR ${subtotal.toFixed(2)}</span>
            </div>
            ${discount > 0 ? `
            <div style="display:flex; justify-content:space-between; font-size:14px; color:#ef4444; font-weight:700;">
              <span>Discount</span><span>-SAR ${discount.toFixed(2)}</span>
            </div>` : ''}
            <div style="display:flex; justify-content:space-between; font-size:18px; color:#0f172a; font-weight:900; margin-top:8px; padding-top:8px; border-top:1px solid #f1f5f9;">
              <span>Grand Total</span><span style="color:#0a84ff;">SAR ${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <!-- Payment -->
          <div style="background:#f8fafc; padding:16px; border-radius:12px; font-size:13px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-weight:600;">
              <span style="color:#64748b;">Payment Method</span>
              <span style="text-transform:capitalize; color:#0f172a;">${sale.paymentMethod === 'credit' ? 'Loan / Credit' : sale.paymentMethod}</span>
            </div>
            ${sale.paymentMethod === 'cash' && cashAmount > 0 ? `
            <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-weight:600;">
              <span style="color:#64748b;">Tendered</span>
              <span style="color:#0f172a;">SAR ${cashAmount.toFixed(2)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-weight:800;">
              <span style="color:#64748b;">Change</span>
              <span style="color:#16a34a;">SAR ${change.toFixed(2)}</span>
            </div>` : ''}
          </div>

          <div style="text-align:center; margin-top:24px; color:#94a3b8; font-size:12px; font-weight:600;">Thank you for your business!</div>

          <script>
            window.onload = function() { window.print(); setTimeout(() => window.parent.document.body.removeChild(window.frameElement), 100); }
          </script>
        </body>
      </html>
    `);
    iframe.contentDocument.close();
  };

  const handleVoid = async (sale) => {
    if (sale.status === 'voided') {
      alert('This transaction is already voided.');
      return;
    }
    const reason = window.prompt('Please enter a reason for voiding this transaction:');
    if (reason === null) return; // Cancelled
    if (!reason.trim()) {
      alert('A void reason is required.');
      return;
    }

    try {
      await salesAPI.voidSale(sale.id, reason);
      alert('Transaction voided successfully!');
      setSelectedSale(null);
      fetchHistory();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to void transaction.');
    }
  };

  return (
    <div style={{ padding: 40, minHeight: '100vh', background: 'var(--bg-main)', fontFamily: "'Outfit', sans-serif" }}>
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-main)' }}>Transaction Ledger</h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Audit past sales, void transactions, and re-print receipts.</p>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              value={search} onChange={e => setSearch(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && fetchHistory()}
              placeholder="Search by ID or Status..." 
              style={{ padding: '12px 12px 12px 44px', borderRadius: 14, border: '1px solid #e2e8f0', width: 300, fontWeight: 600 }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              style={{ padding: '12px 24px', borderRadius: 14, background: showFilters ? '#f1f5f9' : 'var(--bg-panel)', border: '1px solid #e2e8f0', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Filter size={18} /> Filters
            </button>
            
            {showFilters && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: 'var(--bg-panel)', borderRadius: 16, padding: 20, width: 300, boxShadow: '0 10px 40px var(--shadow-strong-rgb)', border: '1px solid #e2e8f0', zIndex: 100 }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontFamily: 'inherit' }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>End Date</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontFamily: 'inherit' }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>Status</label>
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontFamily: 'inherit' }}>
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="voided">Voided</option>
                    <option value="refunded">Refunded</option>
                    <option value="held">Held</option>
                  </select>
                </div>
                <button 
                  onClick={() => { setStartDate(''); setEndDate(''); setStatusFilter(''); setSearch(''); fetchHistory(); }}
                  style={{ width: '100%', padding: 10, borderRadius: 8, background: '#f1f5f9', border: 'none', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div style={{ background: 'var(--bg-panel)', borderRadius: 24, border: '1px solid var(--border-color-rgb)', overflow: 'hidden' }}>
        <div className="w-full overflow-x-auto"><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid #f1f5f9' }}>
              <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>Transaction ID</th>
              <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>Date & Time</th>
              <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>Customer</th>
              <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>Amount</th>
              <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}></th>
            </tr>
          </thead>
          <tbody>
            {sales.map(sale => {
              const style = getStatusStyle(sale.status);
              return (
                <tr key={sale.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 800, color: 'var(--text-main)' }}>#{sale.id.slice(0,8).toUpperCase()}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: 14 }}>{new Date(sale.createdAt).toLocaleDateString()}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{new Date(sale.createdAt).toLocaleTimeString()}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <User size={16} />
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 14 }}>{sale.Customer?.name || 'Walk-in'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', fontWeight: 900, color: 'var(--text-main)' }}>SAR {sale.grandTotal}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ padding: '6px 12px', borderRadius: 8, background: style.bg, color: style.color, fontSize: 12, fontWeight: 800, textTransform: 'capitalize' }}>
                      {sale.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <button 
                      onClick={() => setSelectedSale(sale)}
                      style={{ padding: '8px 12px', borderRadius: 10, background: 'transparent', border: '1px solid #e2e8f0', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Eye size={16} /> Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </div>

      {/* Sale Detail Modal */}
      <AnimatePresence>
        {selectedSale && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} style={{ background: 'var(--bg-panel)', width: '100%', maxWidth: 500, borderRadius: 32, overflow: 'hidden' }}>
              <div style={{ padding: 32, background: 'var(--text-main)', color: 'var(--bg-panel)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 900 }}>Sale Details</h3>
                  <p style={{ opacity: 0.7, fontSize: 13, fontWeight: 600 }}>Transaction #{selectedSale.id}</p>
                </div>
                <button onClick={() => setSelectedSale(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--bg-panel)', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ padding: 32 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                  {selectedSale.Items?.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: 14 }}>{item.Product?.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>SAR {item.price} × {item.quantity}</div>
                      </div>
                      <div style={{ fontWeight: 900, color: 'var(--text-main)' }}>SAR {item.total}</div>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: '2px dashed #f1f5f9', paddingTop: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Total Amount</span>
                    <span style={{ fontWeight: 900, color: 'var(--text-main)', fontSize: 24 }}>SAR {selectedSale.grandTotal}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Payment Method</span>
                    <span style={{ fontWeight: 800, color: '#0a84ff', textTransform: 'capitalize' }}>{selectedSale.paymentMethod}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                  <button onClick={() => handleReprint(selectedSale)} style={{ flex: 1, padding: 14, borderRadius: 16, background: '#f1f5f9', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Printer size={18} /> Re-print
                  </button>
                  <button onClick={() => handleVoid(selectedSale)} style={{ flex: 1, padding: 14, borderRadius: 16, background: '#ef444415', color: '#ef4444', border: 'none', fontWeight: 800, cursor: 'pointer' }}>
                    Void Transaction
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SalesHistory;
