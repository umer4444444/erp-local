import React, { useState, useEffect } from 'react';
import { 
  Package, ShoppingCart, Users, DollarSign, TrendingUp, 
  AlertTriangle, Briefcase, Activity, UserPlus, Clock, 
  ChevronRight, Calendar, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { inventoryAPI, managerAPI, salesAPI, shiftAPI, hrAPI, attendanceAPI } from '../api';

const StatCard = ({ title, value, icon, rgb, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    style={{
      background: 'white', padding: 24, borderRadius: 24,
      border: '1px solid rgba(0,0,0,0.05)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      display: 'flex', alignItems: 'center', gap: 20
    }}
  >
    <div style={{
      width: 54, height: 54, borderRadius: 16,
      background: `rgba(${rgb}, 0.1)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: `rgb(${rgb})`
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a' }}>{value}</div>
    </div>
  </motion.div>
);

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const role = user?.role || 'admin';
  const [stats, setStats] = useState({ totalSales: 0, totalProducts: 0, totalEmployees: 0, revenue: 0, totalRevenue: 0 });
  const [alerts, setAlerts] = useState({ lowStock: [], expiringSoon: [] });
  const [activeShift, setActiveShift] = useState(null);
  const [activeAttendance, setActiveAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch today's stats on button click
  const fetchTodayStats = async () => {
    try {
      const res = await salesAPI.getTodayStats();
      // Simple feedback – you can replace with a UI toast
      alert(`Today's sales: ${res.data.count || 0}, Revenue: $${res.data.revenue || 0}`);
    } catch (err) {
      console.error('Failed to fetch today stats', err);
      alert('Unable to retrieve today statistics');
    }
  };

  // Helper to download a CSV report using Blob
const handleDownloadReport = async () => {
  try {
    // Fetch sales history with a large limit
    const res = await salesAPI.getHistory({ limit: 1000, page: 1 });
    const rows = (res.data && res.data.rows) ? res.data.rows : (Array.isArray(res.data) ? res.data : []);
    if (!Array.isArray(rows) || rows.length === 0) {
      alert('No report data available to download');
      return;
    }
    const header = ['ID', 'Date', 'Amount', 'Employee'];
    const csvRows = rows.map(r => {
      const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleString() : '';
      const amountStr = r.grandTotal !== undefined && r.grandTotal !== null ? r.grandTotal : '0';
      const employeeName = r.User?.name || r.user?.name || '';
      return `"${r.id || ''}","${dateStr}","${amountStr}","${employeeName}"`;
    });
    const csvContent = [header.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sales_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Report download failed', err);
    alert('Unable to generate report');
  }
};

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesRes, prodRes, alertRes, shiftRes, hrRes] = await Promise.all([
          salesAPI.getTodayStats(),
          inventoryAPI.getProducts(),
          inventoryAPI.getAlerts(),
          shiftAPI.getActiveShift(),
          hrAPI.getStats()
        ]);
        
        setStats({
          totalSales: salesRes.data.count || 0,
          revenue: salesRes.data.revenue || 0,
          totalRevenue: salesRes.data.totalRevenue || 0,
          netProfit: salesRes.data.netProfit || 0,
          totalProducts: prodRes.data.length || 0,
          totalEmployees: hrRes.data.totalEmployees || 0,
          activeEmployees: hrRes.data.activeEmployees || 0,
          maleEmployees: hrRes.data.maleEmployees || 0,
          femaleEmployees: hrRes.data.femaleEmployees || 0
        });
        setAlerts(alertRes.data);
        setActiveShift(shiftRes.data);

        // Fetch user's active attendance
        const attendanceRes = await attendanceAPI.getMyActive();
        setActiveAttendance(attendanceRes.data);
      } catch (err) {
        console.error('Dashboard data fetch failed', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 3000); // Polling every 3 seconds for instant updates
    return () => clearInterval(interval);
  }, []);

  const AdminDash = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 24, marginBottom: 32 }}>
      <StatCard title="Total Revenue" value={`$${stats.totalRevenue || 0}`} icon={<TrendingUp />} rgb="34,197,94" delay={0.1} />
      <StatCard title="Net Profit" value={`$${stats.netProfit || 0}`} icon={<Activity />} rgb="16,185,129" delay={0.2} />
      <StatCard title="Today's Sales" value={stats.totalSales} icon={<ShoppingCart />} rgb="10,132,255" delay={0.3} />
      <StatCard title="Low Stock" value={alerts.lowStock?.length || 0} icon={<AlertTriangle />} rgb="249,115,22" delay={0.4} />
      <StatCard 
        title="Staff Strength" 
        value={
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span>{stats.activeEmployees}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>({stats.maleEmployees || 0}M / {stats.femaleEmployees || 0}F)</span>
          </div>
        } 
        icon={<Users />} 
        rgb="168,85,247" 
        delay={0.5} 
      />
    </div>
  );

  const CashierDash = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          style={{ background: 'linear-gradient(135deg, #0a84ff, #0055ff)', borderRadius: 32, padding: 40, color: 'white', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12 }}>Ready to sell?</h2>
            <p style={{ opacity: 0.8, marginBottom: 32, maxWidth: 400 }}>Access the sales terminal to process transactions and manage customer orders efficiently.</p>
            <button 
              onClick={() => navigate('/sales')}
              style={{ background: 'white', color: '#0a84ff', border: 'none', padding: '14px 28px', borderRadius: 16, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
            >
              Open Terminal <ArrowUpRight size={18} />
            </button>
          </div>
          <ShoppingCart size={200} style={{ position: 'absolute', right: -40, bottom: -40, opacity: 0.1, rotate: '-15deg' }} />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          style={{ background: 'white', borderRadius: 32, padding: 32, border: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
        >
          <div style={{ color: '#64748b', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>ATTENDANCE STATUS</div>
          {activeAttendance ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 12px rgba(34,197,94,0.5)' }} />
                <span style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>On Duty</span>
              </div>
              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 20 }}>
                Clocked in at {new Date(activeAttendance.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <button 
                onClick={async (e) => {
                  e.currentTarget.disabled = true;
                  try {
                    await attendanceAPI.clockOut();
                    const res = await attendanceAPI.getMyActive();
                    setActiveAttendance(res.data);
                  } catch (err) { alert(err.response?.data?.message || 'Clock out failed'); }
                  finally { e.currentTarget.disabled = false; }
                }}
                style={{ width: '100%', padding: '12px', borderRadius: 14, background: '#fee2e2', color: '#ef4444', border: 'none', fontWeight: 800, cursor: 'pointer' }}
              >
                Quick Clock Out
              </button>
            </div>
          ) : (
            <button 
              onClick={async (e) => {
                const btn = e.currentTarget;
                btn.disabled = true;
                const clockInWithCoords = async (latitude, longitude) => {
                  try {
                    await attendanceAPI.clockIn({ latitude, longitude });
                    const res = await attendanceAPI.getMyActive();
                    setActiveAttendance(res.data);
                  } catch (err) {
                    alert(err.response?.data?.message || 'Clock in failed');
                  } finally {
                    btn.disabled = false;
                  }
                };

                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      clockInWithCoords(position.coords.latitude, position.coords.longitude);
                    },
                    (error) => {
                      // Fallback to office location if denied or not available
                      clockInWithCoords(31.5204, 74.3587);
                    }
                  );
                } else {
                  clockInWithCoords(31.5204, 74.3587);
                }
              }}
              style={{ width: '100%', padding: '16px', borderRadius: 16, background: '#f1f5f9', border: 'none', color: '#0f172a', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            >
              <Clock size={18} /> Clock In Now
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '40px', minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>
            Good morning, <span style={{ color: '#0a84ff' }}>{user?.name?.split(' ')[0] || 'Admin'}</span>
          </h1>
          <p style={{ color: '#64748b', marginTop: 4, fontWeight: 500 }}>Here's what's happening with your business today.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{ padding: '12px 20px', borderRadius: 14, border: '1px solid #e2e8f0', background: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => { fetchTodayStats(); }}>
            <Calendar size={18} /> Today
          </button>
          <button style={{ padding: '12px 20px', borderRadius: 14, background: '#0f172a', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer' }} onClick={handleDownloadReport}>
            Download Report
          </button>
        </div>
      </header>

      <AnimatePresence>
        {(role === 'admin' || role === 'inventory') && alerts.expiringSoon?.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', marginBottom: 24 }}
          >
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: '16px 24px', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#991b1b' }}>CRITICAL: Expiring Inventory</div>
                  <div style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>{alerts.expiringSoon.length} products are expiring within 30 days.</div>
                </div>
              </div>
              <button onClick={() => navigate('/inventory', { state: { filter: 'expiringSoon' } })} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
                Review Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {role === 'admin' && (
        <>
          <AdminDash />
          {alerts.lowStock?.length > 0 && (
            <div style={{ background: 'white', padding: 32, borderRadius: 32, border: '1px solid rgba(0,0,0,0.05)', marginTop: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={20} color="#f59e0b" /> Critical Low Stock Items
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
                {alerts.lowStock.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => navigate('/inventory', { state: { filter: item.name } })}
                    style={{ padding: 16, borderRadius: 16, background: '#fff7ed', border: '1px solid #ffedd5', cursor: 'pointer' }}
                  >
                    <div style={{ fontWeight: 800, color: '#9a3412' }}>{item.name}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#c2410c' }}>Current Stock: {item.stock} (Min: {item.minStock})</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      {role === 'cashier' && <CashierDash />}
      {role === 'manager' && <AdminDash />}
      
    </div>
  );
};

export default Dashboard;
