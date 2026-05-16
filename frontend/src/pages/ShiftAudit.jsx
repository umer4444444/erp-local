import React, { useState, useEffect } from 'react';
import { 
  Clock, DollarSign, Calendar, Search, Download, 
  ArrowUpRight, Users, Briefcase, Filter, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { attendanceAPI } from '../api';

const ShiftAudit = () => {
  const [auditData, setAuditData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAudit();
  }, [dateRange]);

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const res = await attendanceAPI.getAudit({
        startDate: dateRange.start,
        endDate: dateRange.end
      });
      setAuditData(res.data);
    } catch (err) {
      console.error('Audit fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  const totalEarnings = auditData.reduce((sum, item) => sum + item.earned, 0);
  const totalHours = auditData.reduce((sum, item) => sum + item.hours, 0);

  return (
    <div style={{ padding: 40, minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>Shift Audit</h1>
          <p style={{ color: '#64748b', fontWeight: 600 }}>Calculate earnings and analyze shift productivity.</p>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', background: 'white', padding: '6px', borderRadius: 16, border: '1px solid #e2e8f0' }}>
            <input 
              type="date" 
              value={dateRange.start} 
              onChange={e => setDateRange({...dateRange, start: e.target.value})}
              style={{ border: 'none', padding: '8px 12px', fontSize: 13, fontWeight: 700, color: '#0f172a', outline: 'none' }} 
            />
            <div style={{ padding: '8px 4px', color: '#94a3b8' }}>-</div>
            <input 
              type="date" 
              value={dateRange.end} 
              onChange={e => setDateRange({...dateRange, end: e.target.value})}
              style={{ border: 'none', padding: '8px 12px', fontSize: 13, fontWeight: 700, color: '#0f172a', outline: 'none' }} 
            />
          </div>
          <button style={{ padding: '12px 24px', borderRadius: 16, background: '#0a84ff', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={18} /> Export Report
          </button>
        </div>
      </header>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 40 }}>
        <div style={{ background: 'white', padding: 24, borderRadius: 24, border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(10,132,255,0.1)', color: '#0a84ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={20} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Total Estimated Payroll</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        
        <div style={{ background: 'white', padding: 24, borderRadius: 24, border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Total Hours Worked</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>{totalHours.toFixed(2)}h</div>
        </div>

        <div style={{ background: 'white', padding: 24, borderRadius: 24, border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(168,85,247,0.1)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Employees Active</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>{[...new Set(auditData.map(a => a.empCode))].length}</div>
        </div>
      </div>

      {/* Audit Table */}
      <div style={{ background: 'white', padding: 32, borderRadius: 32, border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 10px 40px rgba(0,0,0,0.02)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                <th style={{ padding: '16px', color: '#64748b', fontSize: 13, fontWeight: 800 }}>EMPLOYEE</th>
                <th style={{ padding: '16px', color: '#64748b', fontSize: 13, fontWeight: 800 }}>CLOCK IN</th>
                <th style={{ padding: '16px', color: '#64748b', fontSize: 13, fontWeight: 800 }}>CLOCK OUT</th>
                <th style={{ padding: '16px', color: '#64748b', fontSize: 13, fontWeight: 800 }}>HOURS</th>
                <th style={{ padding: '16px', color: '#64748b', fontSize: 13, fontWeight: 800 }}>RATE</th>
                <th style={{ padding: '16px', color: '#64748b', fontSize: 13, fontWeight: 800 }}>EARNED</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading audit data...</td></tr>
              ) : auditData.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No shift records found for this period.</td></tr>
              ) : (
                auditData.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{item.employeeName}</div>
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>{item.empCode}</div>
                    </td>
                    <td style={{ padding: '16px', fontSize: 14, fontWeight: 600, color: '#475569' }}>
                      {new Date(item.clockIn).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px', fontSize: 14, fontWeight: 600, color: '#475569' }}>
                      {item.clockOut ? new Date(item.clockOut).toLocaleString() : <span style={{ color: '#0a84ff' }}>Active</span>}
                    </td>
                    <td style={{ padding: '16px', fontWeight: 800, color: '#0f172a' }}>
                      {item.hours}h
                    </td>
                    <td style={{ padding: '16px', fontSize: 14, fontWeight: 700, color: '#64748b' }}>
                      ${item.rate}/{item.salaryType === 'hourly' ? 'hr' : 'mo'}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 900, display: 'inline-block' }}>
                        ${item.earned.toFixed(2)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ShiftAudit;
