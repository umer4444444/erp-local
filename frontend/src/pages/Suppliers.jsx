import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck, Package, Plus, Mail, Phone, MapPin, ShoppingCart,
  CheckCircle, Clock, Star, ChevronDown, ChevronUp, Trash2,
  Edit2, X, AlertTriangle, TrendingUp, RefreshCw, PackageCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supplierAPI, inventoryAPI } from '../api';

// ─── Star Rating Component ───────────────────────────────────────────────────
const StarRating = ({ rating = 0, max = 5, size = 16, editable = false, onChange }) => {
  const [hovered, setHovered] = useState(null);
  const display = hovered ?? rating;
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={size}
          fill={i < display ? '#f59e0b' : 'none'}
          color={i < display ? '#f59e0b' : '#cbd5e1'}
          style={{ cursor: editable ? 'pointer' : 'default', transition: 'color 0.15s' }}
          onMouseEnter={() => editable && setHovered(i + 1)}
          onMouseLeave={() => editable && setHovered(null)}
          onClick={() => editable && onChange && onChange(i + 1)}
        />
      ))}
    </div>
  );
};

// ─── Status Badge ────────────────────────────────────────────────────────────
const STATUS = {
  pending:   { bg: '#fef3c7', color: '#d97706', label: 'Pending',  icon: <Clock size={11} /> },
  received:  { bg: '#dcfce7', color: '#16a34a', label: 'Received', icon: <CheckCircle size={11} /> },
  cancelled: { bg: '#fee2e2', color: '#dc2626', label: 'Cancelled',icon: <X size={11} /> },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS[status] || STATUS.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800,
      background: cfg.bg, color: cfg.color
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

// ─── Input style helper ──────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 12,
  border: '1.5px solid #e2e8f0', fontSize: 14, fontWeight: 600,
  outline: 'none', fontFamily: "'Outfit', sans-serif", boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};
const labelStyle = { display: 'block', fontSize: 11, fontWeight: 800, color: '#94a3b8', marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.5 };

// ─── Empty PO line ────────────────────────────────────────────────────────────
const emptyLine = () => ({ productId: '', productName: '', quantity: 1, unitCost: '' });

