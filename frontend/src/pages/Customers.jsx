import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Phone, Mail, 
  MapPin, Clock, ArrowUpRight, Filter, 
  MoreVertical, X, Save, ShieldCheck, Star, CreditCard,
  Crown, Award, TrendingUp, DollarSign, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { customerAPI } from '../api';
import API from '../api';

const TIER_CONFIG = {
  Bronze:   { color: '#cd7f32', bg: '#fdf6ec', label: 'Bronze',   icon: '🥉', min: 0 },
  Silver:   { color: '#94a3b8', bg: '#f1f5f9', label: 'Silver',   icon: '🥈', min: 500 },
  Gold:     { color: '#f59e0b', bg: '#fffbeb', label: 'Gold',     icon: '🥇', min: 1500 },
  Platinum: { color: '#8b5cf6', bg: '#f5f3ff', label: 'Platinum', icon: '💎', min: 5000 },
};

const getTier = (points = 0) => {
  if (points >= 5000) return TIER_CONFIG.Platinum;
  if (points >= 1500) return TIER_CONFIG.Gold;
  if (points >= 500) return TIER_CONFIG.Silver;
  return TIER_CONFIG.Bronze;
};

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', address: '' });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const handleOptions = async (customer) => {
    const action = window.prompt('Enter "edit" to edit or "delete" to delete the customer');
    if (!action) return;
    if (action.toLowerCase() === 'edit') {
      setEditingCustomer(customer);
      setNewCustomer({ name: customer.name, email: customer.email, phone: customer.phone, address: customer.address });
      setShowModal(true);
    } else if (action.toLowerCase() === 'delete') {
      if (window.confirm(`Are you sure you want to delete ${customer.name}?`)) {
        try {
          await customerAPI.delete(customer.id);
          fetchCustomers();
        } catch (err) {
          alert('Failed to delete customer');
        }
      }
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await customerAPI.getCustomers();
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    const interval = setInterval(fetchCustomers, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) return alert('Name and Phone are required');
    try {
      if (editingCustomer) {
        await API.put(`/customers/${editingCustomer.id}`, newCustomer);
      } else {
        await customerAPI.create(newCustomer);
      }
      setShowModal(false);
      setEditingCustomer(null);
      setNewCustomer({ name: '', email: '', phone: '', address: '' });
      fetchCustomers();
    } catch (err) {
      alert('Failed to save customer');
    }
  };

  const fetchHistory = async (customerId) => {
    setHistoryLoading(true);
    try {
      const res = await customerAPI.getHistory(customerId);
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handlePayOutstanding = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) return alert('Enter valid amount');
    setPaymentLoading(true);
    try {
      await API.post(`/customers/${selectedCustomer.id}/pay-outstanding`, {
        amount: parseFloat(paymentAmount),
        note: paymentNote,
      });
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentNote('');
      fetchCustomers();
      alert('Payment recorded successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Payment failed');
    } finally {
      setPaymentLoading(false);
    }
  };

  const filtered = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.phone.includes(search) || 
      c.email?.toLowerCase().includes(search.toLowerCase());
    const tier = getTier(c.loyaltyPoints || 0);
    const matchTier = tierFilter ? tier.label === tierFilter : true;
    return matchSearch && matchTier;
  });

  const stats = {
    total: customers.length,
    gold: customers.filter(c => (c.loyaltyPoints || 0) >= 1500).length,
    outstanding: customers.reduce((s, c) => s + parseFloat(c.outstandingBalance || 0), 0),
    totalPoints: customers.reduce((s, c) => s + (c.loyaltyPoints || 0), 0),
  };

  return (
    <div style={{ padding: 40, minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
      <header style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#0a84ff', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={18} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Relationship Management</span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>Customer CRM</h1>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone..."
                style={{ padding: '12px 12px 12px 44px', borderRadius: 14, border: '1px solid #e2e8f0', width: 260, fontWeight: 600 }} />
            </div>
            <select value={tierFilter} onChange={e => setTierFilter(e.target.value)}
              style={{ padding: '12px 16px', borderRadius: 14, border: '1px solid #e2e8f0', fontWeight: 700, background: 'white', cursor: 'pointer' }}>
              <option value="">All Tiers</option>
              <option value="Bronze">🥉 Bronze</option>
              <option value="Silver">🥈 Silver</option>
              <option value="Gold">🥇 Gold</option>
              <option value="Platinum">💎 Platinum</option>
            </select>
            <button onClick={() => { setShowModal(true); setEditingCustomer(null); setNewCustomer({ name: '', email: '', phone: '', address: '' }); }}
              style={{ padding: '12px 24px', borderRadius: 14, background: '#0f172a', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserPlus size={18} /> Add Customer
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { label: 'Total Customers', value: stats.total, icon: <Users size={18} />, color: '#0a84ff', bg: '#eff6ff' },
            { label: 'Gold+ Members', value: stats.gold, icon: <Crown size={18} />, color: '#f59e0b', bg: '#fffbeb' },
            { label: 'Outstanding Balance', value: `$${stats.outstanding.toFixed(2)}`, icon: <DollarSign size={18} />, color: '#ef4444', bg: '#fff1f2' },
            { label: 'Total Loyalty Points', value: stats.totalPoints.toLocaleString(), icon: <Star size={18} />, color: '#8b5cf6', bg: '#f5f3ff' },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: 20, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, border: '1px solid rgba(0,0,0,0.04)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* Customer Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
        <AnimatePresence>
          {filtered.map((c, index) => {
            const tier = getTier(c.loyaltyPoints || 0);
            const outstanding = parseFloat(c.outstandingBalance || 0);
            return (
              <motion.div layout key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
                style={{ background: 'white', borderRadius: 28, padding: 28, border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', position: 'relative' }}>
                
                {/* Tier badge top-right */}
                <div style={{ position: 'absolute', top: 20, right: 20, padding: '4px 10px', borderRadius: 10, background: tier.bg, color: tier.color, fontSize: 11, fontWeight: 800 }}>
                  {tier.icon} {tier.label}
                </div>

                <div style={{ display: 'flex', alignItems: 'start', gap: 16, marginBottom: 20 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 18, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tier.color, fontWeight: 900, fontSize: 20, border: `2px solid ${tier.bg}`, flexShrink: 0 }}>
                    {c.name[0]}
                  </div>
                  <div style={{ flex: 1, paddingRight: 80 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{c.name}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginTop: 2 }}>ID: {c.id.slice(0, 8).toUpperCase()}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#64748b', fontWeight: 600 }}><Phone size={14} /> {c.phone}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#64748b', fontWeight: 600 }}><Mail size={14} /> {c.email || 'No email provided'}</div>
                  {c.address && <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#64748b', fontWeight: 600 }}><MapPin size={14} /> {c.address}</div>}
                </div>

                {/* Loyalty Points Bar */}
                <div style={{ background: '#f8fafc', borderRadius: 14, padding: '12px 16px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Star size={13} color="#f59e0b" fill="#f59e0b" />
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>{(c.loyaltyPoints || 0).toLocaleString()} pts</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>≈ ${((c.loyaltyPoints || 0) / 100).toFixed(2)} value</span>
                  </div>
                  <div style={{ height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: tier.color, borderRadius: 4, width: `${Math.min(((c.loyaltyPoints || 0) / 5000) * 100, 100)}%`, transition: 'width 0.6s ease' }} />
                  </div>
                </div>

                {/* Outstanding Balance */}
                {outstanding > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 12, background: '#fff1f2', marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <DollarSign size={13} /> Outstanding: ${outstanding.toFixed(2)}
                    </div>
                    <button onClick={() => { setSelectedCustomer(c); setShowPaymentModal(true); }}
                      style={{ padding: '4px 12px', borderRadius: 8, background: '#ef4444', color: 'white', border: 'none', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
                      Pay Now
                    </button>
                  </div>
                )}

                <div style={{ paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button onClick={() => handleOptions(c)} style={{ border: 'none', background: '#f8fafc', borderRadius: 8, padding: '6px 12px', fontWeight: 700, fontSize: 12, cursor: 'pointer', color: '#64748b' }}>
                    <MoreVertical size={14} style={{ display: 'inline', marginRight: 4 }} /> Options
                  </button>
                  <button onClick={async () => { setSelectedCustomer(c); await fetchHistory(c.id); setShowHistoryModal(true); }}
                    style={{ color: '#0a84ff', border: 'none', background: 'transparent', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    History <ArrowUpRight size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
          <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <div style={{ fontWeight: 700, fontSize: 18 }}>No customers found</div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }} style={{ background: 'white', borderRadius: 32, width: '100%', maxWidth: 450, position: 'relative', padding: 40, boxShadow: '0 40px 100px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
                <h2 style={{ fontSize: 24, fontWeight: 900 }}>{editingCustomer ? 'Edit Customer' : 'New Customer'}</h2>
                <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={24} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  { label: 'FULL NAME', field: 'name', placeholder: 'John Doe' },
                  { label: 'PHONE NUMBER', field: 'phone', placeholder: '+1 234 567 890' },
                  { label: 'EMAIL ADDRESS', field: 'email', placeholder: 'john@example.com' },
                  { label: 'STREET ADDRESS', field: 'address', placeholder: '123 Business Way...' },
                ].map(({ label, field, placeholder }) => (
                  <div key={field}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>{label}</label>
                    <input value={newCustomer[field]} onChange={e => setNewCustomer({...newCustomer, [field]: e.target.value})} placeholder={placeholder}
                      style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600 }} />
                  </div>
                ))}
                <button onClick={handleAddCustomer} style={{ marginTop: 12, padding: 18, borderRadius: 16, background: '#0a84ff', color: 'white', border: 'none', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                  <Save size={18} /> {editingCustomer ? 'Save Changes' : 'Register Customer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Outstanding Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedCustomer && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPaymentModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }} style={{ background: 'white', borderRadius: 32, width: '100%', maxWidth: 420, position: 'relative', padding: 40, boxShadow: '0 40px 100px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900 }}>Record Payment</h2>
                <button onClick={() => setShowPaymentModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={24} /></button>
              </div>
              <div style={{ background: '#fff1f2', borderRadius: 16, padding: 16, marginBottom: 24, fontSize: 14 }}>
                <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{selectedCustomer.name}</div>
                <div style={{ color: '#ef4444', fontWeight: 700 }}>Outstanding: ${parseFloat(selectedCustomer.outstandingBalance || 0).toFixed(2)}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>PAYMENT AMOUNT ($)</label>
                  <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="0.00"
                    style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 700, fontSize: 18 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>NOTE (OPTIONAL)</label>
                  <input value={paymentNote} onChange={e => setPaymentNote(e.target.value)} placeholder="Payment method, reference..."
                    style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600 }} />
                </div>
                <button onClick={handlePayOutstanding} disabled={paymentLoading}
                  style={{ padding: 18, borderRadius: 16, background: '#10b981', color: 'white', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 16 }}>
                  {paymentLoading ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {showHistoryModal && selectedCustomer && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHistoryModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }} style={{ background: 'white', borderRadius: 32, width: '90%', maxWidth: 560, position: 'relative', padding: 40, boxShadow: '0 40px 100px rgba(0,0,0,0.2)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>{selectedCustomer.name}</h2>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'flex', gap: 12 }}>
                    <span>🏆 {getTier(selectedCustomer.loyaltyPoints || 0).label}</span>
                    <span>⭐ {selectedCustomer.loyaltyPoints || 0} pts</span>
                    {parseFloat(selectedCustomer.outstandingBalance || 0) > 0 && (
                      <span style={{ color: '#ef4444' }}>💳 ${parseFloat(selectedCustomer.outstandingBalance).toFixed(2)} outstanding</span>
                    )}
                  </div>
                </div>
                <button onClick={() => setShowHistoryModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={24} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {historyLoading ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading...</div>
                ) : history.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontWeight: 700 }}>No purchase history yet.</div>
                ) : (
                  <div>
                    {/* Visual Purchase Trend Chart */}
                    <div style={{ background: '#f8fafc', padding: 20, borderRadius: 20, marginBottom: 24, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <TrendingUp size={16} color="#0a84ff" /> Purchase History Trend ($)
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 120, paddingBottom: 8, borderBottom: '1px dashed #cbd5e1', overflowX: 'auto' }}>
                        {history.slice(0, 15).reverse().map((h, i) => {
                          const maxVal = Math.max(...history.map(x => parseFloat(x.grandTotal || 0)), 1);
                          const val = parseFloat(h.grandTotal || 0);
                          const heightPct = Math.max((val / maxVal) * 100, 10);
                          return (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 28, gap: 6 }}>
                              <span style={{ fontSize: 10, fontWeight: 800, color: '#0a84ff' }}>${val.toFixed(0)}</span>
                              <div 
                                title={`$${val.toFixed(2)} on ${new Date(h.createdAt).toLocaleDateString()}`}
                                style={{ 
                                  width: '100%', 
                                  height: `${heightPct}%`, 
                                  background: 'linear-gradient(180deg, #0a84ff, #60a5fa)', 
                                  borderRadius: '6px 6px 2px 2px',
                                  transition: 'height 0.4s ease'
                                }} 
                              />
                              <span style={{ fontSize: 9, fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                {new Date(h.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {history.map((item, idx) => (
                        <div key={idx} style={{ padding: '16px 20px', borderRadius: 16, background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>Sale #{item.id?.slice(0, 8).toUpperCase()}</div>
                            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginTop: 2 }}>{new Date(item.createdAt).toLocaleDateString()} · {item.paymentMethod}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 900, fontSize: 16, color: '#0f172a' }}>${parseFloat(item.grandTotal).toFixed(2)}</div>
                            {item.discount > 0 && <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>-${item.discount} off</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Customers;
