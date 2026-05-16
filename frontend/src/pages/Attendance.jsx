import React, { useState, useEffect } from 'react';
import { 
  Clock, LogIn, LogOut, CheckCircle, AlertCircle, 
  Users, Calendar, ArrowRight, UserCheck, ShieldCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { attendanceAPI } from '../api';

const Attendance = () => {
  const [activeAttendance, setActiveAttendance] = useState(null);
  const [todayLogs, setTodayLogs] = useState([]);
  const [managerView, setManagerView] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); // Check role for manager view

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); // Live update every 3s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [myActiveRes, activeRes, todayRes] = await Promise.all([
        attendanceAPI.getMyActive(),
        attendanceAPI.getActive(),
        attendanceAPI.getToday()
      ]);
      
      setActiveAttendance(myActiveRes.data);
      setManagerView(activeRes.data);
      setTodayLogs(todayRes.data);
    } catch (err) {
      console.error('Attendance fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      await attendanceAPI.clockIn();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Clock-in failed');
    }
  };

  const handleClockOut = async () => {
    try {
      await attendanceAPI.clockOut();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Clock-out failed');
    }
  };

  return (
    <div style={{ padding: 40, minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
      <header style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>Attendance & Time Tracking</h1>
        <p style={{ color: '#64748b', fontWeight: 600 }}>Manage your work hours and monitor staff presence.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32 }}>
        {/* Left Column: Personal Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{ background: 'white', padding: 32, borderRadius: 32, border: '1px solid rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Clock size={40} color="#0f172a" />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Live Clock</h2>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#0a84ff', marginBottom: 32 }}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <button 
                disabled={activeAttendance}
                onClick={handleClockIn}
                style={{ 
                  padding: '16px', borderRadius: 16, background: activeAttendance ? '#e2e8f0' : '#10b981', color: activeAttendance ? '#94a3b8' : 'white', 
                  border: 'none', fontWeight: 800, fontSize: 16, cursor: activeAttendance ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                }}
              >
                <LogIn size={20} /> {activeAttendance ? 'Already Clocked In' : 'Clock In Now'}
              </button>
              <button 
                disabled={!activeAttendance}
                onClick={handleClockOut}
                style={{ 
                  padding: '16px', borderRadius: 16, background: 'white', color: !activeAttendance ? '#e2e8f0' : '#ef4444', 
                  border: `2px solid ${!activeAttendance ? '#f1f5f9' : '#fee2e2'}`, fontWeight: 800, fontSize: 16, cursor: !activeAttendance ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                }}
              >
                <LogOut size={20} /> Clock Out
              </button>
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: 32, borderRadius: 32, color: 'white' }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldCheck size={20} color="#10b981" /> Shift Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.7, fontSize: 14 }}>Scheduled</span>
                <span style={{ fontWeight: 700 }}>09:00 - 18:00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.7, fontSize: 14 }}>Duration</span>
                <span style={{ fontWeight: 700 }}>9 Hours</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.7, fontSize: 14 }}>Break Time</span>
                <span style={{ fontWeight: 700 }}>1 Hour</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Logs & Management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Today's Presence (Manager View) */}
          <div style={{ background: 'white', padding: 32, borderRadius: 32, border: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>Currently On Duty</h2>
              <span style={{ padding: '6px 12px', borderRadius: 20, background: '#dcfce7', color: '#10b981', fontSize: 12, fontWeight: 800 }}>
                {managerView.length} ACTIVE
              </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {managerView.map(item => (
                <div key={item.id} style={{ padding: 16, borderRadius: 20, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{item.Employee?.User?.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Clocked in at {new Date(item.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              ))}
              {managerView.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  No employees are currently clocked in.
                </div>
              )}
            </div>
          </div>

          {/* Today's Logs */}
          <div style={{ background: 'white', padding: 32, borderRadius: 32, border: '1px solid rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 24 }}>Today's Activity Log</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {todayLogs.map(log => (
                <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderRadius: 20, background: '#f8fafc' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#0a84ff', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserCheck size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{log.Employee?.User?.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Shift {log.status}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{new Date(log.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style={{ fontSize: 12, color: '#10b981', fontWeight: 700 }}>In</div>
                  </div>
                  <ArrowRight size={16} color="#cbd5e1" />
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>
                      {log.clockOut ? new Date(log.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </div>
                    <div style={{ fontSize: 12, color: log.clockOut ? '#ef4444' : '#94a3b8', fontWeight: 700 }}>Out</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
