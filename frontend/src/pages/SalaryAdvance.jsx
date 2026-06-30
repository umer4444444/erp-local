import React, { useState, useEffect } from 'react';
import {
  CreditCard, DollarSign, Clock, CheckCircle, XCircle,
  Send, AlertCircle, ThumbsUp, ThumbsDown, ShieldCheck,
  RefreshCw, FileText, TrendingDown, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { advanceAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const fmtMoney = (n) => `PKR ${parseFloat(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_MAP = {
  pending:  { color: '#f59e0b', bg: '#fef3c718', label: 'Pending',  icon: <Clock size={13} /> },
  approved: { color: '#10b981', bg: '#dcfce718', label: 'Approved', icon: <CheckCircle size={13} /> },
  rejected: { color: '#ef4444', bg: '#fee2e218', label: 'Rejected', icon: <XCircle size={13} /> },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || STATUS_MAP.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 800, padding: '5px 12px', borderRadius: 10,
      background: s.bg, color: s.color, border: `1px solid ${s.color}30`
    }}>
      {s.icon} {s.label}
    </span>
  );
};

const SalaryAdvancePage = () => {
  const { user } = useAuth();
  const isHR = user && ['admin', 'hr'].includes(user.role);

  const [myAdvances, setMyAdvances]       = useState([]);
  const [allAdvances, setAllAdvances]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [allLoading, setAllLoading]       = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [activeTab, setActiveTab]         = useState('my');

  const [form, setForm] = useState({
    amount: '',
    deductionMonths: '1',
    reason: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchMyAdvances();
  }, []);

  useEffect(() => {
    if (isHR && activeTab === 'hr') fetchAllAdvances();
  }, [activeTab, isHR]);

  const fetchMyAdvances = async () => {
    setLoading(true);
    try {
      const res = await advanceAPI.getMy();
      setMyAdvances(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAdvances = async () => {
    setAllLoading(true);
    try {
      const res = await advanceAPI.getAll();
      setAllAdvances(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setAllLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) { setFormError('Please enter a valid amount greater than zero.'); return; }
    const months = parseInt(form.deductionMonths);
    if (!months || months < 1 || months > 12) { setFormError('Deduction period must be between 1–12 months.'); return; }
    if (!form.reason.trim()) { setFormError('Please provide a reason for your request.'); return; }

    setSubmitting(true);
    try {
      await advanceAPI.request({
        amount: amt,
        deductionMonths: months,
        reason: form.reason.trim(),
      });
      setForm({ amount: '', deductionMonths: '1', reason: '' });
      setShowForm(false);
      setSuccessMsg('Your advance request has been submitted and is awaiting HR approval.');
      setTimeout(() => setSuccessMsg(''), 5000);
      fetchMyAdvances();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveAction = async (id, status) => {
    if (!isHR) return;
    try {
      await advanceAPI.approve(id, status);
      fetchAllAdvances();
      // also refresh own if HR is also an employee
      fetchMyAdvances();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const hasPending = myAdvances.some(a => a.status === 'pending');

  const inputStyle = {
    width: '100%', padding: '13px 16px', borderRadius: 14,
    border: '1.5px solid #e2e8f0', outline: 'none',
    fontFamily: "'Outfit', sans-serif", fontWeight: 600,
    fontSize: 15, color: '#0f172a', background: '#f8fafc',
    boxSizing: 'border-box', transition: 'border-color 0.2s',
  };

  const pendingCount = allAdvances.filter(a => a.status === 'pending').length;

  return (
    <div style={{ padding: 40, minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>

      {/* Header */}
      <header style={{ marginBottom: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: 0 }}>Salary Advance</h1>
          <p style={{ color: '#64748b', fontWeight: 600, marginTop: 6 }}>
            Request an advance on your salary — reviewed and approved by HR.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setFormError(''); }}
          disabled={hasPending}
          title={hasPending ? 'You already have a pending request' : 'Submit new advance request'}
          style={{
            padding: '13px 24px', borderRadius: 16,
            background: hasPending ? '#e2e8f0' : 'linear-gradient(135deg, #0a84ff, #6366f1)',
            color: hasPending ? '#94a3b8' : 'white', border: 'none',
            fontWeight: 800, cursor: hasPending ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 10, fontSize: 14,
            boxShadow: hasPending ? 'none' : '0 4px 20px rgba(10,132,255,0.35)',
          }}
        >
          <CreditCard size={18} />
          {hasPending ? 'Request Pending…' : 'Request Advance'}
        </button>
      </header>

      {/* Success Banner */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{ marginBottom: 24, padding: '16px 24px', borderRadius: 16, background: '#dcfce7',
              border: '1px solid #86efac', color: '#15803d', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12 }}
          >
            <CheckCircle size={20} /> {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info banner for employees */}
      {!isHR && (
        <div style={{ marginBottom: 28, padding: '16px 24px', borderRadius: 16, background: '#eff6ff',
          border: '1px solid #bfdbfe', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <Info size={20} color="#0a84ff" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ color: '#1e40af', fontWeight: 600, fontSize: 14, lineHeight: 1.6 }}>
            <strong>How it works:</strong> Submit a salary advance request with the amount and reason. 
            HR will review and approve or reject your request. Approved advances are automatically 
            deducted from your salary over the selected number of months.
          </div>
        </div>
      )}

      {/* Tabs — only shown if HR */}
      {isHR && (
        <div style={{ marginBottom: 28, display: 'flex', gap: 4, background: 'white', padding: 4,
          borderRadius: 16, border: '1px solid #e2e8f0', alignSelf: 'flex-start', width: 'fit-content' }}>
          {[
            { id: 'my',  label: 'My Requests' },
            { id: 'hr',  label: `Approval Queue${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ padding: '10px 20px', borderRadius: 12, border: 'none', fontWeight: 800, cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif", fontSize: 14, transition: 'all 0.2s',
                background: activeTab === t.id ? '#0f172a' : 'transparent',
                color: activeTab === t.id ? 'white' : '#64748b' }}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* ── MY REQUESTS TAB ── */}
      {(!isHR || activeTab === 'my') && (
        <div>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 28 }}>
            {[
              { label: 'Total Requested', value: fmtMoney(myAdvances.reduce((s, a) => s + parseFloat(a.amount || 0), 0)), color: '#0a84ff', icon: <DollarSign size={22} /> },
              { label: 'Approved', value: myAdvances.filter(a => a.status === 'approved').length, color: '#10b981', icon: <CheckCircle size={22} /> },
              { label: 'Pending Review', value: myAdvances.filter(a => a.status === 'pending').length, color: '#f59e0b', icon: <Clock size={22} /> },
            ].map(card => (
              <motion.div key={card.label} whileHover={{ y: -2 }}
                style={{ background: 'white', padding: '24px 28px', borderRadius: 24, border: '1px solid rgba(0,0,0,0.05)',
                  display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: `${card.color}15`,
                  color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {card.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>{card.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', lineHeight: 1.2, marginTop: 2 }}>{card.value}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* My advance history */}
          <div style={{ background: 'white', borderRadius: 28, border: '1px solid rgba(0,0,0,0.05)', padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
                <FileText size={20} /> My Advance History
              </h2>
              <button onClick={fetchMyAdvances} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13 }}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            {loading ? (
              <div style={{ padding: 80, textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>Loading your requests…</div>
            ) : myAdvances.length === 0 ? (
              <div style={{ padding: 80, textAlign: 'center' }}>
                <CreditCard size={56} style={{ opacity: 0.12, marginBottom: 16 }} />
                <div style={{ fontWeight: 800, color: '#64748b', fontSize: 18 }}>No advance requests yet</div>
                <div style={{ color: '#94a3b8', fontWeight: 600, marginTop: 8 }}>Click "Request Advance" to submit your first request.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {myAdvances.map(adv => (
                  <motion.div key={adv.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 140px 140px', alignItems: 'center',
                      gap: 24, padding: '22px 28px', borderRadius: 20,
                      border: `1.5px solid ${adv.status === 'approved' ? '#bbf7d0' : adv.status === 'rejected' ? '#fecaca' : '#fde68a'}`,
                      background: adv.status === 'approved' ? '#f0fdf4' : adv.status === 'rejected' ? '#fff5f5' : '#fffbeb' }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>{fmtMoney(adv.amount)}</div>
                      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginTop: 3 }}>
                        Over {adv.deductionMonths} month{adv.deductionMonths > 1 ? 's' : ''} &nbsp;·&nbsp; Remaining: {fmtMoney(adv.remainingAmount)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', lineHeight: 1.5 }}>
                        {adv.reason || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No reason provided</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{fmtDate(adv.createdAt)}</div>
                    <div><StatusBadge status={adv.status} /></div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── HR APPROVAL TAB ── */}
      {isHR && activeTab === 'hr' && (
        <div style={{ background: 'white', borderRadius: 28, border: '1px solid rgba(0,0,0,0.05)', padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
                <ShieldCheck size={22} color="#0a84ff" /> Advance Approval Queue
              </h2>
              <p style={{ color: '#64748b', fontWeight: 600, marginTop: 6, fontSize: 14 }}>
                Review and approve or reject employee salary advance requests.
              </p>
            </div>
            <button onClick={fetchAllAdvances} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13 }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {allLoading ? (
            <div style={{ padding: 80, textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>Loading…</div>
          ) : allAdvances.length === 0 ? (
            <div style={{ padding: 80, textAlign: 'center' }}>
              <CheckCircle size={56} style={{ opacity: 0.12, marginBottom: 16 }} />
              <div style={{ fontWeight: 800, color: '#64748b', fontSize: 18 }}>All clear!</div>
              <div style={{ color: '#94a3b8', fontWeight: 600, marginTop: 8 }}>No advance requests to review.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Pending first, then rest */}
              {[...allAdvances].sort((a, b) => (a.status === 'pending' ? -1 : 1)).map(adv => {
                const empName = adv.Employee?.User?.name || 'Unknown';
                const empInitials = empName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                const isSelf = adv.Employee?.userId === user?.id;
                return (
                  <motion.div key={adv.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ padding: '24px 28px', borderRadius: 24,
                      border: `1.5px solid ${adv.status === 'pending' ? '#fde68a' : adv.status === 'approved' ? '#bbf7d0' : '#fecaca'}`,
                      background: adv.status === 'pending' ? '#fffbeb' : adv.status === 'approved' ? '#f0fdf4' : '#fff5f5' }}>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
                      {/* Avatar */}
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: '#0f172a',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, fontSize: 16, flexShrink: 0 }}>
                        {empInitials}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                          <span style={{ fontWeight: 900, color: '#0f172a', fontSize: 16 }}>{empName}</span>
                          <StatusBadge status={adv.status} />
                          {isSelf && (
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#d97706', padding: '3px 10px',
                              background: '#fef3c7', borderRadius: 8, border: '1px solid #fde68a' }}>⚠ Your own request</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', marginBottom: 2 }}>AMOUNT</div>
                            <div style={{ fontWeight: 900, color: '#0f172a', fontSize: 18 }}>{fmtMoney(adv.amount)}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', marginBottom: 2 }}>REPAYMENT</div>
                            <div style={{ fontWeight: 700, color: '#334155' }}>{adv.deductionMonths} month{adv.deductionMonths > 1 ? 's' : ''}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', marginBottom: 2 }}>SUBMITTED</div>
                            <div style={{ fontWeight: 700, color: '#334155' }}>{fmtDate(adv.createdAt)}</div>
                          </div>
                          {adv.reason && (
                            <div style={{ flex: 1, minWidth: 200 }}>
                              <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', marginBottom: 2 }}>REASON</div>
                              <div style={{ fontWeight: 600, color: '#64748b', fontSize: 14 }}>{adv.reason}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {adv.status === 'pending' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                          {isSelf ? (
                            <div style={{ padding: '10px 16px', borderRadius: 12, background: '#f1f5f9',
                              color: '#94a3b8', textAlign: 'center', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>
                              ⛔ Cannot self-approve
                            </div>
                          ) : (
                            <>
                              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={() => handleApproveAction(adv.id, 'approved')}
                                style={{ padding: '11px 20px', borderRadius: 12, background: '#10b981', color: 'white',
                                  border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex',
                                  alignItems: 'center', gap: 6, fontSize: 13, whiteSpace: 'nowrap' }}>
                                <ThumbsUp size={15} /> Approve
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={() => handleApproveAction(adv.id, 'rejected')}
                                style={{ padding: '11px 20px', borderRadius: 12, background: 'white', color: '#ef4444',
                                  border: '1.5px solid #fecaca', fontWeight: 800, cursor: 'pointer', display: 'flex',
                                  alignItems: 'center', gap: 6, fontSize: 13, whiteSpace: 'nowrap' }}>
                                <ThumbsDown size={15} /> Reject
                              </motion.button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── REQUEST MODAL ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
            onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); setFormError(''); } }}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              style={{ background: 'white', borderRadius: 32, padding: 44, width: '100%', maxWidth: 500,
                boxShadow: '0 32px 80px rgba(0,0,0,0.22)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: '#eff6ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={24} color="#0a84ff" />
                </div>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0 }}>Request Salary Advance</h2>
                  <p style={{ color: '#64748b', fontWeight: 600, fontSize: 13, margin: 0, marginTop: 4 }}>
                    Your request will be reviewed by HR before processing.
                  </p>
                </div>
              </div>

              <div style={{ height: 1, background: '#f1f5f9', margin: '24px 0' }} />

              {formError && (
                <div style={{ marginBottom: 20, padding: '14px 18px', borderRadius: 14, background: '#fff5f5',
                  border: '1px solid #fecaca', color: '#dc2626', fontWeight: 700, fontSize: 14,
                  display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AlertCircle size={17} /> {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Advance Amount (PKR)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="number" min="1" step="1" required
                      value={form.amount}
                      onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder="e.g. 15000"
                      style={{ ...inputStyle, paddingLeft: 40 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Repayment Period
                  </label>
                  <select
                    value={form.deductionMonths}
                    onChange={e => setForm(f => ({ ...f, deductionMonths: e.target.value }))}
                    style={{ ...inputStyle }}
                    required
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                      <option key={m} value={m}>{m} month{m > 1 ? 's' : ''} (deducted from salary)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Reason for Request
                  </label>
                  <textarea
                    value={form.reason}
                    onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                    placeholder="Briefly explain why you need this advance…"
                    required
                    style={{ ...inputStyle, height: 110, resize: 'vertical', lineHeight: 1.6 }}
                  />
                </div>

                {form.amount && parseFloat(form.amount) > 0 && (
                  <div style={{ padding: '14px 18px', borderRadius: 14, background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0369a1' }}>
                      💡 Monthly deduction:{' '}
                      <strong>
                        PKR {(parseFloat(form.amount) / parseInt(form.deductionMonths || 1)).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </strong>{' '}
                      for {form.deductionMonths} month{parseInt(form.deductionMonths) > 1 ? 's' : ''}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button type="button" onClick={() => { setShowForm(false); setFormError(''); }}
                    style={{ flex: 1, padding: '15px', borderRadius: 16, background: '#f1f5f9', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 15 }}>
                    Cancel
                  </button>
                  <motion.button type="submit" disabled={submitting} whileHover={{ scale: submitting ? 1 : 1.02 }} whileTap={{ scale: 0.97 }}
                    style={{ flex: 2, padding: '15px', borderRadius: 16,
                      background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #0a84ff, #6366f1)',
                      color: 'white', border: 'none', fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 15,
                      boxShadow: submitting ? 'none' : '0 4px 16px rgba(10,132,255,0.35)' }}>
                    <Send size={17} />
                    {submitting ? 'Submitting…' : 'Submit Request'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SalaryAdvancePage;
