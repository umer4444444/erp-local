import React, { useState, useEffect } from 'react';
import {
  DollarSign, Calculator, History, CheckCircle,
  Play, Edit2, Save, X, CreditCard, Clock,
  ThumbsUp, ThumbsDown, AlertCircle, ChevronDown, Printer, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { payrollAPI, advanceAPI } from '../api';

const inputStyle = {
  padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10,
  outline: 'none', fontFamily: "'Outfit', sans-serif", fontSize: 14,
  fontWeight: 700, color: '#0f172a', background: '#f8fafc', width: 90,
};

const fmtMoney = (n) => `SAR ${parseFloat(n || 0).toFixed(2)}`;

const TABS = ['payroll', 'advances'];

const Payroll = () => {
  const [activeTab, setActiveTab]   = useState('payroll');
  const [runDate, setRunDate]       = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [runs, setRuns]             = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [payslips, setPayslips]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [processing, setProcessing] = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [editValues, setEditValues] = useState({ allowances: 0, deductions: 0 });
  const [saving, setSaving]         = useState(false);

  // Advance state
  const [advances, setAdvances]     = useState([]);
  const [advLoading, setAdvLoading] = useState(false);
  const [advForm, setAdvForm]       = useState({ amount: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => { fetchHistory(); }, []);
  useEffect(() => { if (activeTab === 'advances') fetchAdvances(); }, [activeTab]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await payrollAPI.getHistory();
      setRuns(res.data);
    } catch { } finally { setLoading(false); }
  };

  const fetchAdvances = async () => {
    setAdvLoading(true);
    try {
      const res = await advanceAPI.getPending();
      setAdvances(res.data);
    } catch { } finally { setAdvLoading(false); }
  };

  const handleRunPayroll = async () => {
    const [yearStr, monthStr] = runDate.split('-');
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);
    if (!window.confirm(`Run payroll for ${month}/${year}?`)) return;
    setProcessing(true);
    try {
      await payrollAPI.run(month, year);
      fetchHistory();
    } catch (err) {
      alert(err.response?.data?.message || 'Payroll run failed');
    } finally { setProcessing(false); }
  };

  const viewRun = async (run) => {
    setSelectedRun(run); setEditingId(null);
    try {
      const res = await payrollAPI.getPayslips(run.id);
      setPayslips(res.data);
    } catch { }
  };

  const startEdit = (ps) => {
    setEditingId(ps.id);
    setEditValues({ allowances: parseFloat(ps.allowances) || 0, deductions: parseFloat(ps.deductions) || 0 });
  };

  const handleSave = async (id) => {
    setSaving(true);
    try {
      const res = await payrollAPI.updatePayslip(id, editValues);
      setPayslips(prev => prev.map(p => p.id === id ? { ...p, ...res.data } : p));
      setEditingId(null);
    } catch { alert('Failed to update payslip'); } finally { setSaving(false); }
  };

  const handleAdvanceRequest = async () => {
    if (!advForm.amount || isNaN(advForm.amount)) return alert('Enter a valid amount');
    setSubmitting(true);
    try {
      await advanceAPI.request({ amount: parseFloat(advForm.amount), reason: advForm.reason });
      setAdvForm({ amount: '', reason: '' });
      fetchAdvances();
    } catch (err) {
      alert(err.response?.data?.message || 'Request failed');
    } finally { setSubmitting(false); }
  };

  const handleAdvanceAction = async (id, status) => {
    try {
      await advanceAPI.approve(id, status);
      fetchAdvances();
    } catch { alert('Action failed'); }
  };

  const handleFinalize = async () => {
    if (!selectedRun) return;
    if (!window.confirm(`Finalize payroll for ${selectedRun.month}/${selectedRun.year}? This will mark all payslips as PAID and cannot be undone.`)) return;
    setFinalizing(true);
    try {
      const res = await payrollAPI.finalizeRun(selectedRun.id);
      setSelectedRun(prev => ({ ...prev, status: res.data.status }));
      setRuns(prev => prev.map(r => r.id === selectedRun.id ? { ...r, status: res.data.status } : r));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to finalize payroll run');
    } finally {
      setFinalizing(false);
    }
  };

  const printPayslip = (ps) => {
    const printWindow = window.open('', '_blank');
    const net = parseFloat(ps.netSalary).toFixed(2);
    const empName = ps.Employee?.User?.name || 'Employee';
    const html = `<!DOCTYPE html>
    <html>
    <head>
      <title>Payslip - ${empName} - ${selectedRun.month}/${selectedRun.year}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 40px; background: white; color: #0f172a; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0f172a; padding-bottom: 20px; margin-bottom: 24px; }
        .company { font-size: 24px; font-weight: 900; }
        .company small { display: block; font-size: 12px; font-weight: 400; color: #64748b; margin-top: 4px; }
        .payslip-title { font-size: 14px; font-weight: 800; color: #64748b; text-align: right; }
        .payslip-title span { display: block; font-size: 28px; color: #0f172a; font-weight: 900; margin-top: 4px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
        .info-box { background: #f8fafc; padding: 16px; border-radius: 12px; }
        .info-box label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; }
        .info-box value { display: block; font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { text-align: left; padding: 12px 16px; background: #f1f5f9; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; }
        td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .net-salary { background: #0f172a; color: white; padding: 20px 24px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; }
        .net-salary .label { font-size: 14px; font-weight: 700; opacity: 0.8; }
        .net-salary .amount { font-size: 28px; font-weight: 900; }
        .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company">Company Name<small>HR & Payroll System</small></div>
        <div class="payslip-title">PAYSLIP<span>${selectedRun.month}/${selectedRun.year}</span></div>
      </div>
      <div class="grid">
        <div class="info-box"><label>Employee Name</label><value>${empName}</value></div>
        <div class="info-box"><label>Employee Code</label><value>${ps.Employee?.empCode || '—'}</value></div>
        <div class="info-box"><label>Pay Period</label><value>${selectedRun.month}/${selectedRun.year}</value></div>
        <div class="info-box"><label>Status</label><value>${ps.status?.toUpperCase() || 'UNPAID'}</value></div>
      </div>
      <table>
        <tr><th>Description</th><th>Amount</th></tr>
        <tr><td>Base Salary</td><td>SAR ${parseFloat(ps.baseSalary).toFixed(2)}</td></tr>
        <tr><td style="color:#10b981">+ Allowances</td><td style="color:#10b981">SAR ${parseFloat(ps.allowances).toFixed(2)}</td></tr>
        <tr><td style="color:#ef4444">- Deductions</td><td style="color:#ef4444">SAR ${parseFloat(ps.deductions).toFixed(2)}</td></tr>
      </table>
      <div class="net-salary">
        <div class="label">NET SALARY</div>
        <div class="amount">SAR ${net}</div>
      </div>
      <div class="footer">This is a computer-generated payslip. No signature required.</div>
    </body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const statusBadge = (s) => {
    const map = {
      pending:  { color: '#f59e0b', label: 'Pending'  },
      approved: { color: '#10b981', label: 'Approved' },
      rejected: { color: '#ef4444', label: 'Rejected' },
    };
    const c = map[s] || map.pending;
    return (
      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 8, background: `${c.color}18`, color: c.color }}>
        {c.label}
      </span>
    );
  };

  return (
    <div style={{ padding: 40, minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <header style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>Payroll Engine</h1>
          <p style={{ color: '#64748b', fontWeight: 600 }}>Execute payroll runs, adjust payslips, and manage salary advances.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, background: 'white', padding: 4, borderRadius: 12, border: '1px solid #e2e8f0' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ padding: '8px 18px', borderRadius: 10, border: 'none', fontWeight: 800, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s',
                  background: activeTab === t ? '#0f172a' : 'transparent', color: activeTab === t ? 'white' : '#64748b' }}>
                {t === 'payroll' ? 'Payroll Runs' : 'Salary Advances'}
              </button>
            ))}
          </div>
          {activeTab === 'payroll' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input 
                type="month" 
                value={runDate}
                onChange={(e) => setRunDate(e.target.value)}
                style={{ ...inputStyle, width: 'auto', padding: '10px 14px' }}
              />
              <button onClick={handleRunPayroll} disabled={processing}
                style={{ padding: '12px 24px', borderRadius: 14, background: '#0a84ff', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: processing ? 0.7 : 1 }}>
                {processing ? <Calculator size={18} /> : <Play size={18} />}
                {processing ? 'Processing...' : 'Run Payroll'}
              </button>
            </div>
          )}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {/* ── PAYROLL RUNS TAB ── */}
        {activeTab === 'payroll' && (
          <motion.div key="payroll" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 28 }}>
            {/* History sidebar */}
            <div style={{ background: 'white', padding: 28, borderRadius: 28, border: '1px solid rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <History size={18} /> History
              </h2>
              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
              ) : runs.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: 700 }}>No payroll runs yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {runs.map(run => (
                    <button key={run.id} onClick={() => viewRun(run)}
                      style={{ textAlign: 'left', padding: '18px', borderRadius: 18, border: selectedRun?.id === run.id ? '2px solid #0a84ff' : '1.5px solid #e2e8f0', background: selectedRun?.id === run.id ? '#f0f9ff' : 'white', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <div style={{ fontWeight: 900, color: '#0f172a', fontSize: 15 }}>Period {run.month}/{run.year}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{new Date(run.processedAt).toLocaleDateString()}</div>
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#10b981' }}>
                        <CheckCircle size={13} /> {run.status?.toUpperCase()}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Payslips panel */}
            <div style={{ background: 'white', padding: 32, borderRadius: 28, border: '1px solid rgba(0,0,0,0.05)' }}>
              {selectedRun ? (
                <>
                  <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>Payroll Details — {selectedRun.month}/{selectedRun.year}</h2>
                      <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, marginTop: 4 }}>Click the edit icon to adjust allowances and deductions per employee.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, padding: '6px 14px', borderRadius: 10,
                        background: selectedRun.status === 'processed' ? '#dcfce7' : '#fef3c7',
                        color: selectedRun.status === 'processed' ? '#16a34a' : '#d97706' }}>
                        {selectedRun.status?.toUpperCase()}
                      </span>
                      {selectedRun.status !== 'processed' && (
                        <button onClick={handleFinalize} disabled={finalizing}
                          style={{ padding: '10px 20px', borderRadius: 12, background: '#10b981', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: finalizing ? 0.7 : 1, fontSize: 13 }}>
                          <Lock size={14} /> {finalizing ? 'Finalizing...' : 'Finalize & Pay'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                          {['Employee', 'Base Salary', 'Allowances', 'Deductions', 'Net Salary', 'Action'].map(h => (
                            <th key={h} style={{ padding: '14px 16px', color: '#64748b', fontSize: 12, fontWeight: 800, letterSpacing: 0.5 }}>{h.toUpperCase()}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {payslips.map(ps => {
                          const isEditing = editingId === ps.id;
                          const net = isEditing
                            ? (parseFloat(ps.baseSalary) + parseFloat(editValues.allowances) - parseFloat(editValues.deductions)).toFixed(2)
                            : parseFloat(ps.netSalary).toFixed(2);
                          return (
                            <tr key={ps.id} style={{ borderBottom: '1px solid #f8fafc', background: isEditing ? '#f0f9ff' : 'white', transition: 'background 0.2s' }}>
                              <td style={{ padding: '16px', fontWeight: 800, color: '#0f172a' }}>{ps.Employee?.User?.name || '—'}</td>
                              <td style={{ padding: '16px', fontWeight: 700 }}>{fmtMoney(ps.baseSalary)}</td>
                              <td style={{ padding: '16px' }}>
                                {isEditing
                                  ? <input style={{ ...inputStyle, borderColor: '#10b981' }} type="number" min="0" value={editValues.allowances} onChange={e => setEditValues(v => ({ ...v, allowances: e.target.value }))} />
                                  : <span style={{ color: '#10b981', fontWeight: 700 }}>+{fmtMoney(ps.allowances)}</span>}
                              </td>
                              <td style={{ padding: '16px' }}>
                                {isEditing
                                  ? <input style={{ ...inputStyle, borderColor: '#ef4444' }} type="number" min="0" value={editValues.deductions} onChange={e => setEditValues(v => ({ ...v, deductions: e.target.value }))} />
                                  : <span style={{ color: '#ef4444', fontWeight: 700 }}>-{fmtMoney(ps.deductions)}</span>}
                              </td>
                              <td style={{ padding: '16px', fontWeight: 900, color: '#0a84ff', fontSize: 16 }}>{fmtMoney(net)}</td>
                              <td style={{ padding: '16px' }}>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  {isEditing ? (
                                    <>
                                      <button onClick={() => handleSave(ps.id)} disabled={saving}
                                        style={{ padding: '7px 12px', borderRadius: 8, background: '#10b981', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Save size={13} /> Save
                                      </button>
                                      <button onClick={() => setEditingId(null)}
                                        style={{ padding: '7px', borderRadius: 8, background: '#f1f5f9', border: 'none', cursor: 'pointer' }}>
                                        <X size={13} color="#64748b" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      {selectedRun.status !== 'processed' && (
                                        <button onClick={() => startEdit(ps)}
                                          style={{ padding: '7px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                                          <Edit2 size={15} color="#0a84ff" />
                                        </button>
                                      )}
                                      <button onClick={() => printPayslip(ps)} title="Print Payslip"
                                        style={{ padding: '7px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                                        <Printer size={15} color="#64748b" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {payslips.length === 0 && (
                          <tr><td colSpan={6} style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontWeight: 700 }}>No payslips found for this run.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 100, color: '#94a3b8' }}>
                  <Calculator size={64} style={{ opacity: 0.15, marginBottom: 20 }} />
                  <h3 style={{ fontSize: 20, fontWeight: 800 }}>Select a Payroll Period</h3>
                  <p style={{ fontWeight: 600 }}>Choose a run from history to view detailed payslips.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── SALARY ADVANCES TAB ── */}
        {activeTab === 'advances' && (
          <motion.div key="advances" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Request form */}
            <div style={{ background: 'white', borderRadius: 28, padding: 36, border: '1px solid rgba(0,0,0,0.05)', marginBottom: 28 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <CreditCard size={22} color="#0a84ff" /> Request Salary Advance
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr auto', gap: 16, alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>AMOUNT ($)</label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input type="number" min="0" value={advForm.amount} onChange={e => setAdvForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder="0.00"
                      style={{ width: '100%', padding: '12px 12px 12px 36px', borderRadius: 12, border: '1.5px solid #e2e8f0', outline: 'none', fontFamily: "'Outfit', sans-serif", fontWeight: 700, boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>REASON</label>
                  <input value={advForm.reason} onChange={e => setAdvForm(f => ({ ...f, reason: e.target.value }))}
                    placeholder="Reason for advance request..."
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', outline: 'none', fontFamily: "'Outfit', sans-serif", fontWeight: 700, boxSizing: 'border-box' }} />
                </div>
                <button onClick={handleAdvanceRequest} disabled={submitting}
                  style={{ padding: '12px 24px', borderRadius: 12, background: '#0a84ff', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>

            {/* Advance requests list */}
            <div style={{ background: 'white', borderRadius: 28, padding: 32, border: '1px solid rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Clock size={20} /> Advance Requests
              </h2>
              {advLoading ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>Loading...</div>
              ) : advances.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>No advance requests found.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {advances.map(adv => (
                    <div key={adv.id} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', alignItems: 'center', gap: 24, padding: '20px 24px', borderRadius: 20, border: '1.5px solid #f1f5f9', background: '#fafafa' }}>
                      <div>
                        <div style={{ fontWeight: 900, color: '#0f172a', fontSize: 16 }}>{fmtMoney(adv.amount)}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>{new Date(adv.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>{adv.reason || '—'}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>By: {adv.Employee?.User?.name || 'Self'}</div>
                      </div>
                      <div>{statusBadge(adv.status)}</div>
                      {adv.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleAdvanceAction(adv.id, 'approved')}
                            style={{ flex: 1, padding: '9px 0', borderRadius: 10, background: '#dcfce7', color: '#16a34a', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                            <ThumbsUp size={14} /> Approve
                          </button>
                          <button onClick={() => handleAdvanceAction(adv.id, 'rejected')}
                            style={{ flex: 1, padding: '9px 0', borderRadius: 10, background: '#fee2e2', color: '#ef4444', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                            <ThumbsDown size={14} /> Reject
                          </button>
                        </div>
                      )}
                      {adv.status !== 'pending' && <div />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Payroll;