// ════════════════════════════════════════════════════════════════════════════
const Suppliers = () => {
  const [suppliers, setSuppliers]       = useState([]);
  const [orders,    setOrders]          = useState([]);
  const [products,  setProducts]        = useState([]);
  const [loading,   setLoading]         = useState(true);
  const [receiving, setReceiving]       = useState(null);   // orderId being received
  const [expandedOrder, setExpandedOrder] = useState(null); // orderId whose items are shown

  // ── Modals ──
  const [showAddModal,    setShowAddModal]    = useState(false);
  const [showEditModal,   setShowEditModal]   = useState(false);
  const [showOrderModal,  setShowOrderModal]  = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // ── Forms ──
  const blankSupplier = { name: '', contactPerson: '', email: '', phone: '', address: '', category: '', rating: 0 };
  const [supplierForm, setSupplierForm] = useState(blankSupplier);
  const [editForm,     setEditForm]     = useState(blankSupplier);
  const [poNotes,      setPoNotes]      = useState('');
  const [poLines,      setPoLines]      = useState([emptyLine()]);
  const [submitting,   setSubmitting]   = useState(false);
  const [autoPoRunning, setAutoPoRunning] = useState(false);

  // ── Computed PO total ──
  const poTotal = poLines.reduce((sum, l) => {
    const qty  = parseFloat(l.quantity)  || 0;
    const cost = parseFloat(l.unitCost)  || 0;
    return sum + qty * cost;
  }, 0);

  // ─── Fetch helpers ────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, oRes, pRes] = await Promise.all([
        supplierAPI.getAll(),
        supplierAPI.getOrders(),
        inventoryAPI.getProducts().catch(() => ({ data: [] })),
      ]);
      setSuppliers(sRes.data || []);
      setOrders(oRes.data || []);
      setProducts(pRes.data || []);
    } catch (err) {
      console.error('Failed to fetch supplier data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Low-stock auto-suggest ───────────────────────────────────────────────
  const lowStockProducts = products.filter(p => (p.stock ?? p.stockQty ?? 0) <= 10);

  const autoFillLowStock = () => {
    if (!lowStockProducts.length) return;
    const lines = lowStockProducts.slice(0, 10).map(p => ({
      productId:   p.id,
      productName: p.name,
      quantity:    50,
      unitCost:    p.costPrice || p.price || '',
    }));
    setPoLines(lines);
    setPoNotes('Auto-generated: reorder for low-stock items');
  };

  const handleAutoPO = async () => {
    if (autoPoRunning) return;
    setAutoPoRunning(true);
    try {
      const res = await inventoryAPI.autoGeneratePO();
      alert(res.data.message || `Purchase Orders created successfully`);
      fetchAll();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to auto-generate Purchase Orders');
    } finally {
      setAutoPoRunning(false);
    }
  };

  // ─── PO line helpers ─────────────────────────────────────────────────────
  const updateLine = (idx, field, value) => {
    setPoLines(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === 'productId') {
        const prod = products.find(p => p.id === value);
        if (prod) {
          next[idx].productName = prod.name;
          next[idx].unitCost    = prod.costPrice || prod.price || '';
        }
      }
      return next;
    });
  };

  const addLine    = () => setPoLines(prev => [...prev, emptyLine()]);
  const removeLine = (idx) => setPoLines(prev => prev.filter((_, i) => i !== idx));

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleAddSupplier = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await supplierAPI.add(supplierForm);
      setShowAddModal(false);
      setSupplierForm(blankSupplier);
      fetchAll();
    } catch { alert('Failed to register supplier'); }
    finally { setSubmitting(false); }
  };

  const handleEditSupplier = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await supplierAPI.update(selectedSupplier.id, editForm);
      setShowEditModal(false);
      fetchAll();
    } catch { alert('Failed to update supplier'); }
    finally { setSubmitting(false); }
  };

  const openEdit = (s) => {
    setSelectedSupplier(s);
    setEditForm({ name: s.name || '', contactPerson: s.contactPerson || '', email: s.email || '',
                  phone: s.phone || '', address: s.address || '', category: s.category || '', rating: s.rating || 0 });
    setShowEditModal(true);
  };

  const openOrder = (s) => {
    setSelectedSupplier(s);
    setPoLines([emptyLine()]);
    setPoNotes('');
    setShowOrderModal(true);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    const validLines = poLines.filter(l => l.productId && parseFloat(l.quantity) > 0);
    if (!validLines.length) { alert('Add at least one product line item.'); return; }
    setSubmitting(true);
    try {
      await supplierAPI.createOrder({
        supplierId:   selectedSupplier.id,
        totalAmount:  poTotal.toFixed(2),
        notes:        poNotes,
        items:        validLines.map(l => ({
          productId: l.productId,
          quantity:  parseInt(l.quantity),
          unitCost:  parseFloat(l.unitCost) || 0,
        })),
      });
      setShowOrderModal(false);
      setSelectedSupplier(null);
      fetchAll();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to place order');
    } finally { setSubmitting(false); }
  };

  const handleReceive = async (orderId) => {
    if (!window.confirm('Mark this order as received? Stock will be updated automatically.')) return;
    setReceiving(orderId);
    try {
      await supplierAPI.receiveOrder(orderId);
      fetchAll();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to receive order');
    } finally { setReceiving(null); }
  };

  // ─── Supplier performance metrics (derived) ──────────────────────────────
  const supplierStats = suppliers.map(s => {
    const sOrders = orders.filter(o => o.supplierId === s.id || o.Supplier?.id === s.id);
    const total   = sOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0);
    const received = sOrders.filter(o => o.status === 'received').length;
    return { ...s, orderCount: sOrders.length, totalSpend: total, receivedCount: received };
  });

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 40, minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>

      {/* ── Header ── */}
      <header style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Truck size={18} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>
                Procurement
              </span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: 0 }}>Supply Chain & CRM</h1>
            <p style={{ color: '#64748b', fontWeight: 600, margin: '4px 0 0' }}>
              Manage vendor relationships, purchase orders, and stock receipts.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={fetchAll} style={{ padding: '12px', borderRadius: 14, background: 'white', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RefreshCw size={18} color="#64748b" />
            </button>
            <button onClick={() => setShowAddModal(true)} style={{ padding: '14px 28px', borderRadius: 16, background: '#0f172a', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
              <Plus size={18} /> Add Supplier
            </button>
          </div>
        </div>

        {/* Low-stock alert banner */}
        {lowStockProducts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: 20, padding: '14px 20px', borderRadius: 16, background: '#fff7ed', border: '1px solid #fed7aa', display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle size={18} color="#f97316" />
            <span style={{ fontWeight: 700, color: '#c2410c', fontSize: 14 }}>
              {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} running low on stock.
            </span>
            <button onClick={handleAutoPO} disabled={autoPoRunning}
              style={{ marginLeft: 'auto', padding: '8px 18px', borderRadius: 10, background: autoPoRunning ? '#e2e8f0' : '#f97316', color: autoPoRunning ? '#64748b' : 'white', border: 'none', fontWeight: 800, cursor: autoPoRunning ? 'not-allowed' : 'pointer', fontSize: 13 }}>
              {autoPoRunning ? 'Generating…' : 'Auto-Generate PO'}
            </button>
          </motion.div>
        )}
      </header>

      {/* ── Supplier Cards ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8', fontWeight: 700 }}>Loading suppliers…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24, marginBottom: 48 }}>
          {supplierStats.map(s => (
            <motion.div key={s.id} whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.10)' }} transition={{ type: 'spring', stiffness: 300 }}
              style={{ background: 'white', padding: 28, borderRadius: 28, border: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Card header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: 56, height: 56, borderRadius: 18, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Truck size={28} color="#0f172a" />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 20, background: '#f1f5f9', color: '#64748b', fontSize: 10, fontWeight: 800, marginBottom: 6 }}>
                    {s.category?.toUpperCase() || 'GENERAL'}
                  </span>
                  <div><StarRating rating={s.rating || 0} /></div>
                </div>
              </div>

              {/* Name & contact */}
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>{s.name}</h2>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{s.contactPerson || '—'}</div>
              </div>

              {/* Contact info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid #f1f5f9', paddingTop: 18 }}>
                {s.email  && <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 13 }}><Mail size={14} /> {s.email}</div>}
                {s.phone  && <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 13 }}><Phone size={14} /> {s.phone}</div>}
                {s.address && <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 13 }}><MapPin size={14} /> {s.address}</div>}
              </div>

              {/* Performance metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Orders', value: s.orderCount },
                  { label: 'Received', value: s.receivedCount },
                  { label: 'Total Spend', value: `$${(s.totalSpend/1000).toFixed(1)}k` },
                ].map(m => (
                  <div key={m.label} style={{ textAlign: 'center', padding: '10px 6px', borderRadius: 12, background: '#f8fafc' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{m.value}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => openEdit(s)}
                  style={{ padding: '12px', borderRadius: 14, background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Edit2 size={16} color="#475569" />
                </button>
                <button onClick={() => openOrder(s)}
                  style={{ flex: 1, padding: '13px', borderRadius: 14, background: '#0f172a', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14 }}>
                  <ShoppingCart size={16} /> Create PO
                </button>
              </div>
            </motion.div>
          ))}
          {suppliers.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 100, color: '#94a3b8' }}>
              <Truck size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
              <div style={{ fontWeight: 700 }}>No suppliers registered yet.</div>
            </div>
          )}
        </div>
      )}

      {/* ── Purchase Orders Table ── */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: 0 }}>Purchase Orders</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            {['all','pending','received'].map(f => (
              <span key={f} style={{ padding: '6px 14px', borderRadius: 20, background: '#f1f5f9', color: '#64748b', fontWeight: 700, fontSize: 12, cursor: 'default', textTransform: 'capitalize' }}>{f}</span>
            ))}
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: 28, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                {['', 'PO ID', 'Supplier', 'Date', 'Items', 'Total', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '16px 18px', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', textAlign: 'left', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const isExpanded = expandedOrder === o.id;
                const items = o.Items || [];
                return (
                  <React.Fragment key={o.id}>
                    <tr style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}>

                      {/* Expand toggle */}
                      <td style={{ padding: '16px 12px 16px 18px', width: 36 }}>
                        {items.length > 0 && (
                          <button onClick={() => setExpandedOrder(isExpanded ? null : o.id)}
                            style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #e2e8f0', background: isExpanded ? '#f1f5f9' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isExpanded ? <ChevronUp size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />}
                          </button>
                        )}
                      </td>

                      <td style={{ padding: '16px 18px', fontFamily: 'monospace', fontSize: 12, fontWeight: 800, color: '#475569' }}>
                        {o.id?.slice(0, 8).toUpperCase()}
                      </td>
                      <td style={{ padding: '16px 18px', fontWeight: 800, color: '#0f172a', fontSize: 14 }}>
                        {o.Supplier?.name || '—'}
                      </td>
                      <td style={{ padding: '16px 18px', color: '#64748b', fontWeight: 600, fontSize: 13 }}>
                        {new Date(o.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '16px 18px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 10, background: '#f1f5f9', fontSize: 12, fontWeight: 700, color: '#475569' }}>
                          <Package size={12} /> {items.length || '—'} item{items.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td style={{ padding: '16px 18px', fontWeight: 900, color: '#0f172a', fontSize: 15 }}>
                        ${parseFloat(o.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '16px 18px' }}>
                        <StatusBadge status={o.status} />
                      </td>
                      <td style={{ padding: '16px 18px' }}>
                        {o.status === 'pending' && (
                          <button onClick={() => handleReceive(o.id)} disabled={receiving === o.id}
                            style={{ padding: '8px 16px', borderRadius: 10, background: receiving === o.id ? '#e2e8f0' : '#dcfce7', color: receiving === o.id ? '#94a3b8' : '#16a34a', border: 'none', fontWeight: 800, cursor: receiving === o.id ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, transition: 'all 0.2s' }}>
                            <PackageCheck size={14} />
                            {receiving === o.id ? 'Receiving…' : 'Receive'}
                          </button>
                        )}
                        {o.status === 'received' && (
                          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>✓ Done</span>
                        )}
                      </td>
                    </tr>

                    {/* Expandable item rows */}
                    <AnimatePresence>
                      {isExpanded && items.length > 0 && (
                        <tr>
                          <td colSpan={8} style={{ padding: 0, background: '#f8fafc' }}>
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                              <div style={{ padding: '16px 56px 20px' }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Line Items</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {items.map((item, idx) => (
                                    <div key={item.id || idx} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 14px', background: 'white', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                      <div style={{ flex: 1, fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                                        {item.Product?.name || `Product ${idx + 1}`}
                                      </div>
                                      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                                        Qty: <strong style={{ color: '#0f172a' }}>{item.quantity}</strong>
                                      </div>
                                      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                                        Unit: <strong style={{ color: '#0f172a' }}>${parseFloat(item.unitCost || 0).toFixed(2)}</strong>
                                      </div>
                                      <div style={{ fontWeight: 900, fontSize: 14, color: '#0f172a', minWidth: 90, textAlign: 'right' }}>
                                        ${(item.quantity * parseFloat(item.unitCost || 0)).toFixed(2)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                    <Package size={40} style={{ opacity: 0.2, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
                    <div style={{ fontWeight: 700 }}>No purchase orders found.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          MODAL: Add Supplier
      ════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showAddModal && (
          <ModalWrapper onClose={() => setShowAddModal(false)}>
            <ModalCard maxWidth={520}>
              <ModalHeader title="Add New Supplier" onClose={() => setShowAddModal(false)} />
              <form onSubmit={handleAddSupplier} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <SupplierFormFields form={supplierForm} setForm={setSupplierForm} />
                <SubmitBtn loading={submitting}>Register Supplier</SubmitBtn>
              </form>
            </ModalCard>
          </ModalWrapper>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════
          MODAL: Edit Supplier
      ════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showEditModal && selectedSupplier && (
          <ModalWrapper onClose={() => setShowEditModal(false)}>
            <ModalCard maxWidth={520}>
              <ModalHeader title={`Edit — ${selectedSupplier.name}`} onClose={() => setShowEditModal(false)} />
              <form onSubmit={handleEditSupplier} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <SupplierFormFields form={editForm} setForm={setEditForm} />
                <SubmitBtn loading={submitting}>Save Changes</SubmitBtn>
              </form>
            </ModalCard>
          </ModalWrapper>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════
          MODAL: Create Purchase Order
      ════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showOrderModal && selectedSupplier && (
          <ModalWrapper onClose={() => setShowOrderModal(false)}>
            <ModalCard maxWidth={680}>
              <ModalHeader
                title={<span>New PO — <span style={{ color: '#0a84ff' }}>{selectedSupplier.name}</span></span>}
                onClose={() => setShowOrderModal(false)}
              />
              <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Low-stock auto-suggest button */}
                {lowStockProducts.length > 0 && (
                  <button type="button" onClick={autoFillLowStock}
                    style={{ padding: '10px 16px', borderRadius: 12, background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <TrendingUp size={16} /> Auto-fill {lowStockProducts.length} low-stock items
                  </button>
                )}

                {/* Line items builder */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <label style={labelStyle}>Line Items</label>
                    <button type="button" onClick={addLine}
                      style={{ padding: '6px 14px', borderRadius: 10, background: '#f1f5f9', border: 'none', color: '#475569', fontWeight: 800, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Plus size={14} /> Add Row
                    </button>
                  </div>

                  {/* Column headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 90px 36px', gap: 8, marginBottom: 8 }}>
                    {['Product', 'Qty', 'Unit Cost', 'Subtotal', ''].map(h => (
                      <div key={h} style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {poLines.map((line, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 90px 36px', gap: 8, alignItems: 'center' }}>

                        {/* Product dropdown */}
                        <select value={line.productId} onChange={e => updateLine(idx, 'productId', e.target.value)}
                          style={{ ...inputStyle, padding: '11px 12px' }}>
                          <option value="">— Select product —</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} {p.stock <= 10 ? '⚠ Low' : ''}
                            </option>
                          ))}
                        </select>

                        {/* Quantity */}
                        <input type="number" min="1" value={line.quantity}
                          onChange={e => updateLine(idx, 'quantity', e.target.value)}
                          style={{ ...inputStyle, textAlign: 'center' }} />

                        {/* Unit cost */}
                        <input type="number" min="0" step="0.01" placeholder="0.00"
                          value={line.unitCost}
                          onChange={e => updateLine(idx, 'unitCost', e.target.value)}
                          style={{ ...inputStyle }} />

                        {/* Subtotal (read-only) */}
                        <div style={{ padding: '11px 12px', borderRadius: 12, background: '#f8fafc', fontSize: 13, fontWeight: 800, color: '#0f172a', textAlign: 'right', border: '1.5px solid #e2e8f0' }}>
                          ${((parseFloat(line.quantity) || 0) * (parseFloat(line.unitCost) || 0)).toFixed(2)}
                        </div>

                        {/* Remove row */}
                        <button type="button" onClick={() => removeLine(idx)} disabled={poLines.length === 1}
                          style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #fee2e2', background: '#fff5f5', color: '#ef4444', cursor: poLines.length === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: poLines.length === 1 ? 0.3 : 1 }}>
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </div>

                  {/* Total row */}
                  <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Order Total:</span>
                    <span style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>
                      ${poTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label style={labelStyle}>Notes / Instructions</label>
                  <textarea value={poNotes} onChange={e => setPoNotes(e.target.value)}
                    placeholder="Any special delivery or quality instructions…"
                    style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} />
                </div>

                <SubmitBtn loading={submitting}>
                  <ShoppingCart size={16} /> Submit Purchase Order
                </SubmitBtn>
              </form>
            </ModalCard>
          </ModalWrapper>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Shared Modal primitives ──────────────────────────────────────────────────
const ModalWrapper = ({ children, onClose }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)' }} />
    {children}
  </div>
);

const ModalCard = ({ children, maxWidth = 520 }) => (
  <motion.div initial={{ scale: 0.92, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.92, y: 20, opacity: 0 }}
    style={{ background: 'white', borderRadius: 32, width: '100%', maxWidth, position: 'relative', padding: 40, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.18)' }}>
    {children}
  </motion.div>
);

const ModalHeader = ({ title, onClose }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
    <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0 }}>{title}</h2>
    <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <X size={18} color="#64748b" />
    </button>
  </div>
);

const SubmitBtn = ({ children, loading }) => (
  <button type="submit" disabled={loading}
    style={{ marginTop: 8, padding: '16px 24px', borderRadius: 16, background: loading ? '#e2e8f0' : '#0f172a', color: loading ? '#94a3b8' : 'white', border: 'none', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s' }}>
    {loading ? 'Saving…' : children}
  </button>
);

// ─── Supplier form fields (reused across Add & Edit modals) ──────────────────
const SupplierFormFields = ({ form, setForm }) => {
  const f = (field, value) => setForm(p => ({ ...p, [field]: value }));
  const fields = [
    { key: 'name',          label: 'Supplier Name',   placeholder: 'e.g. Acme Corporation',   full: true },
    { key: 'contactPerson', label: 'Contact Person',  placeholder: 'e.g. John Doe' },
    { key: 'category',      label: 'Category',        placeholder: 'e.g. Structural Materials' },
    { key: 'email',         label: 'Email',           placeholder: 'contact@supplier.com',     type: 'email' },
    { key: 'phone',         label: 'Phone',           placeholder: '+92 300 0000000' },
  ];

  return (
    <>
      {fields.filter(f => f.full).map(({ key, label, placeholder, type }) => (
        <div key={key}>
          <label style={labelStyle}>{label}</label>
          <input required={key === 'name'} type={type || 'text'} value={form[key] || ''} onChange={e => f(key, e.target.value)} placeholder={placeholder} style={inputStyle} />
        </div>
      ))}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {fields.filter(fi => !fi.full).map(({ key, label, placeholder, type }) => (
          <div key={key}>
            <label style={labelStyle}>{label}</label>
            <input type={type || 'text'} value={form[key] || ''} onChange={e => f(key, e.target.value)} placeholder={placeholder} style={inputStyle} />
          </div>
        ))}
      </div>
      <div>
        <label style={labelStyle}>Address</label>
        <textarea value={form.address || ''} onChange={e => f('address', e.target.value)} placeholder="Full physical address" style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} />
      </div>
      <div>
        <label style={labelStyle}>Supplier Rating</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fafafa' }}>
          <StarRating rating={form.rating || 0} editable onChange={v => f('rating', v)} size={22} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>
            {form.rating ? `${form.rating} / 5` : 'Not rated'}
          </span>
        </div>
      </div>
    </>
  );
};

export default Suppliers;
