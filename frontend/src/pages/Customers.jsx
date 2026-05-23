import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Phone, Mail, 
  MapPin, Clock, ArrowUpRight, Filter, 
  MoreVertical, X, Save, ShieldCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { customerAPI } from '../api';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', address: '' });
  // State for edit/delete and history modal
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleOptions = async (customer) => {
    const action = window.prompt('Enter "edit" to edit or "delete" to delete the customer');
    if (!action) return;
    if (action.toLowerCase() === 'edit') {
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
    const interval = setInterval(fetchCustomers, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) return alert('Name and Phone are required');
    try {
      await customerAPI.create(newCustomer);
      setShowModal(false);
      setNewCustomer({ name: '', email: '', phone: '', address: '' });
      fetchCustomers();
    } catch (err) {
      alert('Failed to add customer');
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


  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search) || 
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 40, minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            <input 
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, phone..." 
              style={{ padding: '12px 12px 12px 44px', borderRadius: 14, border: '1px solid #e2e8f0', width: 280, fontWeight: 600 }}
            />
          </div>
          <button onClick={() => setShowModal(true)} style={{ padding: '12px 24px', borderRadius: 14, background: '#0f172a', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserPlus size={18} /> Add Customer
          </button>
        </div>
      </header>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
        <AnimatePresence>
          {filtered.map((c, index) => (
            <motion.div 
              layout
              key={c.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              style={{ background: 'white', borderRadius: 28, padding: 28, border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', position: 'relative' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: 18, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a84ff', fontWeight: 900, fontSize: 20 }}>
                  {c.name[0]}
                </div>
                <button onClick={() => handleOptions(c)} style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}><MoreVertical size={20} /></button>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{c.name}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                   ID: {c.id.slice(0,8).toUpperCase()}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#64748b', fontWeight: 600 }}>
                  <Phone size={16} /> {c.phone}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#64748b', fontWeight: 600 }}>
                  <Mail size={16} /> {c.email || 'No email provided'}
                </div>
                {c.address && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#64748b', fontWeight: 600 }}>
                    <MapPin size={16} /> {c.address}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#10b981', background: '#f0fdf4', padding: '4px 10px', borderRadius: 8 }}>Active Client</div>
                <button onClick={async () => {
                  setSelectedCustomer(c);
                  await fetchHistory(c.id);
                  setShowHistoryModal(true);
                }} style={{ color: '#0a84ff', border: 'none', background: 'transparent', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  History <ArrowUpRight size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }} style={{ background: 'white', borderRadius: 32, width: '100%', maxWidth: 450, position: 'relative', padding: 40, boxShadow: '0 40px 100px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
                <h2 style={{ fontSize: 24, fontWeight: 900 }}>New Customer</h2>
                <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={24} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>FULL NAME</label>
                  <input value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} placeholder="John Doe" style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>PHONE NUMBER</label>
                  <input value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} placeholder="+1 234 567 890" style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>EMAIL ADDRESS</label>
                  <input value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} placeholder="john@example.com" style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>STREET ADDRESS</label>
                  <input value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} placeholder="123 Business Way..." style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600 }} />
                </div>
                <button onClick={handleAddCustomer} style={{ marginTop: 12, padding: 18, borderRadius: 16, background: '#0a84ff', color: 'white', border: 'none', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                  <Save size={18} /> Register Customer
                </button>
              </div>
            </motion.div>
          </div>
        )}
            {/* History Modal */}
      {showHistoryModal && selectedCustomer && (
        <AnimatePresence>
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHistoryModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }} style={{ background: 'white', borderRadius: 32, width: '90%', maxWidth: 500, position: 'relative', padding: 40, boxShadow: '0 40px 100px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
                <h2 style={{ fontSize: 24, fontWeight: 900 }}>History for {selectedCustomer.name}</h2>
                <button onClick={() => setShowHistoryModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={24} /></button>
              </div>
              {historyLoading ? (
                <p>Loading...</p>
              ) : (
                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  {history.length === 0 ? (
                    <p>No history available.</p>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {history.map((item, idx) => (
                        <li key={idx} style={{ padding: '12px 0', borderBottom: '1px solid #e5e7eb' }}>
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(item, null, 2)}</pre>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </AnimatePresence>
      )}
      </AnimatePresence>
    </div>
  );
};

export default Customers;
