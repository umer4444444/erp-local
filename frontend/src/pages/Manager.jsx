import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { 
  Shield, Users, Activity, TrendingUp, DollarSign, 
  ArrowUpRight, Clock, UserCheck, ShieldCheck, Zap,
  BarChart3, Target, Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { managerAPI, employeeAPI } from '../api';

const Manager = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState({ revenue: 0, salesCount: 0, activeStaff: 0 });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const exportStaffData = () => {
    if (!employees || employees.length === 0) {
      alert("No employee data to export");
      return;
    }
    const headers = ['First Name', 'Last Name', 'Email', 'Position', 'Status', 'Salary'];
    const csvRows = [
      headers.join(','),
      ...employees.map(emp => [
        `"${emp.firstName || ''}"`,
        `"${emp.lastName || ''}"`,
        `"${emp.User?.email || emp.email || ''}"`,
        `"${emp.position || ''}"`,
        `"${emp.status || ''}"`,
        emp.salary || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'staff_directory.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || '';
    const socket = io(socketUrl, {
      auth: { token: localStorage.getItem('token') }
    }); // connect to backend socket server
    socket.on('staffEngagementUpdated', data => {
      setOverview(prev => ({ ...prev, activeStaff: data.activeStaff }));
    });
    const fetchData = async () => {
      try {
        const [ovRes, empRes] = await Promise.all([
          managerAPI.getOverview(),
          employeeAPI.getAll()
        ]);
        setOverview(ovRes.data || { revenue: 0, salesCount: 0, activeStaff: 0 });
        setEmployees(empRes.data?.employees || []);
      } catch (err) {
        console.error('Manager Hub fetch failed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  const StatBox = ({ title, value, sub, icon, rgb }) => (
    <div style={{ background: 'white', padding: 28, borderRadius: 28, border: '1px solid rgba(0,0,0,0.05)', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20 }}>
        <div style={{ width: 50, height: 50, borderRadius: 16, background: `rgba(${rgb}, 0.1)`, color: `rgb(${rgb})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10b981', fontSize: 13, fontWeight: 700 }}>
          <ArrowUpRight size={14} /> +12%
        </div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ padding: 40, minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={18} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Administrative Portal</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>Executive Command Center</h1>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={exportStaffData} style={{ padding: '12px 24px', borderRadius: 14, background: 'white', border: '1px solid #e2e8f0', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={18} /> Export Data
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', gap: 24, marginBottom: 40 }}>
        <StatBox title="Net Revenue" value={`$${(parseFloat(overview.revenue || 0)).toLocaleString()}`} sub="Current billing cycle" icon={<DollarSign />} rgb="34,197,94" />
        <StatBox title="Transaction Volume" value={overview.salesCount || 0} sub="Last 24 hours" icon={<Zap />} rgb="10,132,255" />
        <StatBox title="Staff Engagement" value={overview.activeStaff || 0} sub="Members currently clocked in" icon={<Users />} rgb="168,85,247" />
        <StatBox title="Operations Score" value="98.2%" sub="System health & stability" icon={<Target />} rgb="249,115,22" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32 }}>
        {/* Staff Management */}
        <div style={{ background: 'white', borderRadius: 32, border: '1px solid rgba(0,0,0,0.05)', padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>Staff Directory</h2>
            <button onClick={() => navigate('/users')} style={{ padding: '10px 18px', borderRadius: 12, background: '#f1f5f9', border: 'none', color: '#0f172a', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserCheck size={16} /> Manage Roles
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {employees.map(emp => (
              <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderRadius: 20, background: '#f8fafc', border: '1px solid transparent' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#0a84ff', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16 }}>
                  {(emp.firstName || '')[0]}{(emp.lastName || '')[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{emp.firstName} {emp.lastName}</div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{emp.Designation?.name || emp.position || 'Staff'} • {emp.status}</div>
                </div>
                <button onClick={() => navigate('/employees')} style={{ padding: '8px 14px', borderRadius: 10, background: 'white', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                  Profile
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* System Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 32, padding: 32, color: 'white' }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Activity size={20} color="#0a84ff" /> Live Connectivity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.7 }}>Database</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#22c55e' }}>ONLINE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.7 }}>Cloud Backup</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#22c55e' }}>SYNCED</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.7 }}>API Response</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0a84ff' }}>24ms</span>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 32, border: '1px solid rgba(0,0,0,0.05)', padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Info size={20} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>Management Tip</h3>
            </div>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, fontWeight: 500 }}>
              Inventory levels for "Tools" products are currently 15% below threshold. Consider restocking before the weekend rush.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Manager;
