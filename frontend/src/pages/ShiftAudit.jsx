import React, { useState, useEffect } from 'react';
import { 
  Clock, DollarSign, Download, X, AlertTriangle, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { attendanceAPI } from '../api';

const STANDARD_DAILY_HOURS = 8;

const ShiftAudit = () => {
  const [auditData, setAuditData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => { fetchAudit(); }, [dateRange]);

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const res = await attendanceAPI.getAudit({ startDate: dateRange.start, endDate: dateRange.end });
      setAuditData(res.data);
    } catch (err) {
      console.error('Audit fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  const totalEarnings = auditData.reduce((sum, item) => sum + (item.earned || 0), 0);
  const totalHours = auditData.reduce((sum, item) => sum + (item.hours || 0), 0);
  const totalOvertime = auditData.reduce((sum, item) => sum + Math.max(0, (item.hours || 0) - STANDARD_DAILY_HOURS), 0);

  const exportReport = () => {
    if (!auditData || auditData.length === 0) { alert('No shift records to export.'); return; }
    const headers = ['Employee Name', 'Emp Code', 'Date', 'Clock In', 'Clock Out', 'Hours', 'Overtime', 'Rate', 'Earned', 'Salary Type'];
    const rows = auditData.map(item => {
      const d = item.clockIn ? new Date(item.clockIn) : null;
      return [
        `"${item.employeeName || ''}"`,
        `"${item.empCode || ''}"`,
        d ? `"${d.toLocaleDateString('en-PK')}"` : '""',
        d ? `"${d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })}"` : '""',
        item.clockOut ? `"${new Date(item.clockOut).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })}"` : '"Active"',
        item.hours || 0,
        Math.max(0, (item.hours || 0) - STANDARD_DAILY_HOURS).toFixed(2),
        item.rate || 0,
        item.earned || 0,
        `"${item.salaryType || ''}"`,
      ];
    });
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `shift_audit_${dateRange.start}_to_${dateRange.end}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: 40, minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>Shift Audit</h1>
          <p style={{ color: '#64748b', fontWeight: 600 }}>Calculate earnings and analyze shift productivity.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', background: 'white', padding: '6px', borderRadius: 16, border: '1px solid #e2e8f0' }}>
            <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})}
              style={{ border: 'none', padding: '8px 12px', fontSize: 13, fontWeight: 700, color: '#0f172a', outline: 'none' }} />
            <div style={{ padding: '8px 4px', color: '#94a3b8' }}>—</div>
            <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})}
              style={{ border: 'none', padding: '8px 12px', fontSize: 13, fontWeight: 700, color: '#0f172a', outline: 'none' }} />
          </div>
          <button
            onClick={exportReport}
            disabled={auditData.length === 0}
            title={auditData.length === 0 ? 'No data to export' : 'Export as CSV'}
            style={{ padding: '12px 24px', borderRadius: 16, background: auditData.length === 0 ? '#e2e8f0' : '#0a84ff', color: auditData.length === 0 ? '#94a3b8' : 'white', border: 'none', fontWeight: 800, cursor: auditData.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={18} /> Export Report
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40 }}>
        {[
          { label: 'Total Estimated Payroll', value: `$${totalEarnings.toFixed(2)}`, color: '#0a84ff', icon: <DollarSign size={20} /> },
          { label: 'Total Hours Worked', value: `${totalHours.toFixed(2)}h`, color: '#10b981', icon: <Clock size={20} /> },
          { label: 'Total Overtime', value: `${totalOvertime.toFixed(2)}h`, color: '#f59e0b', icon: <AlertTriangle size={20} /> },
          { label: 'Employees Active', value: [...new Set(auditData.map(a => a.empCode))].length, color: '#a855f7', icon: <Users size={20} /> },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'white', padding: 24, borderRadius: 24, border: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${stat.color}18`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{stat.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>{stat.label}</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', padding: 32, borderRadius: 32, border: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                {['EMPLOYEE', 'DATE', 'CLOCK IN', 'CLOCK OUT', 'HOURS', 'OVERTIME', 'RATE', 'EARNED'].map(h => (
                  <th key={h} style={{ padding: '16px', color: '#64748b', fontSize: 12, fontWeight: 800 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading audit data...</td></tr>
              ) : auditData.length === 0 ? (
                <tr><td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No shift records found for this period.</td></tr>
              ) : (
                auditData.map((item, i) => {
                  const overtime = Math.max(0, (item.hours || 0) - STANDARD_DAILY_HOURS);
                  const clockInDate = item.clockIn ? new Date(item.clockIn) : null;
                  const dateStr = clockInDate ? clockInDate.toLocaleDateString('en-PK', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
                  const clockInTime = clockInDate ? clockInDate.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
                  const clockOutTime = item.clockOut ? new Date(item.clockOut).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true }) : null;
                  return (
                    <tr key={i} onClick={() => setSelectedRow(item)}
                      style={{ borderBottom: '1px solid #f8fafc', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{item.employeeName}</div>
                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>{item.empCode}</div>
                      </td>
                      <td style={{ padding: '16px', fontSize: 13, fontWeight: 700, color: '#475569' }}>{dateStr}</td>
                      <td style={{ padding: '16px', fontSize: 13, fontWeight: 600, color: '#10b981' }}>{clockInTime}</td>
                      <td style={{ padding: '16px', fontSize: 13, fontWeight: 600 }}>
                        {clockOutTime ? <span style={{ color: '#ef4444' }}>{clockOutTime}</span> : <span style={{ color: '#0a84ff' }}>Active</span>}
                      </td>
                      <td style={{ padding: '16px', fontWeight: 800, color: '#0f172a' }}>{item.hours}h</td>
                      <td style={{ padding: '16px' }}>
                        {overtime > 0
                          ? <span style={{ padding: '4px 10px', borderRadius: 8, background: '#fef3c7', color: '#d97706', fontWeight: 800, fontSize: 12 }}>+{overtime.toFixed(1)}h OT</span>
                          : <span style={{ color: '#94a3b8' }}>—</span>}
                      </td>
                      <td style={{ padding: '16px', fontSize: 13, fontWeight: 700, color: '#64748b' }}>
                        ${item.rate}/{item.salaryType === 'hourly' ? 'hr' : 'mo'}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 900, display: 'inline-block' }}>
                          ${(item.earned || 0).toFixed(2)}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedRow && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedRow(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              style={{ background: 'white', borderRadius: 28, width: '100%', maxWidth: 480, position: 'relative', padding: 36, zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>Shift Details</h2>
                <button onClick={() => setSelectedRow(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#94a3b8" /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['Employee', selectedRow.employeeName],
                  ['Emp Code', selectedRow.empCode || '—'],
                  ['Date', selectedRow.clockIn ? new Date(selectedRow.clockIn).toLocaleDateString('en-PK', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'],
                  ['Clock In', selectedRow.clockIn ? new Date(selectedRow.clockIn).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'],
                  ['Clock Out', selectedRow.clockOut ? new Date(selectedRow.clockOut).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Still Active'],
                  ['Total Hours', `${selectedRow.hours}h`],
                  ['Overtime', `${Math.max(0, (selectedRow.hours || 0) - STANDARD_DAILY_HOURS).toFixed(2)}h`],
                  ['Salary Rate', `$${selectedRow.rate} / ${selectedRow.salaryType === 'hourly' ? 'hr' : 'month'}`],
                  ['Estimated Earned', `$${(selectedRow.earned || 0).toFixed(2)}`],
                  ['Status', selectedRow.status || '—'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 12, background: '#f8fafc' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShiftAudit;
