import React, { useState, useEffect } from 'react';
import { 
  Calendar, Briefcase, Plus, CheckCircle, XCircle, 
  Clock, FileText, Send, PieChart, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { leaveAPI } from '../api';

const Leaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ type: 'casual', startDate: '', endDate: '', reason: '' });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); // Live polling every 3s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [myRes, pendingRes] = await Promise.all([
        leaveAPI.getMy(),
        leaveAPI.getPending()
      ]);
      setLeaves(myRes.data);
      setPendingLeaves(pendingRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await leaveAPI.apply(formData);
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert('Failed to apply for leave');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await leaveAPI.updateStatus(id, status);
      fetchData();
    } catch (err) {
      alert('Failed to update leave status');
    }
  };

  const BalanceCard = ({ title, used, total, color }) => (
    <div style={{ background: 'white', padding: 28, borderRadius: 28, border: '1px solid rgba(0,0,0,0.05)', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#64748b' }}>{title}</div>
        <div style={{ padding: '6px 12px', borderRadius: 12, background: `${color}15`, color: color, fontSize: 12, fontWeight: 800 }}>
          {total - used} Left
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', marginBottom: 16 }}>{used} / {total}</div>
      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${(used / total) * 100}%`, height: '100%', background: color }} />
      </div>
    </div>
  );

  return (
    <div style={{ padding: 40, minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>Leave Management</h1>
          <p style={{ color: '#64748b', fontWeight: 600 }}>Request time off and track your leave balances.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          style={{ padding: '14px 28px', borderRadius: 16, background: '#0f172a', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <Plus size={20} /> Request Leave
        </button>
      </header>

      <div style={{ display: 'flex', gap: 24, marginBottom: 40 }}>
        <BalanceCard title="Annual Leave" used={12} total={24} color="#0a84ff" />
        <BalanceCard title="Medical Leave" used={3} total={10} color="#10b981" />
        <BalanceCard title="Casual Leave" used={4} total={8} color="#f59e0b" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32 }}>
        {/* My Leaves */}
        <div style={{ background: 'white', padding: 32, borderRadius: 32, border: '1px solid rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 24 }}>My Leave History</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {leaves.map(l => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px', borderRadius: 24, background: '#f8fafc' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                  <Calendar size={24} color="#0a84ff" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{l.type.toUpperCase()} LEAVE</div>
                  <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{l.startDate} to {l.endDate} ({l.days} days)</div>
                </div>
                <div style={{ 
                  padding: '8px 16px', borderRadius: 12, fontSize: 12, fontWeight: 800,
                  background: l.status === 'approved' ? '#dcfce7' : (l.status === 'rejected' ? '#fee2e2' : '#fef3c7'),
                  color: l.status === 'approved' ? '#10b981' : (l.status === 'rejected' ? '#ef4444' : '#d97706')
                }}>
                  {l.status.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Manager Approval Queue */}
        <div style={{ background: 'white', padding: 32, borderRadius: 32, border: '1px solid rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 24 }}>Approval Queue</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {pendingLeaves.map(l => (
              <div key={l.id} style={{ padding: 20, borderRadius: 24, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                    {l.Employee?.User?.name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{l.Employee?.User?.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{l.type.toUpperCase()} • {l.days} days</div>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 1.5 }}>"{l.reason}"</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleStatusUpdate(l.id, 'approved')} style={{ flex: 1, padding: '10px', borderRadius: 12, background: '#10b981', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 12 }}>Approve</button>
                  <button onClick={() => handleStatusUpdate(l.id, 'rejected')} style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'white', color: '#ef4444', border: '1px solid #fee2e2', fontWeight: 800, cursor: 'pointer', fontSize: 12 }}>Reject</button>
                </div>
              </div>
            ))}
            {pendingLeaves.length === 0 && <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No pending requests.</p>}
          </div>
        </div>
      </div>

      {/* Request Modal (Simplified) */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'white', padding: 40, borderRadius: 32, width: 450 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 24 }}>New Leave Request</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>LEAVE TYPE</label>
                <select 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600 }}
                >
                  <option value="casual">Casual</option>
                  <option value="medical">Medical</option>
                  <option value="annual">Annual</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>START DATE</label>
                  <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0' }} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>END DATE</label>
                  <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0' }} required />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>REASON</label>
                <textarea value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', height: 100 }} required placeholder="Briefly explain your request..." />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '16px', borderRadius: 16, background: '#f1f5f9', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '16px', borderRadius: 16, background: '#0f172a', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Submit Request</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Leaves;
