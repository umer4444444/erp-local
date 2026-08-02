import React, { useState, useEffect } from 'react';
import { 
  Calendar, Briefcase, Plus, CheckCircle, XCircle, 
  Clock, FileText, Send, PieChart, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { leaveAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const Leaves = () => {
  const { user } = useAuth();
  const canApproveLeaves = user && ['admin', 'manager', 'hr'].includes(user.role);
  const [leaves, setLeaves] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ type: 'casual', startDate: '', endDate: '', reason: '' });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); // Live polling every 3s
    return () => clearInterval(interval);
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const requests = [leaveAPI.getMy(), leaveAPI.getMyBalance().catch(() => ({ data: [] }))];
      if (canApproveLeaves) {
        requests.push(leaveAPI.getPending().catch(err => ({ data: [] })));
      }

      const [myRes, balanceRes, pendingRes] = await Promise.all(requests);
      setLeaves(myRes.data);
      setLeaveBalance(balanceRes.data || []);
      setPendingLeaves(pendingRes?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      alert("Invalid date range: End Date cannot be before Start Date.");
      return;
    }
    try {
      await leaveAPI.apply(formData);
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to apply for leave');
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const handleStatusUpdate = async (id, status) => {
    if (!canApproveLeaves) return;
    const leave = pendingLeaves.find(l => l.id === id);
    if (leave && leave.Employee?.User?.email === user?.email) {
      alert('Self-approval is not permitted. A secondary approver is required.');
      return;
    }
    try {
      await leaveAPI.updateStatus(id, status);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update leave status');
    }
  };

  const handleWithdraw = async (id) => {
    if (!window.confirm('Withdraw this leave request?')) return;
    try {
      await leaveAPI.updateStatus(id, 'withdrawn');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to withdraw leave.');
    }
  };

  const BalanceCard = ({ title, used, total, color }) => (
    <div style={{ background: 'var(--bg-panel)', padding: 28, borderRadius: 28, border: '1px solid var(--border-color-rgb)', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)' }}>{title}</div>
        <div style={{ padding: '6px 12px', borderRadius: 12, background: `${color}15`, color: color, fontSize: 12, fontWeight: 800 }}>
          {total - used} Left
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-main)', marginBottom: 16 }}>{used} / {total}</div>
      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${(used / total) * 100}%`, height: '100%', background: color }} />
      </div>
    </div>
  );

  return (
    <div style={{ padding: 40, minHeight: '100vh', background: 'var(--bg-main)', fontFamily: "'Outfit', sans-serif" }}>
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-main)' }}>Leave Management</h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Request time off and track your leave balances.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          style={{ padding: '14px 28px', borderRadius: 16, background: 'var(--text-main)', color: 'var(--bg-panel)', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <Plus size={20} /> Request Leave
        </button>
      </header>

      <div style={{ display: 'flex', gap: 24, marginBottom: 40 }}>
        {[
          { title: 'Annual Leave', type: 'annual', color: '#0a84ff', total: 24 },
          { title: 'Medical Leave', type: 'medical', color: '#10b981', total: 10 },
          { title: 'Casual Leave', type: 'casual', color: '#f59e0b', total: 8 },
        ].map(({ title, type, color, total }) => {
          const bal = leaveBalance.find(b => b.type === type);
          const used = bal ? parseFloat(bal.used) : 0;
          const totalDays = bal ? parseFloat(bal.total || total) : total;
          return (
            <BalanceCard key={type} title={title} used={used} total={totalDays} color={color} />
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32 }}>
        {/* My Leaves */}
        <div style={{ background: 'var(--bg-panel)', padding: 32, borderRadius: 32, border: '1px solid var(--border-color-rgb)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-main)', marginBottom: 24 }}>My Leave History</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {leaves.map(l => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 20, padding: '20px 24px', borderRadius: 24, background: 'var(--bg-main)' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                  <Calendar size={24} color="#0a84ff" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{l.type.toUpperCase()} LEAVE</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{fmtDate(l.startDate)} → {fmtDate(l.endDate)} ({l.days} days)</div>
                  {l.reason && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 4 }}>"{l.reason}"</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <div style={{ 
                    padding: '8px 16px', borderRadius: 12, fontSize: 12, fontWeight: 800,
                    background: l.status === 'approved' ? '#dcfce7' : l.status === 'rejected' ? '#fee2e2' : l.status === 'withdrawn' ? '#f1f5f9' : '#fef3c7',
                    color: l.status === 'approved' ? '#10b981' : l.status === 'rejected' ? '#ef4444' : l.status === 'withdrawn' ? 'var(--text-muted)' : '#d97706'
                  }}>
                    {l.status.toUpperCase()}
                  </div>
                  {l.status === 'pending' && (
                    <button onClick={() => handleWithdraw(l.id)} style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', background: 'none', border: '1px solid #fecaca', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {canApproveLeaves ? (
          <div style={{ background: 'var(--bg-panel)', padding: 32, borderRadius: 32, border: '1px solid var(--border-color-rgb)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-main)', marginBottom: 24 }}>Approval Queue</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {pendingLeaves.map(l => {
              const isSelf = l.Employee?.User?.email === user?.email;
              return (
              <div key={l.id} style={{ padding: 20, borderRadius: 24, background: 'var(--bg-main)', border: isSelf ? '1.5px solid #fde68a' : '1px solid #e2e8f0' }}>
                {isSelf && <div style={{ fontSize: 11, fontWeight: 800, color: '#d97706', marginBottom: 8, padding: '4px 10px', background: '#fef3c7', borderRadius: 8, display: 'inline-block' }}>⚠ Your own request</div>}
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--text-main)', color: 'var(--bg-panel)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                    {l.Employee?.User?.name?.[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{l.Employee?.User?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.type.toUpperCase()} • {l.days} days • {fmtDate(l.startDate)} → {fmtDate(l.endDate)}</div>
                  </div>
                </div>
                {l.reason && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>"{l.reason}"</p>}
                <div style={{ display: 'flex', gap: 8 }}>
                  {isSelf ? (
                    <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: '#f1f5f9', color: 'var(--text-muted)', textAlign: 'center', fontWeight: 700, fontSize: 12 }}>⛔ Cannot self-approve</div>
                  ) : (
                    <>
                      <button onClick={() => handleStatusUpdate(l.id, 'approved')} style={{ flex: 1, padding: '10px', borderRadius: 12, background: '#10b981', color: 'var(--bg-panel)', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 12 }}>Approve</button>
                      <button onClick={() => handleStatusUpdate(l.id, 'rejected')} style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'var(--bg-panel)', color: '#ef4444', border: '1px solid #fee2e2', fontWeight: 800, cursor: 'pointer', fontSize: 12 }}>Reject</button>
                    </>
                  )}
                </div>
              </div>
              );
            })}
            {pendingLeaves.length === 0 && <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No pending requests.</p>}
          </div>
        </div>
        ) : (
          <div style={{ background: 'var(--bg-panel)', padding: 32, borderRadius: 32, border: '1px solid var(--border-color-rgb)', color: '#334155' }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-main)', marginBottom: 18 }}>Approval Queue</h2>
            <p style={{ lineHeight: 1.7, color: 'var(--text-muted)' }}>
              You do not have permission to view or act on pending leave approvals. This section is reserved for HR, managers, and admin users.
            </p>
          </div>
        )}
      </div>

      {/* Request Modal (Simplified) */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'var(--bg-panel)', padding: 40, borderRadius: 32, width: 450 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 24 }}>New Leave Request</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8 }}>LEAVE TYPE</label>
                <select 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600 }}
                >
                  <option value="casual">Casual</option>
                  <option value="medical">Medical</option>
                  <option value="annual">Annual</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8 }}>START DATE</label>
                  <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0' }} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8 }}>END DATE</label>
                  <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0' }} required />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8 }}>REASON</label>
                <textarea value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', height: 100 }} required placeholder="Briefly explain your request..." />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '16px', borderRadius: 16, background: '#f1f5f9', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '16px', borderRadius: 16, background: 'var(--text-main)', color: 'var(--bg-panel)', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Submit Request</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Leaves;
