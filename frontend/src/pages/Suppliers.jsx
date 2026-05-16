import React, { useState, useEffect } from 'react';
import { 
  Truck, Package, Plus, Search, Mail, Phone, 
  MapPin, ShoppingCart, CheckCircle, Clock 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supplierAPI } from '../api';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ name: '', contactPerson: '', email: '', phone: '', address: '', category: '' });
  const [orders, setOrders] = useState([]);
  const [orderForm, setOrderForm] = useState({ totalAmount: '', notes: '' });

  useEffect(() => {
    fetchSuppliers();
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await supplierAPI.getOrders();
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await supplierAPI.getAll();
      setSuppliers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    try {
      await supplierAPI.add(form);
      setShowAddModal(false);
      setForm({ name: '', contactPerson: '', email: '', phone: '', address: '', category: '' });
      fetchSuppliers();
    } catch (err) {
      alert('Failed to add supplier');
    }
  };

  const handleOrderStock = async (e) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    try {
      await supplierAPI.createOrder({
        supplierId: selectedSupplier.id,
        totalAmount: orderForm.totalAmount,
        notes: orderForm.notes
      });
      setShowOrderModal(false);
      setSelectedSupplier(null);
      setOrderForm({ totalAmount: '', notes: '' });
      fetchOrders();
      alert('Order placed successfully!');
    } catch (err) {
      alert('Failed to place order');
    }
  };

  return (
    <div style={{ padding: 40, minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>Supply Chain & CRM</h1>
          <p style={{ color: '#64748b', fontWeight: 600 }}>Manage vendor relationships and procurement orders.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} style={{ padding: '14px 28px', borderRadius: 16, background: '#0f172a', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Plus size={20} /> Add New Supplier
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
        {suppliers.map(s => (
          <div key={s.id} style={{ background: 'white', padding: 32, borderRadius: 32, border: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Truck size={32} color="#0f172a" />
              </div>
              <span style={{ padding: '6px 12px', borderRadius: 20, background: '#f1f5f9', color: '#64748b', fontSize: 11, fontWeight: 800 }}>
                {s.category?.toUpperCase() || 'GENERAL'}
              </span>
            </div>

            <div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{s.name}</h2>
              <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>{s.contactPerson}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid #f1f5f9', paddingTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748b', fontSize: 13 }}>
                <Mail size={16} /> {s.email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748b', fontSize: 13 }}>
                <Phone size={16} /> {s.phone}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748b', fontSize: 13 }}>
                <MapPin size={16} /> {s.address}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button 
                onClick={() => { setSelectedSupplier(s); setShowOrderModal(true); }}
                style={{ flex: 1, padding: '14px', borderRadius: 16, background: '#0a84ff', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <ShoppingCart size={18} /> Order Stock
              </button>
            </div>
          </div>
        ))}
        {suppliers.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 100, color: '#94a3b8' }}>No suppliers registered.</div>}
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowAddModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} style={{ background: 'white', borderRadius: 32, width: '100%', maxWidth: 500, position: 'relative', padding: 40, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 32 }}>Add New Supplier</h2>
            <form onSubmit={handleAddSupplier} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>SUPPLIER NAME</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Acme Corp" style={{ width: '100%', padding: '14px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>CONTACT PERSON</label>
                  <input value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} placeholder="e.g. John Doe" style={{ width: '100%', padding: '14px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>CATEGORY</label>
                  <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="e.g. Pharmacy" style={{ width: '100%', padding: '14px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600 }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>EMAIL</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="contact@acme.com" style={{ width: '100%', padding: '14px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>PHONE</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+1 234 567 8900" style={{ width: '100%', padding: '14px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600 }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>ADDRESS</label>
                <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Full physical address" style={{ width: '100%', padding: '14px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600, minHeight: 80 }} />
              </div>
              <button type="submit" style={{ marginTop: 16, padding: 18, borderRadius: 20, background: '#0f172a', color: 'white', border: 'none', fontWeight: 900, cursor: 'pointer' }}>Register Supplier</button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Order Stock Modal */}
      {showOrderModal && selectedSupplier && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => {setShowOrderModal(false); setSelectedSupplier(null);}} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} style={{ background: 'white', borderRadius: 32, width: '100%', maxWidth: 450, position: 'relative', padding: 40 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Order from {selectedSupplier.name}</h2>
            <p style={{ color: '#64748b', marginBottom: 32, fontSize: 14 }}>Create a new purchase order for stock replenishment.</p>
            <form onSubmit={handleOrderStock} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>TOTAL AMOUNT ($)</label>
                <input required type="number" step="0.01" value={orderForm.totalAmount} onChange={e => setOrderForm({...orderForm, totalAmount: e.target.value})} placeholder="0.00" style={{ width: '100%', padding: '14px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>ORDER NOTES / ITEMS</label>
                <textarea required value={orderForm.notes} onChange={e => setOrderForm({...orderForm, notes: e.target.value})} placeholder="E.g. 50x Paracetamol 500mg, 20x Ibuprofen" style={{ width: '100%', padding: '14px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600, minHeight: 100 }} />
              </div>
              <button type="submit" style={{ marginTop: 16, padding: 18, borderRadius: 20, background: '#0a84ff', color: 'white', border: 'none', fontWeight: 900, cursor: 'pointer' }}>Submit Purchase Order</button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Purchase Orders Table */}
      <div style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 24 }}>Recent Purchase Orders</h2>
        <div style={{ background: 'white', borderRadius: 32, padding: 32, border: '1px solid rgba(0,0,0,0.05)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: '#64748b', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9' }}>
                <th style={{ padding: '0 0 16px 0' }}>Order ID</th>
                <th style={{ padding: '0 0 16px 0' }}>Supplier</th>
                <th style={{ padding: '0 0 16px 0' }}>Date</th>
                <th style={{ padding: '0 0 16px 0' }}>Amount</th>
                <th style={{ padding: '0 0 16px 0' }}>Status</th>
                <th style={{ padding: '0 0 16px 0' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '20px 0', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{o.id.split('-')[0]}</td>
                  <td style={{ padding: '20px 0', fontSize: 14, fontWeight: 800 }}>{o.Supplier?.name || 'Unknown'}</td>
                  <td style={{ padding: '20px 0', fontSize: 14, color: '#64748b', fontWeight: 600 }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '20px 0', fontSize: 14, fontWeight: 900, color: '#0f172a' }}>${parseFloat(o.totalAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td style={{ padding: '20px 0' }}>
                    <span style={{ padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', background: o.status === 'pending' ? '#fef3c7' : '#dcfce7', color: o.status === 'pending' ? '#d97706' : '#16a34a' }}>
                      {o.status}
                    </span>
                  </td>
                  <td style={{ padding: '20px 0', fontSize: 13, color: '#64748b', fontWeight: 500, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.notes}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>No purchase orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Suppliers;
