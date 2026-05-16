import React, { useState, useEffect } from 'react';
import { 
  Users, Briefcase, DollarSign, Clock, CheckCircle, XCircle, 
  AlertCircle, Search, Filter, ArrowUpRight, TrendingUp, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { hrAPI, shiftAPI } from '../api';

const HR = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [stats, setStats] = useState({ totalEmployees: 0, activeEmployees: 0, avgHours: 0, estPayroll: 0, pendingLeaves: 0, unverifiedShifts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, shiftRes, statRes] = await Promise.all([
          hrAPI.getEmployees(),
          shiftAPI.getHistory(),
          hrAPI.getStats()
        ]);
        setEmployees(empRes.data);
        setShifts(shiftRes.data);
        setStats(statRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const StatBox = ({ title, value, icon, color }) => (
    <div style={{ background: 'white', padding: 24, borderRadius: 24, border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 20 }}>
      <div style={{ width: 50, height: 50, borderRadius: 14, background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>{title}</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a' }}>{value}</div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: 40, minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
      <header style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>HR & Payroll Center</h1>
        <p style={{ color: '#64748b', fontWeight: 600 }}>Manage staff performance, shifts, and earnings audit.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40 }}>
        <StatBox title="Total Staff" value={stats.totalEmployees} icon={<Users />} color="#0a84ff" />
        <StatBox title="Active Now" value={stats.activeEmployees} icon={<Activity size={24} />} color="#10b981" />
        <StatBox title="Avg. Hours" value={stats.avgHours || 0} icon={<Clock />} color="#f59e0b" />
        <StatBox title="Est. Payroll" value={`$${(stats.estPayroll || 0).toLocaleString()}`} icon={<DollarSign />} color="#a855f7" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 32 }}>
        {/* Shift Audit */}
        <div style={{ background: 'white', borderRadius: 24, border: '1px solid rgba(0,0,0,0.05)', padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>Recent Shift Audits</h2>
            <button onClick={() => navigate('/attendance')} style={{ color: '#0a84ff', background: 'transparent', border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {shifts.slice(0, 5).map(shift => (
              <div key={shift.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', borderRadius: 16, border: '1px solid #f1f5f9' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                  <Calendar size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{shift.User?.name || 'Staff Member'}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                    {new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {shift.endTime ? new Date(shift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 900, color: '#10b981' }}>+${shift.earnings || '0.00'}</div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>{shift.totalHours || '0'} hrs</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ background: '#0f172a', borderRadius: 24, padding: 32, color: 'white' }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Hiring Talent?</h3>
            <p style={{ opacity: 0.7, fontSize: 14, marginBottom: 24, fontWeight: 500 }}>Add new employees and set up their payroll profiles in minutes.</p>
            <button onClick={() => navigate('/employees', { state: { openAddModal: true } })} style={{ width: '100%', padding: 14, borderRadius: 14, background: 'white', color: '#0f172a', border: 'none', fontWeight: 800, cursor: 'pointer' }}>
              Launch Onboarding
            </button>
          </div>

          <div style={{ background: 'white', borderRadius: 24, border: '1px solid rgba(0,0,0,0.05)', padding: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 16 }}>Pending Reviews</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div onClick={() => navigate('/attendance')} style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                <AlertCircle size={16} color="#f59e0b" /> {stats.unverifiedShifts || 0} Unverified shift logs
              </div>
              <div onClick={() => navigate('/leaves')} style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                <Clock size={16} color="#0a84ff" /> {stats.pendingLeaves || 0} Leave requests
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HR;
const Activity = ({ size }) => <TrendingUp size={size} />;
