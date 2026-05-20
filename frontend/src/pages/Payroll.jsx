import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Calculator, Download, Printer, 
  History, Users, CheckCircle, AlertTriangle, Play, Edit2, Save, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { payrollAPI } from '../api';

const inputStyle = {
  padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10,
  outline: 'none', fontFamily: "'Outfit', sans-serif", fontSize: 14,
  fontWeight: 700, color: '#0f172a', background: '#f8fafc', width: 90,
};

const Payroll = () => {
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ allowances: 0, deductions: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await payrollAPI.getHistory();
      setRuns(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunPayroll = async () => {
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    if (!window.confirm(`Are you sure you want to run payroll for ${month}/${year}?`)) return;
    setProcessing(true);
    try {
      await payrollAPI.run(month, year);
      fetchHistory();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Payroll run failed');
    } finally {
      setProcessing(false);
    }
  };

  const viewRun = async (run) => {
    setSelectedRun(run);
    setEditingId(null);
    try {
      const res = await payrollAPI.getPayslips(run.id);
      setPayslips(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (ps) => {
    setEditingId(ps.id);
    setEditValues({
      allowances: parseFloat(ps.allowances) || 0,
      deductions: parseFloat(ps.deductions) || 0,
    });
  };

  const handleSavePayslip = async (id) => {
    setSaving(true);
    try {
      const res = await payrollAPI.updatePayslip(id, editValues);
      setPayslips(prev => prev.map(p => p.id === id ? { ...p, ...res.data } : p));
      setEditingId(null);
    } catch (err) {
      alert('Failed to update payslip');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 40, minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>Payroll Engine</h1>
          <p style={{ color: '#64748b', fontWeight: 600 }}>Execute and manage monthly salary processing.</p>
        </div>
        <button 
          onClick={handleRunPayroll}
          disabled={processing}
          style={{ 
            padding: '14px 28px', borderRadius: 16, background: '#0a84ff', color: 'white', 
            border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
            opacity: processing ? 0.7 : 1
          }}
        >
          {processing ? <Calculator /> : <Play size={20} />} 
          {processing ? 'Processing...' : 'Run New Payroll'}
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: 32 }}>
        {/* Left: Past Runs */}
        <div style={{ background: 'white', padding: 32, borderRadius: 32, border: '1px solid rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            <History size={20} /> Payroll History
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {runs.map(run => (
              <button 
                key={run.id}
                onClick={() => viewRun(run)}
                style={{ 
                  textAlign: 'left', padding: '20px', borderRadius: 20, background: selectedRun?.id === run.id ? '#f1f5f9' : '#fff',
                  border: selectedRun?.id === run.id ? '2px solid #0a84ff' : '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>Period: {run.month}/{run.year}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Processed: {new Date(run.processedAt).toLocaleDateString()}</div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#10b981' }}>
                  <CheckCircle size={14} /> {run.status.toUpperCase()}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Selected Run Details */}
        <div style={{ background: 'white', padding: 32, borderRadius: 32, border: '1px solid rgba(0,0,0,0.05)' }}>
          {selectedRun ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>Payroll Details: {selectedRun.month}/{selectedRun.year}</h2>
                  <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, marginTop: 4 }}>Click the edit icon to adjust allowances & deductions per employee</p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                      <th style={{ padding: '16px', color: '#64748b', fontSize: 13, fontWeight: 800 }}>EMPLOYEE</th>
                      <th style={{ padding: '16px', color: '#64748b', fontSize: 13, fontWeight: 800 }}>BASE</th>
                      <th style={{ padding: '16px', color: '#64748b', fontSize: 13, fontWeight: 800 }}>ALLOWANCE</th>
                      <th style={{ padding: '16px', color: '#64748b', fontSize: 13, fontWeight: 800 }}>DEDUCTION</th>
                      <th style={{ padding: '16px', color: '#64748b', fontSize: 13, fontWeight: 800 }}>NET SALARY</th>
                      <th style={{ padding: '16px', color: '#64748b', fontSize: 13, fontWeight: 800 }}>ACTION</th>
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
                          <td style={{ padding: '16px', fontWeight: 700, color: '#0f172a' }}>${parseFloat(ps.baseSalary).toFixed(2)}</td>
                          <td style={{ padding: '16px' }}>
                            {isEditing ? (
                              <input style={{ ...inputStyle, borderColor: '#10b981' }} type="number" min="0" value={editValues.allowances}
                                onChange={e => setEditValues(v => ({ ...v, allowances: e.target.value }))} />
                            ) : (
                              <span style={{ color: '#10b981', fontWeight: 700 }}>+${parseFloat(ps.allowances).toFixed(2)}</span>
                            )}
                          </td>
                          <td style={{ padding: '16px' }}>
                            {isEditing ? (
                              <input style={{ ...inputStyle, borderColor: '#ef4444' }} type="number" min="0" value={editValues.deductions}
                                onChange={e => setEditValues(v => ({ ...v, deductions: e.target.value }))} />
                            ) : (
                              <span style={{ color: '#ef4444', fontWeight: 700 }}>-${parseFloat(ps.deductions).toFixed(2)}</span>
                            )}
                          </td>
                          <td style={{ padding: '16px', fontWeight: 900, color: '#0a84ff', fontSize: 16 }}>${net}</td>
                          <td style={{ padding: '16px', display: 'flex', gap: 8 }}>
                            {isEditing ? (
                              <>
                                <button onClick={() => handleSavePayslip(ps.id)} disabled={saving}
                                  style={{ padding: '8px 14px', borderRadius: 8, background: '#10b981', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                  <Save size={14} /> Save
                                </button>
                                <button onClick={() => setEditingId(null)}
                                  style={{ padding: '8px', borderRadius: 8, background: '#f1f5f9', border: 'none', cursor: 'pointer' }}>
                                  <X size={14} color="#64748b" />
                                </button>
                              </>
                            ) : (
                              <button onClick={() => startEdit(ps)}
                                style={{ padding: '8px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                                <Edit2 size={16} color="#0a84ff" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 100, color: '#94a3b8' }}>
              <Calculator size={64} style={{ opacity: 0.2, marginBottom: 20 }} />
              <h3 style={{ fontSize: 20, fontWeight: 800 }}>Select a Payroll Period</h3>
              <p>Choose a run from the history to view detailed payslips.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payroll;
