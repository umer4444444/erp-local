import React, { useState, useEffect } from 'react';
import {
  Truck, MapPin, Package, CheckCircle, Clock, User, Phone,
  Search, RefreshCw, Navigation, AlertCircle, ArrowRight,
  Filter, X, Plus, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';

const STATUS_CONFIG = {
  pending:    { color: '#f59e0b', bg: '#fffbeb', label: 'Pending',     icon: '🕐' },
  assigned:   { color: '#0a84ff', bg: '#eff6ff', label: 'Assigned',    icon: '📋' },
  picked_up:  { color: '#8b5cf6', bg: '#f5f3ff', label: 'Picked Up',   icon: '📦' },
  in_transit: { color: '#f97316', bg: '#fff7ed', label: 'In Transit',  icon: '🚚' },
  delivered:  { color: '#10b981', bg: '#dcfce7', label: 'Delivered',   icon: '✅' },
  failed:     { color: '#ef4444', bg: '#fee2e2', label: 'Failed',      icon: '❌' },
};

const Delivery = () => {
  const [rides, setRides] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [assignDriverId, setAssignDriverId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [newRide, setNewRide] = useState({
    customerName: '', customerPhone: '', deliveryAddress: '', notes: '', priority: 'normal'
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [ridesRes, driversRes] = await Promise.all([
        API.get('/rides/all'),
        API.get('/rides/drivers'),
      ]);
      setRides(ridesRes.data || []);
      setDrivers(driversRes.data || []);
    } catch (err) {
      console.error('Failed to fetch delivery data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!assignDriverId) return alert('Select a driver');
    setAssigning(true);
    try {
      await API.put(`/rides/${selectedRide.id}/assign`, { driverId: assignDriverId });
      setShowAssignModal(false);
      setSelectedRide(null);
      setAssignDriverId('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusUpdate = async (rideId, status) => {
    try {
      await API.put(`/rides/${rideId}/status`, { status });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleCreateRide = async () => {
    if (!newRide.customerName || !newRide.deliveryAddress) return alert('Customer name and address are required');
    setCreating(true);
    try {
      await API.post('/rides', newRide);
      setShowCreateModal(false);
      setNewRide({ customerName: '', customerPhone: '', deliveryAddress: '', notes: '', priority: 'normal' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create delivery');
    } finally {
      setCreating(false);
    }
  };

  const filtered = rides.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = r.customerName?.toLowerCase().includes(q) || r.deliveryAddress?.toLowerCase().includes(q);
    const matchStatus = statusFilter ? r.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: rides.length,
    pending: rides.filter(r => r.status === 'pending').length,
    inTransit: rides.filter(r => r.status === 'in_transit').length,
    delivered: rides.filter(r => r.status === 'delivered').length,
  };

  const NEXT_STATUSES = {
    pending:    ['assigned'],
    assigned:   ['picked_up', 'failed'],
    picked_up:  ['in_transit'],
    in_transit: ['delivered', 'failed'],
    delivered:  [],
    failed:     ['pending'],
  };

  return (
    <div style={{ padding: 40, minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
      <header style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#0a84ff', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Truck size={18} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Logistics Operations</span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>Delivery Dispatcher</h1>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search deliveries..."
                style={{ padding: '12px 12px 12px 40px', borderRadius: 14, border: '1px solid #e2e8f0', width: 240, fontWeight: 600 }} />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '12px 16px', borderRadius: 14, border: '1px solid #e2e8f0', fontWeight: 700, background: 'white', cursor: 'pointer' }}>
              <option value="">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
            <button onClick={fetchData} style={{ padding: '12px', borderRadius: 14, background: 'white', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RefreshCw size={18} color="#64748b" />
            </button>
            <button onClick={() => setShowCreateModal(true)}
              style={{ padding: '12px 24px', borderRadius: 14, background: '#0f172a', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={18} /> New Delivery
            </button>
          </div>
        </div>

        {/* KPI Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { label: 'Total Orders', value: stats.total, color: '#0a84ff', bg: '#eff6ff', icon: <Package size={18} /> },
            { label: 'Pending Pickup', value: stats.pending, color: '#f59e0b', bg: '#fffbeb', icon: <Clock size={18} /> },
            { label: 'In Transit', value: stats.inTransit, color: '#f97316', bg: '#fff7ed', icon: <Truck size={18} /> },
            { label: 'Delivered Today', value: stats.delivered, color: '#10b981', bg: '#dcfce7', icon: <CheckCircle size={18} /> },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: 20, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, border: '1px solid rgba(0,0,0,0.04)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* Delivery Board (Kanban-style) */}
      {statusFilter === '' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {['pending', 'in_transit', 'delivered'].map(col => {
            const colRides = rides.filter(r => {
              if (col === 'pending') return ['pending', 'assigned', 'picked_up'].includes(r.status);
              return r.status === col;
            });
            const cfg = col === 'pending' ? STATUS_CONFIG.pending : STATUS_CONFIG[col];
            return (
              <div key={col} style={{ background: 'white', borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>
                    {cfg.icon} {col === 'pending' ? 'Queue' : cfg.label}
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 800 }}>
                    {colRides.length}
                  </span>
                </div>
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 600, overflowY: 'auto' }}>
                  {colRides.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>No orders</div>
                  )}
                  {colRides.map(ride => {
                    const s = STATUS_CONFIG[ride.status];
                    return (
                      <motion.div key={ride.id} whileHover={{ y: -2 }}
                        style={{ padding: 16, borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 10 }}>
                          <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{ride.customerName}</div>
                          <span style={{ padding: '3px 8px', borderRadius: 8, background: s.bg, color: s.color, fontSize: 10, fontWeight: 800 }}>
                            {s.icon} {s.label}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>
                          <MapPin size={11} /> {ride.deliveryAddress}
                        </div>
                        {ride.customerPhone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 10 }}>
                            <Phone size={11} /> {ride.customerPhone}
                          </div>
                        )}
                        {ride.Driver && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#0a84ff', fontWeight: 700, marginBottom: 10 }}>
                            <User size={11} /> {ride.Driver?.name || 'Driver assigned'}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {ride.status === 'pending' && (
                            <button onClick={() => { setSelectedRide(ride); setShowAssignModal(true); }}
                              style={{ flex: 1, padding: '8px', borderRadius: 10, background: '#0a84ff', color: 'white', border: 'none', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
                              Assign Driver
                            </button>
                          )}
                          {NEXT_STATUSES[ride.status]?.map(next => (
                            <button key={next} onClick={() => handleStatusUpdate(ride.id, next)}
                              style={{ flex: 1, padding: '8px', borderRadius: 10, background: STATUS_CONFIG[next]?.bg, color: STATUS_CONFIG[next]?.color, border: `1px solid ${STATUS_CONFIG[next]?.color}20`, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
                              → {STATUS_CONFIG[next]?.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List view for filtered */
        <div style={{ background: 'white', borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                {['Customer', 'Address', 'Driver', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '18px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(ride => {
                const s = STATUS_CONFIG[ride.status];
                return (
                  <tr key={ride.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 800, color: '#0f172a', fontSize: 14 }}>{ride.customerName}</td>
                    <td style={{ padding: '14px 20px', color: '#64748b', fontWeight: 600, fontSize: 13 }}>{ride.deliveryAddress}</td>
                    <td style={{ padding: '14px 20px', color: '#0a84ff', fontWeight: 700, fontSize: 13 }}>{ride.Driver?.name || '—'}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 8, background: s.bg, color: s.color, fontSize: 11, fontWeight: 800 }}>
                        {s.icon} {s.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#94a3b8', fontWeight: 600, fontSize: 12 }}>
                      {new Date(ride.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {ride.status === 'pending' && (
                          <button onClick={() => { setSelectedRide(ride); setShowAssignModal(true); }}
                            style={{ padding: '6px 12px', borderRadius: 8, background: '#eff6ff', color: '#0a84ff', border: 'none', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
                            Assign
                          </button>
                        )}
                        {NEXT_STATUSES[ride.status]?.slice(0, 1).map(next => (
                          <button key={next} onClick={() => handleStatusUpdate(ride.id, next)}
                            style={{ padding: '6px 12px', borderRadius: 8, background: STATUS_CONFIG[next]?.bg, color: STATUS_CONFIG[next]?.color, border: 'none', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
                            {STATUS_CONFIG[next]?.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
              <Truck size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <div style={{ fontWeight: 700 }}>No deliveries found</div>
            </div>
          )}
        </div>
      )}

      {/* Assign Driver Modal */}
      <AnimatePresence>
        {showAssignModal && selectedRide && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAssignModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              style={{ background: 'white', borderRadius: 32, width: '100%', maxWidth: 440, position: 'relative', padding: 40, boxShadow: '0 40px 100px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900 }}>Assign Driver</h2>
                <button onClick={() => setShowAssignModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={24} /></button>
              </div>
              <div style={{ background: '#f8fafc', borderRadius: 16, padding: 16, marginBottom: 24 }}>
                <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{selectedRide.customerName}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                  <MapPin size={12} /> {selectedRide.deliveryAddress}
                </div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 10 }}>SELECT DRIVER</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 280, overflowY: 'auto' }}>
                  {drivers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontWeight: 700 }}>No available drivers</div>
                  )}
                  {drivers.map(d => (
                    <div key={d.id} onClick={() => setAssignDriverId(d.id)}
                      style={{ padding: '14px 18px', borderRadius: 16, border: `2px solid ${assignDriverId === d.id ? '#0a84ff' : '#e2e8f0'}`,
                        background: assignDriverId === d.id ? '#eff6ff' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: assignDriverId === d.id ? '#0a84ff' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: assignDriverId === d.id ? 'white' : '#64748b', fontWeight: 900 }}>
                        {d.name?.[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>{d.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{d.phone || d.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={handleAssign} disabled={assigning || !assignDriverId}
                style={{ width: '100%', padding: 18, borderRadius: 16, background: '#0a84ff', color: 'white', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 16 }}>
                {assigning ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Delivery Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              style={{ background: 'white', borderRadius: 32, width: '100%', maxWidth: 460, position: 'relative', padding: 40, boxShadow: '0 40px 100px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900 }}>New Delivery Order</h2>
                <button onClick={() => setShowCreateModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={24} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {[
                  { label: 'CUSTOMER NAME', field: 'customerName', placeholder: 'John Doe' },
                  { label: 'PHONE NUMBER', field: 'customerPhone', placeholder: '+92 300 1234567' },
                  { label: 'DELIVERY ADDRESS', field: 'deliveryAddress', placeholder: '123 Main St, City' },
                  { label: 'NOTES', field: 'notes', placeholder: 'Special instructions...' },
                ].map(({ label, field, placeholder }) => (
                  <div key={field}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>{label}</label>
                    <input value={newRide[field]} onChange={e => setNewRide({...newRide, [field]: e.target.value})} placeholder={placeholder}
                      style={{ width: '100%', padding: '13px 16px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600, fontSize: 14 }} />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>PRIORITY</label>
                  <select value={newRide.priority} onChange={e => setNewRide({...newRide, priority: e.target.value})}
                    style={{ width: '100%', padding: '13px 16px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 700, background: 'white' }}>
                    <option value="normal">Normal</option>
                    <option value="urgent">🔴 Urgent</option>
                    <option value="high">⚡ Express</option>
                  </select>
                </div>
                <button onClick={handleCreateRide} disabled={creating}
                  style={{ marginTop: 8, padding: 18, borderRadius: 16, background: '#0f172a', color: 'white', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 16 }}>
                  {creating ? 'Creating...' : '🚚 Create Delivery Order'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Delivery;
