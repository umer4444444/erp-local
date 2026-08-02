import React, { useState, useEffect, useRef } from 'react';
import {
  Truck, MapPin, Package, CheckCircle, Clock, User, Phone,
  Search, RefreshCw, Navigation, AlertCircle, ArrowRight,
  Filter, X, Plus, ChevronDown, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SignatureCanvas from 'react-signature-canvas';
import API from '../api';

const STATUS_CONFIG = {
  PENDING:    { color: '#f59e0b', bg: '#fffbeb', label: 'Pending',     icon: '🕐' },
  DISPATCHED: { color: '#0a84ff', bg: '#eff6ff', label: 'Dispatched',  icon: '🚚' },
  DELIVERED:  { color: '#10b981', bg: '#dcfce7', label: 'Delivered',   icon: '✅' },
  FAILED:     { color: '#ef4444', bg: '#fee2e2', label: 'Failed',      icon: '❌' },
};

const Delivery = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Proof state
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [submittingProof, setSubmittingProof] = useState(false);
  const sigPad = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await API.get('/deliveries');
      setDeliveries(res.data || []);
    } catch (err) {
      console.error('Failed to fetch delivery data', err);
    } finally {
      setLoading(false);
    }
  };

  const getCoordinates = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve({ lat: null, lng: null });
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => {
          console.warn('GPS Error:', err.message);
          resolve({ lat: null, lng: null });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  };

  const submitProof = async () => {
    if (sigPad.current.isEmpty()) return alert('Please provide a signature');
    setSubmittingProof(true);
    try {
      const signatureUrl = sigPad.current.getTrimmedCanvas().toDataURL('image/png');
      const { lat, lng } = await getCoordinates();

      await API.post(`/deliveries/${selectedDelivery.id}/proof`, {
        signatureUrl,
        latitude: lat,
        longitude: lng,
        photoUrl: '' // Future photo upload
      });

      setShowProofModal(false);
      setSelectedDelivery(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Proof submission failed');
    } finally {
      setSubmittingProof(false);
    }
  };

  const filtered = deliveries.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = d.Sale?.Customer?.shopName?.toLowerCase().includes(q);
    const matchStatus = statusFilter ? d.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: deliveries.length,
    pending: deliveries.filter(d => d.status === 'PENDING').length,
    dispatched: deliveries.filter(d => d.status === 'DISPATCHED').length,
    delivered: deliveries.filter(d => d.status === 'DELIVERED').length,
  };

  return (
    <div style={{ padding: 40, minHeight: '100vh', background: 'var(--bg-main)', fontFamily: "'Outfit', sans-serif" }}>
      <header style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#0a84ff', color: 'var(--bg-panel)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Truck size={18} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Field Sales Logistics</span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-main)' }}>Delivery Dispatcher</h1>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..."
                style={{ padding: '12px 12px 12px 40px', borderRadius: 14, border: '1px solid #e2e8f0', width: 240, fontWeight: 600 }} />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '12px 16px', borderRadius: 14, border: '1px solid #e2e8f0', fontWeight: 700, background: 'var(--bg-panel)', cursor: 'pointer' }}>
              <option value="">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
            <button onClick={fetchData} style={{ padding: '12px', borderRadius: 14, background: 'var(--bg-panel)', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RefreshCw size={18} color='var(--text-muted)' />
            </button>
          </div>
        </div>

        {/* KPI Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { label: 'Total Orders', value: stats.total, color: '#0a84ff', bg: '#eff6ff', icon: <Package size={18} /> },
            { label: 'Pending Queue', value: stats.pending, color: '#f59e0b', bg: '#fffbeb', icon: <Clock size={18} /> },
            { label: 'In Transit', value: stats.dispatched, color: '#f97316', bg: '#fff7ed', icon: <Truck size={18} /> },
            { label: 'Delivered', value: stats.delivered, color: '#10b981', bg: '#dcfce7', icon: <CheckCircle size={18} /> },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-panel)', borderRadius: 20, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, border: '1px solid var(--border-color-rgb)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-main)' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* List view for deliveries */}
      <div style={{ background: 'var(--bg-panel)', borderRadius: 24, overflow: 'hidden', border: '1px solid var(--border-color-rgb)' }}>
        <div className="w-full overflow-x-auto"><table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid #f1f5f9' }}>
              {['Customer', 'Address', 'Status', 'Created', 'Actions'].map(h => (
                <th key={h} style={{ padding: '18px 20px', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(delivery => {
              const s = STATUS_CONFIG[delivery.status];
              const customer = delivery.Sale?.Customer || {};
              return (
                <tr key={delivery.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 800, color: 'var(--text-main)', fontSize: 14 }}>{customer.shopName || 'Walk-in Customer'}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 13 }}>
                    <MapPin size={12} style={{ display: 'inline', marginRight: 4 }}/> 
                    {customer.address || 'Unknown'}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 8, background: s.bg, color: s.color, fontSize: 11, fontWeight: 800 }}>
                      {s.icon} {s.label}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 12 }}>
                    {new Date(delivery.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {delivery.status !== 'DELIVERED' ? (
                        <button onClick={() => { setSelectedDelivery(delivery); setShowProofModal(true); }}
                          style={{ padding: '6px 12px', borderRadius: 8, background: '#10b981', color: 'var(--bg-panel)', border: 'none', fontWeight: 800, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircle size={12} /> Mark Delivered
                        </button>
                      ) : (
                        <span style={{ color: '#10b981', fontWeight: 800, fontSize: 11 }}>
                          Completed
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <Truck size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <div style={{ fontWeight: 700 }}>No deliveries found</div>
          </div>
        )}
      </div>

      {/* Complete Delivery Proof Modal */}
      <AnimatePresence>
        {showProofModal && selectedDelivery && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProofModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              style={{ background: 'var(--bg-panel)', borderRadius: 32, width: '100%', maxWidth: 460, position: 'relative', padding: 40, boxShadow: '0 40px 100px var(--shadow-strong-rgb)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900 }}>Proof of Delivery</h2>
                <button onClick={() => setShowProofModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={24} /></button>
              </div>
              <div style={{ background: 'var(--bg-main)', borderRadius: 16, padding: 16, marginBottom: 24 }}>
                <div style={{ fontWeight: 800, color: 'var(--text-main)', marginBottom: 4 }}>{selectedDelivery.Sale?.Customer?.shopName || 'Customer'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                  <MapPin size={12} /> {selectedDelivery.Sale?.Customer?.address || 'Unknown'}
                </div>
              </div>
              
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 10 }}>CUSTOMER SIGNATURE</label>
                <div style={{ border: '2px dashed #cbd5e1', borderRadius: 16, background: 'var(--bg-main)', overflow: 'hidden' }}>
                  <SignatureCanvas 
                    ref={sigPad}
                    penColor="black"
                    canvasProps={{ width: 380, height: 200, className: 'sigCanvas' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button onClick={() => sigPad.current.clear()} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                    Clear Signature
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <button style={{ width: '100%', padding: '16px', borderRadius: 16, background: '#f1f5f9', color: '#475569', border: '1px dashed #cbd5e1', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
                  <Camera size={18} /> Capture Delivery Photo
                </button>
              </div>

              <button onClick={submitProof} disabled={submittingProof}
                style={{ width: '100%', padding: 18, borderRadius: 16, background: '#10b981', color: 'var(--bg-panel)', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 16 }}>
                {submittingProof ? 'Saving...' : 'Confirm Delivery'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Delivery;
