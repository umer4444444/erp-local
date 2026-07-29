import React, { useState, useEffect } from 'react';
import { 
  Users, DollarSign, Clock, AlertCircle, ChevronRight, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { hrAPI, attendanceAPI } from '../api';

const HR = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalEmployees: 0, activeEmployees: 0, avgHours: 0, estPayroll: 0, pendingLeaves: 0, unverifiedShifts: 0 });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statRes, attendRes] = await Promise.all([
          hrAPI.getStats(),
          attendanceAPI.getToday().catch(() => ({ data: [] }))
        ]);
        setStats(statRes.data);
        setRecentAttendance(attendRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const StatBox = ({ title, value, icon, color, subtitle, onClick }) => (
    <motion.div whileHover={{ y: -2 }} onClick={onClick}
      style={{ background: 'white', padding: 24, borderRadius: 24, border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 20, cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>{title}</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>{loading ? '...' : value}</div>
        {subtitle && <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {onClick && <ChevronRight size={16} color="#94a3b8" />}
    </motion.div>
  );

  const deptCounts = {};
  recentAttendance.forEach(a => {
    const dept = a.Employee?.Department?.name || 'General';
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });
  const deptEntries = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(...deptEntries.map(([, c]) => c), 1);

  return (
    <div style={{ padding: '100px 40px 40px 40px', minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>HR & Payroll Center</h1>
          <p style={{ color: '#64748b', fontWeight: 600 }}>Manage staff performance, shifts, and earnings.</p>
        </div>
        <button onClick={() => navigate('/employees', { state: { openAddModal: true } })} 
          style={{ padding: '12px 20px', borderRadius: 14, background: '#0a84ff', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>
          + Add Employee
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40 }}>
        <StatBox title="Total Staff" value={stats.totalEmployees} icon={<Users size={24} />} color="#0a84ff"
          subtitle={`${stats.activeEmployees} active`} onClick={() => navigate('/employees')} />
        <StatBox title="Clocked In Now" value={recentAttendance.filter(a => !a.clockOut).length} icon={<Activity size={24} />} color="#10b981"
          subtitle="Live attendance count" onClick={() => navigate('/attendance')} />
        <StatBox title="Avg. Hours" value={`${(stats.avgHours || 0).toFixed(0)}h`} icon={<Clock size={24} />} color="#f59e0b"
          subtitle="Based on shift audit" />
        <StatBox title="Est. Payroll" value={`SAR ${(stats.estPayroll || 0).toLocaleString()}`} icon={<DollarSign size={24} />} color="#a855f7"
          subtitle="This month" onClick={() => navigate('/payroll')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, marginBottom: 32 }}>
        <div style={{ background: 'white', borderRadius: 24, border: '1px solid rgba(0,0,0,0.05)', padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>Today's Attendance</h2>
            <button onClick={() => navigate('/attendance')} style={{ color: '#0a84ff', background: 'transparent', border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentAttendance.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontWeight: 700 }}>No attendance records today.</div>
            ) : recentAttendance.slice(0, 6).map(att => {
              const name = att.Employee?.User?.name || 'Unknown';
              const clockIn = new Date(att.clockIn).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true });
              const isActive = !att.clockOut;
              return (
                <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', borderRadius: 16, border: '1px solid #f1f5f9', background: isActive ? '#f0fdf4' : '#fafafa' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: isActive ? '#dcfce7' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: isActive ? '#16a34a' : '#64748b', fontSize: 14 }}>
                    {name[0]}{name.split(' ')[1]?.[0] || ''}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{name}</div>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>In: {clockIn}{att.lateMinutes > 0 ? ` • ${att.lateMinutes}min late` : ''}</div>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, background: isActive ? '#dcfce7' : '#f1f5f9', color: isActive ? '#16a34a' : '#64748b' }}>
                    {isActive ? 'ON DUTY' : 'CLOCKED OUT'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ background: '#0f172a', borderRadius: 24, padding: 32, color: 'white' }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Hiring Talent?</h3>
            <p style={{ opacity: 0.7, fontSize: 14, marginBottom: 24, fontWeight: 500 }}>Add new employees and set up their payroll profiles in minutes.</p>
            <button onClick={() => navigate('/employees', { state: { openAddModal: true } })} style={{ width: '100%', padding: 14, borderRadius: 14, background: 'white', color: '#0f172a', border: 'none', fontWeight: 800, cursor: 'pointer' }}>
              Launch Onboarding
            </button>
          </div>

          <div style={{ background: 'white', borderRadius: 24, border: '1px solid rgba(0,0,0,0.05)', padding: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', marginBottom: 16 }}>Pending Reviews</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <motion.div whileHover={{ x: 4 }} onClick={() => navigate('/attendance')}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, background: '#fff7ed', cursor: 'pointer', border: '1px solid #fed7aa' }}>
                <AlertCircle size={16} color="#f59e0b" />
                <div style={{ flex: 1, fontWeight: 700, color: '#92400e', fontSize: 13 }}>{stats.unverifiedShifts || 0} Unverified shift logs</div>
                <ChevronRight size={14} color="#f59e0b" />
              </motion.div>
              <motion.div whileHover={{ x: 4 }} onClick={() => navigate('/leaves')}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, background: '#eff6ff', cursor: 'pointer', border: '1px solid #bfdbfe' }}>
                <Clock size={16} color="#0a84ff" />
                <div style={{ flex: 1, fontWeight: 700, color: '#1e40af', fontSize: 13 }}>{stats.pendingLeaves || 0} Leave requests pending</div>
                <ChevronRight size={14} color="#0a84ff" />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {deptEntries.length > 0 && (
        <div style={{ background: 'white', borderRadius: 24, border: '1px solid rgba(0,0,0,0.05)', padding: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 24 }}>Today's Attendance by Department</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {deptEntries.map(([dept, count]) => (
              <div key={dept} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 140, fontSize: 13, fontWeight: 700, color: '#0f172a', textAlign: 'right', flexShrink: 0 }}>{dept}</div>
                <div style={{ flex: 1, height: 32, background: '#f1f5f9', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(count / maxCount) * 100}%`, background: 'linear-gradient(90deg, #0a84ff, #6366f1)', borderRadius: 8, display: 'flex', alignItems: 'center', paddingLeft: 12, minWidth: 36 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>{count}</span>
                  </div>
                </div>
                <div style={{ width: 60, fontSize: 13, fontWeight: 800, color: '#64748b' }}>{count} staff</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HR;
