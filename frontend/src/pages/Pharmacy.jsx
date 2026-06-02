import React, { useState, useEffect } from 'react';
import {
  Pill, FileText, CheckCircle, XCircle, AlertTriangle,
  Clock, Search, ShieldAlert, Flame, RefreshCw, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { pharmacyAPI } from '../api';
import API from '../api';

const TABS = [
  { id: 'inventory',    label: 'Drug Inventory',       icon: <Pill size={16} /> },
  { id: 'prescriptions',label: 'Prescriptions',        icon: <FileText size={16} /> },
  { id: 'expiring',     label: 'Expiring Drugs',       icon: <Clock size={16} /> },
  { id: 'controlled',  label: 'Controlled Substances', icon: <ShieldAlert size={16} /> },
  { id: 'recalls',     label: 'Batch Recalls',         icon: <Flame size={16} /> },
];

const badgeStyle = (color) => ({
  fontSize: 11, fontWeight: 800, padding: '3px 10px',
  borderRadius: 8, background: `${color}18`, color
});

const Pharmacy = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [drugs, setDrugs]             = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [expiring, setExpiring]       = useState([]);
  const [controlled, setControlled]   = useState([]);
  const [recalls, setRecalls]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [search, setSearch]           = useState('');
  const [recallBatch, setRecallBatch] = useState('');
  const [recallReason, setRecallReason] = useState('');
  const [recalling, setRecalling]     = useState(false);

  const fetchTab = async (tab) => {
    setLoading(true);
    try {
      if (tab === 'inventory') {
        const res = await pharmacyAPI.getDrugs();
        setDrugs(res.data);
      } else if (tab === 'prescriptions') {
        const res = await pharmacyAPI.getPendingPrescriptions();
        setPrescriptions(res.data);
      } else if (tab === 'expiring') {
        const res = await API.get('/pharmacy/expiring');
        setExpiring(res.data);
      } else if (tab === 'controlled') {
        const res = await API.get('/pharmacy/controlled');
        setControlled(res.data);
      } else if (tab === 'recalls') {
        const res = await API.get('/pharmacy/recalls');
        setRecalls(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTab(activeTab); }, [activeTab]);

  const handleVerify = async (id, status) => {
    try {
      await pharmacyAPI.verifyPrescription(id, status);
      fetchTab('prescriptions');
    } catch { alert('Action failed'); }
  };

  const handleRecall = async () => {
    if (!recallBatch.trim()) return alert('Enter a batch number');
    setRecalling(true);
    try {
      await API.post('/pharmacy/recalls', { batchNo: recallBatch, reason: recallReason });
      setRecallBatch(''); setRecallReason('');
      fetchTab('recalls');
    } catch (err) {
      alert(err.response?.data?.message || 'Recall failed');
    } finally { setRecalling(false); }
  };

  const filtered = (list, key) =>
    list.filter(d => (d[key] || '').toLowerCase().includes(search.toLowerCase()));

  const TabButton = ({ tab }) => (
    <button
      onClick={() => { setActiveTab(tab.id); setSearch(''); }}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 18px', borderRadius: 12, border: 'none',
        fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
        fontFamily: "'Outfit', sans-serif",
        background: activeTab === tab.id ? '#0f172a' : 'transparent',
        color: activeTab === tab.id ? 'white' : '#64748b',
      }}
    >
      {tab.icon} {tab.label}
    </button>
  );

  return (
    <div style={{ padding: 40, minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <header style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>Medical Pharmacy</h1>
          <p style={{ color: '#64748b', fontWeight: 600 }}>Drug inventory, prescriptions, recalls and compliance.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, background: 'white', padding: 6, borderRadius: 18, border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
          {TABS.map(t => <TabButton key={t.id} tab={t} />)}
        </div>
      </header>

      {/* Search bar (for tabs that need it) */}
      {['inventory', 'expiring', 'controlled'].includes(activeTab) && (
        <div style={{ position: 'relative', marginBottom: 24, maxWidth: 380 }}>
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search drugs..."
            style={{
              width: '100%', padding: '12px 16px 12px 44px', borderRadius: 14,
              border: '1.5px solid #e2e8f0', outline: 'none',
              fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14,
              background: 'white', boxSizing: 'border-box'
            }}
          />
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 100, color: '#94a3b8', fontWeight: 700 }}>Loading...</div>
      ) : (
        <AnimatePresence mode="wait">
          {/* ── DRUG INVENTORY ── */}
          {activeTab === 'inventory' && (
            <motion.div key="inventory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 24 }}>
                {filtered(drugs, 'brandName').map(drug => (
                  <div key={drug.id} style={{ background: 'white', padding: 24, borderRadius: 28, border: '1px solid rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: '#0a84ff' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Pill size={24} color="#0a84ff" />
                      </div>
                      <span style={badgeStyle('#10b981')}>STOCK: {drug.Product?.stock ?? 'N/A'}</span>
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0f172a', marginBottom: 2 }}>{drug.brandName}</h3>
                    <p style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 16 }}>{drug.genericName}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                      {[
                        ['Manufacturer', drug.manufacturer],
                        ['Batch No', drug.batchNo],
                        ['Expiry', drug.expiryDate],
                        ['Controlled', drug.isControlled ? '⚠️ Yes' : 'No'],
                      ].map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94a3b8', fontWeight: 700 }}>{k}</span>
                          <span style={{ fontWeight: 800, color: k === 'Expiry' ? '#ef4444' : '#0f172a' }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {filtered(drugs, 'brandName').length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 80, color: '#94a3b8', fontWeight: 700 }}>No drugs found.</div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── PRESCRIPTIONS ── */}
          {activeTab === 'prescriptions' && (
            <motion.div key="prescriptions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {prescriptions.map(p => (
                <div key={p.id} style={{ background: 'white', padding: 32, borderRadius: 28, border: '1px solid rgba(0,0,0,0.05)', display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 32, alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#0f172a' }}>
                      {p.Customer?.name?.[0] || '?'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 900, color: '#0f172a', fontSize: 16 }}>{p.Customer?.name}</div>
                      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Dr. {p.doctorName}</div>
                      <span style={badgeStyle('#f59e0b')}>PENDING</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {p.Items?.map(item => (
                      <div key={item.id} style={{ padding: '8px 14px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 700 }}>
                        {item.Drug?.brandName} ×{item.quantity}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button onClick={() => handleVerify(p.id, 'verified')}
                      style={{ padding: '10px 20px', borderRadius: 12, background: '#10b981', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button onClick={() => handleVerify(p.id, 'rejected')}
                      style={{ padding: '10px 20px', borderRadius: 12, background: 'white', color: '#ef4444', border: '1px solid #fee2e2', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                </div>
              ))}
              {prescriptions.length === 0 && (
                <div style={{ textAlign: 'center', padding: 100, color: '#94a3b8', fontWeight: 700 }}>No pending prescriptions.</div>
              )}
            </motion.div>
          )}

          {/* ── EXPIRING DRUGS ── */}
          {activeTab === 'expiring' && (
            <motion.div key="expiring" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 16, padding: '14px 24px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
                <AlertTriangle size={20} color="#f59e0b" />
                <span style={{ fontWeight: 800, color: '#92400e' }}>{expiring.length} drugs expiring within 30 days — review and action required.</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 20 }}>
                {filtered(expiring, 'brandName').map(drug => (
                  <div key={drug.id} style={{ background: 'white', padding: 24, borderRadius: 24, border: '2px solid #fecaca', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 16, right: 16 }}>
                      <span style={badgeStyle('#ef4444')}>EXPIRING</span>
                    </div>
                    <Pill size={32} color="#ef4444" style={{ marginBottom: 12 }} />
                    <div style={{ fontWeight: 900, color: '#0f172a', fontSize: 16, marginBottom: 4 }}>{drug.brandName}</div>
                    <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 12 }}>{drug.genericName}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#ef4444' }}>Expires: {drug.expiryDate}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, marginTop: 4 }}>Batch: {drug.batchNo}</div>
                  </div>
                ))}
                {filtered(expiring, 'brandName').length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 80, color: '#94a3b8', fontWeight: 700 }}>
                    ✅ No drugs expiring within the next 30 days.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── CONTROLLED SUBSTANCES ── */}
          {activeTab === 'controlled' && (
            <motion.div key="controlled" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 16, padding: '14px 24px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
                <ShieldAlert size={20} color="#d97706" />
                <span style={{ fontWeight: 800, color: '#92400e' }}>Controlled substances require strict regulatory compliance. All dispensing must be logged.</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {filtered(controlled, 'brandName').map(drug => (
                  <div key={drug.id} style={{ background: 'white', padding: 28, borderRadius: 24, border: '1px solid rgba(0,0,0,0.05)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', alignItems: 'center', gap: 24 }}>
                    <div>
                      <div style={{ fontWeight: 900, color: '#0f172a', fontSize: 16 }}>{drug.brandName}</div>
                      <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{drug.genericName}</div>
                    </div>
                    <div><span style={badgeStyle('#d97706')}>CONTROLLED</span></div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Batch: <span style={{ color: '#0f172a' }}>{drug.batchNo}</span></div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Stock: <span style={{ color: '#10b981', fontWeight: 900 }}>{drug.Product?.stock}</span></div>
                  </div>
                ))}
                {filtered(controlled, 'brandName').length === 0 && (
                  <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8', fontWeight: 700 }}>No controlled substances registered.</div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── BATCH RECALLS ── */}
          {activeTab === 'recalls' && (
            <motion.div key="recalls" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Recall form */}
              <div style={{ background: 'white', borderRadius: 28, padding: 36, border: '2px solid #fecaca', marginBottom: 32 }}>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Flame size={22} color="#ef4444" /> Issue Batch Recall
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 16, alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>BATCH NUMBER</label>
                    <input value={recallBatch} onChange={e => setRecallBatch(e.target.value)}
                      placeholder="e.g. BATCH-2024-001"
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', outline: 'none', fontFamily: "'Outfit', sans-serif", fontWeight: 700, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>RECALL REASON</label>
                    <input value={recallReason} onChange={e => setRecallReason(e.target.value)}
                      placeholder="Enter reason for recall..."
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', outline: 'none', fontFamily: "'Outfit', sans-serif", fontWeight: 700, boxSizing: 'border-box' }} />
                  </div>
                  <button onClick={handleRecall} disabled={recalling}
                    style={{ padding: '12px 24px', borderRadius: 12, background: '#ef4444', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', opacity: recalling ? 0.7 : 1 }}>
                    {recalling ? 'Recalling...' : 'Issue Recall'}
                  </button>
                </div>
              </div>

              {/* Recall history */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {recalls.map(r => (
                  <div key={r.id} style={{ background: 'white', padding: 28, borderRadius: 24, border: '1px solid rgba(0,0,0,0.05)', display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', alignItems: 'center', gap: 24 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', marginBottom: 4 }}>BATCH</div>
                      <div style={{ fontWeight: 900, color: '#0f172a', fontSize: 16 }}>{r.batchNo}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', marginBottom: 4 }}>REASON</div>
                      <div style={{ fontWeight: 700, color: '#64748b' }}>{r.reason}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={badgeStyle('#ef4444')}>RECALLED</span>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6, fontWeight: 600 }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                {recalls.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8', fontWeight: 700 }}>
                    ✅ No active batch recalls.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default Pharmacy;
