import React, { useState, useEffect } from 'react';
import { 
  Calculator, DollarSign, CreditCard, CheckCircle2, 
  ArrowRight, X, Printer, AlertCircle, FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { salesAPI, shiftAPI } from '../api';

const EODReport = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({ total: 0, cash: 0, card: 0 });
  const [cashCount, setCashCount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [activeSession, setActiveSession] = useState(null);

  const checkSession = async () => {
    try {
      const res = await shiftAPI.getActiveShift();
      setActiveSession(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      await checkSession();
      try {
        const res = await salesAPI.getEOD();
        setSummary(res.data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleStartSession = async () => {
    try {
      const res = await shiftAPI.startShift();
      setActiveSession(res.data);
      alert('Shift session started successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start shift session');
    }
  };

  const handleCloseEOD = async () => {
    if (!cashCount) return alert('Please enter actual cash count');
    try {
      await salesAPI.closeEOD({ cashCount: parseFloat(cashCount), notes });
      setSubmitted(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close EOD');
    }
  };

  const variance = parseFloat(cashCount || 0) - summary.cash;

  const handlePrintEOD = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>EOD Report</title>
          <style>
            body { font-family: sans-serif; padding: 40px; max-width: 400px; margin: 0 auto; color: #333; }
            h2 { text-align: center; margin-bottom: 5px; }
            p { text-align: center; margin-top: 0; color: #666; font-size: 14px; }
            .divider { border-top: 2px dashed #ccc; margin: 15px 0; }
            .row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 15px; }
            .total { font-weight: bold; font-size: 18px; border-top: 1px solid #eee; padding-top: 8px; }
            .variance { background: #f9f9f9; padding: 10px; border-radius: 6px; font-weight: bold; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body onload="window.print();window.close();">
          <h2>GlobalAI ERP</h2>
          <p>End of Day Report</p>
          <div class="row"><strong>Date:</strong> <span>${new Date().toLocaleDateString()}</span></div>
          <div class="row"><strong>Time:</strong> <span>${new Date().toLocaleTimeString()}</span></div>
          <div class="row"><strong>Shift / Slot:</strong> <span>${activeSession?.id ? 'Shift #' + activeSession.id.slice(0, 8).toUpperCase() : 'Day Shift'}</span></div>
          <div class="divider"></div>
          <div class="row"><span>Cash Expected:</span> <strong>$${summary.cash.toFixed(2)}</strong></div>
          <div class="row"><span>Card Expected:</span> <strong>$${summary.card.toFixed(2)}</strong></div>
          <div class="row total"><span>Total Expected:</span> <span>$${summary.total.toFixed(2)}</span></div>
          <div class="divider"></div>
          <div class="row"><span>Actual Cash:</span> <strong>$${parseFloat(cashCount || 0).toFixed(2)}</strong></div>
          <div class="variance" style="color: ${variance === 0 ? '#16a34a' : '#e11d48'}">
            <span>Variance:</span>
            <span>${variance > 0 ? '+' : ''}$${variance.toFixed(2)}</span>
          </div>
          ${notes ? `<div class="divider"></div><div style="font-size: 13px;"><strong>Notes:</strong><p style="text-align: left; margin-top: 5px; font-style: italic;">${notes}</p></div>` : ''}
          <div class="divider" style="margin-top: 30px;"></div>
          <p style="font-size: 12px; margin-top: 20px; color: #999;">Shift Completed Successfully</p>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontWeight: 600, color: '#64748b' }}>Loading EOD details...</p>
      </div>
    );
  }

  if (!activeSession) {
    return (
      <div style={{ padding: 40, minHeight: '100vh', background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: "'Outfit', sans-serif" }}>
        <div style={{ width: '100%', maxWidth: 500, background: 'white', borderRadius: 32, padding: 40, textAlign: 'center', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <AlertCircle size={32} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>No Active Shift Session</h2>
          <p style={{ color: '#64748b', fontWeight: 600, fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
            You do not have an active shift session. You must start a shift session first to register EOD sales totals and perform EOD closing.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button 
              onClick={handleStartSession}
              style={{ width: '100%', padding: 16, borderRadius: 16, background: '#0a84ff', color: 'white', border: 'none', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}
            >
              Start Shift Session
            </button>
            <button 
              onClick={() => navigate('/')}
              style={{ width: '100%', padding: 16, borderRadius: 16, background: '#f1f5f9', color: '#64748b', border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'white', width: '100%', maxWidth: 450, padding: 48, borderRadius: 40, textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f0fdf4', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle2 size={40} />
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>EOD Closed</h2>
          <p style={{ color: '#64748b', fontWeight: 600, marginBottom: 40 }}>Your shift has been successfully completed and the drawer is balanced.</p>
          <div style={{ display: 'flex', gap: 16 }}>
            <button onClick={handlePrintEOD} style={{ flex: 1, padding: 16, borderRadius: 16, background: '#f1f5f9', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Printer size={20} /> Print
            </button>
            <button onClick={() => navigate('/')} style={{ flex: 1, padding: 16, borderRadius: 16, background: '#0a84ff', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer' }}>
              Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, minHeight: '100vh', background: '#f8fafc', display: 'flex', justifyContent: 'center', fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 800 }}>
        <header style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>End of Day Processing</h1>
          <p style={{ color: '#64748b', fontWeight: 600 }}>Verify drawer totals and close your active shift.</p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          {/* Sales Summary */}
          <div style={{ background: 'white', borderRadius: 32, padding: 40, border: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>Expected Totals</h2>
              <div style={{ padding: '6px 12px', background: '#f1f5f9', borderRadius: 10, fontSize: 11, fontWeight: 800, color: '#0a84ff' }}>
                {activeSession?.id ? `Shift #${activeSession.id.slice(0, 8).toUpperCase()}` : 'Active Shift'}
              </div>
            </div>
            
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 16, marginBottom: 24, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontWeight: 600 }}>
                <span>Report Date:</span>
                <strong style={{ color: '#0f172a' }}>{new Date().toLocaleDateString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontWeight: 600 }}>
                <span>Current Time:</span>
                <strong style={{ color: '#0f172a' }}>{new Date().toLocaleTimeString()}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f0fdf4', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DollarSign size={20} />
                  </div>
                  <span style={{ fontWeight: 700, color: '#64748b' }}>Cash Sales</span>
                </div>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>${summary.cash.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#eff6ff', color: '#0a84ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CreditCard size={20} />
                  </div>
                  <span style={{ fontWeight: 700, color: '#64748b' }}>Card Sales</span>
                </div>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>${summary.card.toFixed(2)}</span>
              </div>
              <div style={{ borderTop: '2px dashed #f1f5f9', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>Total Expected</span>
                <span style={{ fontSize: 24, fontWeight: 900, color: '#0f172a' }}>${summary.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Verification Form */}
          <div style={{ background: 'white', borderRadius: 32, padding: 40, border: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>ACTUAL CASH IN DRAWER</label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="number"
                  value={cashCount} onChange={e => setCashCount(e.target.value)}
                  placeholder="0.00"
                  style={{ width: '100%', padding: '16px 16px 16px 44px', borderRadius: 16, border: '2px solid #f1f5f9', outline: 'none', fontSize: 18, fontWeight: 900 }}
                />
              </div>
            </div>

            {cashCount && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 20, borderRadius: 16, background: variance === 0 ? '#f0fdf4' : '#fff1f2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: variance === 0 ? '#16a34a' : '#e11d48' }}>Variance</span>
                <span style={{ fontWeight: 900, color: variance === 0 ? '#16a34a' : '#e11d48' }}>{variance > 0 ? '+' : ''}${variance.toFixed(2)}</span>
              </motion.div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>NOTES / DISCREPANCIES</label>
              <textarea 
                value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Optional notes..."
                style={{ width: '100%', padding: 16, borderRadius: 16, border: '2px solid #f1f5f9', outline: 'none', fontSize: 14, fontWeight: 600, minHeight: 100, resize: 'none' }}
              />
            </div>

            <button 
              onClick={handleCloseEOD}
              style={{ marginTop: 'auto', padding: 20, borderRadius: 20, background: '#0f172a', color: 'white', border: 'none', fontSize: 18, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}
            >
              Complete EOD <ArrowRight size={22} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EODReport;
