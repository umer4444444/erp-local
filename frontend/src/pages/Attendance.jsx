import React, { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, CheckCircle, AlertCircle, Users, Calendar, ArrowRight, UserCheck, ShieldCheck, MapPin, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { attendanceAPI } from '../api';

const OFFICE_LAT = 31.5204;  // Configure your office lat/lng here
const OFFICE_LNG = 74.3587;
const GEOFENCE_RADIUS_M = 500; // 500 meter radius

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // metres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const Attendance = () => {
  const [activeAttendance, setActiveAttendance] = useState(null);
  const [todayLogs, setTodayLogs] = useState([]);
  const [managerView, setManagerView] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gpsStatus, setGpsStatus] = useState('idle'); // idle | checking | inside | outside | error
  const [gpsDistance, setGpsDistance] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [clockInLoading, setClockInLoading] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date());

  // Live clock
  useEffect(() => {
    const tick = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
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

  const checkGPS = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return; }
    setGpsStatus('checking');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        const dist = haversineDistance(latitude, longitude, OFFICE_LAT, OFFICE_LNG);
        setGpsDistance(Math.round(dist));
        const inside = dist <= GEOFENCE_RADIUS_M;
        setGpsStatus(inside ? 'inside' : 'outside');
        resolve({ latitude, longitude, distance: dist, inside });
      },
      (err) => { setGpsStatus('error'); reject(err); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  const handleClockIn = async () => {
    setClockInLoading(true);
    try {
      const gps = await checkGPS();
      // Pass coordinates to backend for server-side geofence check too
      await attendanceAPI.clockIn({ latitude: gps.latitude, longitude: gps.longitude });
      fetchData();
    } catch (err) {
      if (err.message === 'Geolocation not supported') {
        // Fallback: try without GPS
        try {
          await attendanceAPI.clockIn({});
          fetchData();
        } catch (e) { alert(e.response?.data?.message || 'Clock-in failed'); }
      } else if (gpsStatus === 'outside') {
        alert(`You are ${gpsDistance}m from the office. Geofence radius is ${GEOFENCE_RADIUS_M}m. Clock-in denied.`);
      } else {
        alert(err.response?.data?.message || 'Clock-in failed');
      }
    } finally {
      setClockInLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      await attendanceAPI.clockOut();
      setGpsStatus('idle');
      setGpsDistance(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Clock-out failed');
    }
  };

  const gpsStatusConfig = {
    idle:     { color: '#64748b', bg: '#f1f5f9', label: 'Location not checked' },
    checking: { color: '#f59e0b', bg: '#fffbeb', label: 'Checking location...' },
    inside:   { color: '#10b981', bg: '#dcfce7', label: `Inside zone (${gpsDistance}m away)` },
    outside:  { color: '#ef4444', bg: '#fee2e2', label: `Outside zone (${gpsDistance}m away)` },
    error:    { color: '#ef4444', bg: '#fee2e2', label: 'GPS unavailable' },
  };

  const gpsInfo = gpsStatusConfig[gpsStatus];

  const totalHoursToday = todayLogs
    .filter(l => l.clockOut)
    .reduce((sum, l) => {
      const diff = (new Date(l.clockOut) - new Date(l.clockIn)) / 3600000;
      return sum + diff;
    }, 0);

  return (
    <div style={{ padding: 40, minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
      <header style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>Attendance & Time Tracking</h1>
        <p style={{ color: '#64748b', fontWeight: 600 }}>Manage your work hours and monitor staff presence.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32 }}>
        {/* Left Column: Personal Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Clock Widget */}
          <div style={{ background: 'white', padding: 32, borderRadius: 32, border: '1px solid rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Clock size={40} color="#0f172a" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Live Clock</h2>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#0a84ff', marginBottom: 4, fontVariantNumeric: 'tabular-nums' }}>
              {liveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, marginBottom: 28 }}>
              {liveTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            
            {/* GPS Status Indicator */}
            {!activeAttendance && (
              <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 12, background: gpsInfo.bg, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                {gpsStatus === 'checking' ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <Navigation size={14} color={gpsInfo.color} />
                  </motion.div>
                ) : (
                  <MapPin size={14} color={gpsInfo.color} />
                )}
                <span style={{ fontSize: 12, fontWeight: 700, color: gpsInfo.color }}>{gpsInfo.label}</span>
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button 
                disabled={!!activeAttendance || clockInLoading}
                onClick={handleClockIn}
                style={{ 
                  padding: '16px', borderRadius: 16, 
                  background: activeAttendance ? '#e2e8f0' : gpsStatus === 'outside' ? '#fee2e2' : '#10b981', 
                  color: activeAttendance ? '#94a3b8' : gpsStatus === 'outside' ? '#ef4444' : 'white', 
                  border: 'none', fontWeight: 800, fontSize: 16, 
                  cursor: (activeAttendance || clockInLoading) ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                }}
              >
                <LogIn size={20} />
                {clockInLoading ? 'Checking location...' : activeAttendance ? 'Already Clocked In' : 'Clock In Now'}
              </button>
              <button 
                disabled={!activeAttendance}
                onClick={handleClockOut}
                style={{ 
                  padding: '16px', borderRadius: 16, background: 'white', 
                  color: !activeAttendance ? '#e2e8f0' : '#ef4444', 
                  border: `2px solid ${!activeAttendance ? '#f1f5f9' : '#fee2e2'}`, 
                  fontWeight: 800, fontSize: 16, 
                  cursor: !activeAttendance ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                }}
              >
                <LogOut size={20} /> Clock Out
              </button>
            </div>
          </div>

          {/* Shift Details & Active Session */}
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
                <span style={{ opacity: 0.7, fontSize: 14 }}>Hours Today</span>
                <span style={{ fontWeight: 700, color: '#10b981' }}>{totalHoursToday.toFixed(1)}h</span>
              </div>
              {activeAttendance && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ opacity: 0.7, fontSize: 14 }}>Clocked In At</span>
                  <span style={{ fontWeight: 700, color: '#0a84ff' }}>
                    {new Date(activeAttendance.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              {activeAttendance?.lateMinutes > 0 && (
                <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ opacity: 0.9, fontSize: 13, color: '#fca5a5' }}>Late By</span>
                  <span style={{ fontWeight: 800, color: '#fca5a5', fontSize: 13 }}>{activeAttendance.lateMinutes} min</span>
                </div>
              )}
            </div>
          </div>

          {/* Geofence Map Card */}
          <div style={{ background: 'white', padding: 24, borderRadius: 24, border: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <MapPin size={18} color="#0a84ff" />
              <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Geofence Zone</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 100, height: 100, borderRadius: '50%', border: '3px solid #e2e8f0', margin: '0 auto 12px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#0a84ff' }} />
                <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: '2px dashed #bfdbfe', animation: 'pulse 2s infinite' }} />
              </div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>Office Perimeter: {GEOFENCE_RADIUS_M}m</div>
              {userCoords && (
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 4 }}>
                  Your location: {userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Logs & Management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Currently On Duty */}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#16a34a' }}>
                      {item.Employee?.User?.name?.[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 13 }}>{item.Employee?.User?.name}</div>
                      {item.lateMinutes > 0 && (
                        <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 700 }}>⚠ {item.lateMinutes}min late</div>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                    In: {new Date(item.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todayLogs.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontWeight: 700 }}>No attendance records today.</div>
              )}
              {todayLogs.map(log => {
                const duration = log.clockOut
                  ? ((new Date(log.clockOut) - new Date(log.clockIn)) / 3600000).toFixed(1)
                  : null;
                return (
                  <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 20, background: '#f8fafc' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: log.clockOut ? '#f1f5f9' : '#dcfce7', color: log.clockOut ? '#64748b' : '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <UserCheck size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>{log.Employee?.User?.name}</div>
                      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                        Shift {log.status}
                        {log.lateMinutes > 0 && <span style={{ color: '#ef4444', marginLeft: 8 }}>· {log.lateMinutes}min late</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, color: '#10b981', fontSize: 13 }}>{new Date(log.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>IN</div>
                      </div>
                      <ArrowRight size={14} color="#cbd5e1" />
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, color: log.clockOut ? '#ef4444' : '#94a3b8', fontSize: 13 }}>
                          {log.clockOut ? new Date(log.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </div>
                        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>OUT</div>
                      </div>
                      {duration && (
                        <div style={{ padding: '4px 10px', borderRadius: 8, background: '#f0fdf4', color: '#16a34a', fontSize: 11, fontWeight: 800 }}>
                          {duration}h
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
