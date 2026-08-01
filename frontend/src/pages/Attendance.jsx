import React, { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, CheckCircle, AlertCircle, Users, Calendar, ArrowRight, UserCheck, ShieldCheck, MapPin, Navigation, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { attendanceAPI } from '../api';
import FaceScanner from '../components/FaceScanner';

const OFFICE_LAT = 31.571398336628878;  // Configure your office lat/lng here
const OFFICE_LNG = 74.41214762086345;
const GEOFENCE_RADIUS_M = 100; // Must match backend MAX_DISTANCE_M enforcement

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // metres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const TABS = ['clock', 'team', 'history'];

const Attendance = () => {
  const [activeTab, setActiveTab] = useState('clock');
  const [activeAttendance, setActiveAttendance] = useState(null);
  const [todayLogs, setTodayLogs] = useState([]);
  const [managerView, setManagerView] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gpsStatus, setGpsStatus] = useState('idle'); // idle | checking | inside | outside | error
  const [gpsErrorText, setGpsErrorText] = useState('GPS unavailable');
  const [gpsDistance, setGpsDistance] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [clockInLoading, setClockInLoading] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date());
  const [showScanner, setShowScanner] = useState(false);
  const [myProfile, setMyProfile] = useState(null);
  const [onBreak, setOnBreak] = useState(false);
  const [breakStart, setBreakStart] = useState(null);

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

  useEffect(() => {
    if (!activeAttendance) {
      if (navigator.geolocation) {
        checkGPS().catch((err) => {
          console.warn('Initial GPS check failed:', err.message);
        });
      } else {
        setGpsStatus('error');
        setGpsErrorText('Geolocation not supported');
      }
    }
  }, [activeAttendance]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory(1);
    }
  }, [activeTab]);

  const fetchData = async () => {
    try {
      const [myActiveRes, activeRes, todayRes, profileRes] = await Promise.all([
        attendanceAPI.getMyActive(),
        attendanceAPI.getActive(),
        attendanceAPI.getToday(),
        attendanceAPI.getMyProfile()
      ]);
      setActiveAttendance(myActiveRes.data);
      setManagerView(activeRes.data);
      setTodayLogs(todayRes.data);
      setMyProfile(profileRes.data);
    } catch (err) {
      console.error('Attendance fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (page) => {
    setHistoryLoading(true);
    try {
      const res = await attendanceAPI.getMyHistory(page);
      if (page === 1) {
        setHistoryLogs(res.data);
      } else {
        setHistoryLogs(prev => [...prev, ...res.data]);
      }
      setHistoryPage(page);
    } catch (err) {
      console.error('History fetch failed', err);
    } finally {
      setHistoryLoading(false);
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
      (err) => {
        let errorText = err.message || 'GPS unavailable';
        if (err.code === 1) {
          errorText = 'Location permission denied. Please allow location access in your browser.';
        } else if (err.code === 2) {
          errorText = 'Position unavailable. Ensure your device GPS is enabled and try again.';
        } else if (err.code === 3) {
          errorText = 'Location request timed out. Please try again.';
        }
        setGpsErrorText(errorText);
        setGpsStatus('error');
        reject(new Error(errorText));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  const handleClockIn = async () => {
    try {
      if (gpsStatus !== 'inside') {
        const gps = await checkGPS();
        if (!gps.inside) {
          alert(`You are ${gps.distance}m from the office. Geofence radius is ${GEOFENCE_RADIUS_M}m. Clock-in denied.`);
          return;
        }
      }

      if (!myProfile) {
        alert('DEBUG: Your User account is not linked to any Employee profile. (myProfile is null)');
        return;
      }
      if (!myProfile.faceDescriptor) {
        alert('DEBUG: Employee profile found, but face data is missing. Please ask HR to scan your face again.');
        return;
      }
      setShowScanner(true);
    } catch (err) {
      alert(err.message || 'GPS check failed.');
    }
  };

  const executeClockIn = async (photoUrl) => {
    setClockInLoading(true);
    try {
      await attendanceAPI.clockIn({
        latitude: userCoords.lat,
        longitude: userCoords.lng,
        photoUrl: photoUrl
      });
      fetchData();
      setGpsStatus('idle');
      setGpsDistance(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Clock-in failed');
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
    error:    { color: '#ef4444', bg: '#fee2e2', label: gpsErrorText },
  };

  const gpsInfo = gpsStatusConfig[gpsStatus];

  const totalHoursToday = todayLogs
    .filter(l => l.clockOut)
    .reduce((sum, l) => {
      const diff = (new Date(l.clockOut) - new Date(l.clockIn)) / 3600000;
      return sum + diff;
    }, 0);

  const tabLabels = { clock: '🕐 Clock In/Out', team: '👥 Team Overview', history: '📋 My History' };

  return (
    <div style={{ padding: 40, minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>Attendance & Time Tracking</h1>
        <p style={{ color: '#64748b', fontWeight: 600 }}>Manage your work hours and monitor staff presence.</p>
      </header>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 8, background: 'white', padding: 6, borderRadius: 18, border: '1px solid #e2e8f0', marginBottom: 32, width: 'fit-content' }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 22px', borderRadius: 14, border: 'none', fontFamily: "'Outfit', sans-serif",
              fontWeight: 800, cursor: 'pointer', fontSize: 14, transition: 'all 0.2s',
              background: activeTab === tab ? '#0f172a' : 'transparent',
              color: activeTab === tab ? 'white' : '#64748b'
            }}>
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── CLOCK IN/OUT TAB ── */}
        {activeTab === 'clock' && (
          <motion.div key="clock" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32 }}>
            
            {showScanner && (
              <FaceScanner 
                onClose={() => setShowScanner(false)} 
                onVerify={executeClockIn}
              />
            )}

            {/* Left Column: Personal Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Clock Widget */}
              <div style={{ background: 'white', padding: 32, borderRadius: 32, border: '1px solid rgba(0,0,0,0.05)', textAlign: 'center' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <Clock size={40} color="#0f172a" />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Live Clock</h2>
                <div style={{ fontSize: 48, fontWeight: 900, color: '#0a84ff', marginBottom: 4, fontVariantNumeric: 'tabular-nums' }}>
                  {liveTime.toLocaleString('en-PK', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, marginBottom: 28 }}>
                  {liveTime.toLocaleDateString('en-PK', { weekday: 'long', month: 'long', day: 'numeric' })} <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 8, background: '#e0f2fe', color: '#0369a1', fontSize: 10, fontWeight: 800 }}>PKT UTC+5</span>
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
                    disabled={!!activeAttendance || clockInLoading || gpsStatus === 'outside'}
                    onClick={handleClockIn}
                    style={{ 
                      padding: '16px', borderRadius: 16, 
                      background: activeAttendance ? '#e2e8f0' : gpsStatus === 'outside' ? '#fee2e2' : '#10b981', 
                      color: activeAttendance ? '#94a3b8' : gpsStatus === 'outside' ? '#ef4444' : 'white', 
                      border: 'none', fontWeight: 800, fontSize: 16, 
                      cursor: (activeAttendance || clockInLoading || gpsStatus === 'outside') ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s'
                    }}
                  >
                    <LogIn size={20} />
                    {clockInLoading ? 'Processing...' : activeAttendance ? 'Clocked In' : 'Clock In with Face'}
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
                  {activeAttendance && (
                    <button
                      onClick={() => {
                        if (!onBreak) {
                          setOnBreak(true);
                          setBreakStart(new Date());
                        } else {
                          setOnBreak(false);
                          setBreakStart(null);
                        }
                      }}
                      style={{
                        padding: '12px 16px', borderRadius: 16, background: onBreak ? '#fffbeb' : 'white',
                        color: onBreak ? '#d97706' : '#64748b',
                        border: `1.5px solid ${onBreak ? '#fcd34d' : '#e2e8f0'}`,
                        fontWeight: 800, fontSize: 14, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                      }}
                    >
                      {onBreak ? '☕ End Break' : '☕ Start Break'}
                    </button>
                  )}
                  {onBreak && breakStart && (
                    <div style={{ padding: '10px 16px', borderRadius: 12, background: '#fffbeb', border: '1px solid #fcd34d', textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: '#d97706', fontWeight: 800 }}>ON BREAK</div>
                      <div style={{ fontSize: 12, color: '#92400e', fontWeight: 700 }}>{Math.floor((new Date() - breakStart) / 60000)} min</div>
                    </div>
                  )}
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

              {/* Geofence Zone Card */}
              <div style={{ background: 'white', padding: 24, borderRadius: 24, border: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <MapPin size={18} color="#0a84ff" />
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Geofence Zone</span>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)', borderRadius: 16, padding: 20, marginBottom: 16, position: 'relative', overflow: 'hidden', height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ position: 'absolute', width: 80, height: 80, borderRadius: '50%', border: '2px dashed #93c5fd', opacity: 0.6 }} />
                  <div style={{ position: 'absolute', width: 40, height: 40, borderRadius: '50%', border: '2px solid #60a5fa', opacity: 0.8 }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: gpsStatus === 'inside' ? '#10b981' : gpsStatus === 'outside' ? '#ef4444' : '#0a84ff', zIndex: 1, boxShadow: '0 0 0 4px rgba(10,132,255,0.2)' }} />
                </div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 4 }}>Office Perimeter: {GEOFENCE_RADIUS_M}m</div>
                {userCoords && (
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 10 }}>
                    📍 {userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)}
                  </div>
                )}
                {gpsStatus === 'idle' && (
                  <button onClick={() => checkGPS().catch(() => {})} style={{ width: '100%', padding: '10px', borderRadius: 10, background: '#0a84ff', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 12 }}>
                    📡 Check My Location
                  </button>
                )}
                {gpsStatus === 'error' && (
                  <button onClick={() => checkGPS().catch(() => {})} style={{ width: '100%', padding: '10px', borderRadius: 10, background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', fontWeight: 800, cursor: 'pointer', fontSize: 12 }}>
                    🔄 Retry Location
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Today's Logs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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
          </motion.div>
        )}

        {/* ── TEAM OVERVIEW TAB ── */}
        {activeTab === 'team' && (
          <motion.div key="team" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ background: 'white', padding: 32, borderRadius: 32, border: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>Currently On Duty</h2>
                <span style={{ padding: '6px 12px', borderRadius: 20, background: '#dcfce7', color: '#10b981', fontSize: 12, fontWeight: 800 }}>
                  {managerView.length} ACTIVE
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {managerView.map(item => (
                  <div key={item.id} style={{ padding: 20, borderRadius: 20, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#16a34a' }}>
                        {item.Employee?.User?.name?.[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>{item.Employee?.User?.name}</div>
                        {item.lateMinutes > 0 && (
                          <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 700 }}>⚠ {item.lateMinutes}min late</div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                        In: {new Date(item.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </div>
                      <div style={{ padding: '3px 8px', borderRadius: 6, background: '#dcfce7', color: '#16a34a', fontSize: 10, fontWeight: 800 }}>ON DUTY</div>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                      Duration: {((new Date() - new Date(item.clockIn)) / 3600000).toFixed(1)}h
                    </div>
                  </div>
                ))}
                {managerView.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: '#94a3b8', fontWeight: 700 }}>
                    No employees are currently clocked in.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── MY HISTORY TAB ── */}
        {activeTab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ background: 'white', padding: 32, borderRadius: 32, border: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>My Attendance History</h2>
                  <p style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginTop: 4 }}>All your past clock-in and clock-out records.</p>
                </div>
                <div style={{ padding: '6px 14px', borderRadius: 12, background: '#f1f5f9', fontSize: 13, fontWeight: 800, color: '#64748b' }}>
                  {historyLogs.length} records
                </div>
              </div>

              {historyLoading && historyLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontWeight: 700 }}>Loading history...</div>
              ) : historyLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontWeight: 700 }}>
                  <History size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                  <p>No past attendance records found.</p>
                </div>
              ) : (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                          {['DATE', 'DAY', 'CLOCK IN', 'CLOCK OUT', 'DURATION', 'STATUS'].map(h => (
                            <th key={h} style={{ padding: '14px 16px', color: '#64748b', fontSize: 12, fontWeight: 800, letterSpacing: 0.5 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {historyLogs.map(log => {
                          const clockIn = new Date(log.clockIn);
                          const clockOut = log.clockOut ? new Date(log.clockOut) : null;
                          const duration = clockOut ? ((clockOut - clockIn) / 3600000) : 0;
                          const isLate = log.lateMinutes > 0;
                          return (
                            <tr key={log.id} style={{ borderBottom: '1px solid #f8fafc' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                                {clockIn.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                              <td style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                                {clockIn.toLocaleDateString('en-PK', { weekday: 'short' })}
                              </td>
                              <td style={{ padding: '14px 16px', fontWeight: 700, color: '#10b981', fontSize: 13 }}>
                                {clockIn.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                {isLate && <span style={{ marginLeft: 6, fontSize: 10, color: '#ef4444', fontWeight: 800 }}>+{log.lateMinutes}m late</span>}
                              </td>
                              <td style={{ padding: '14px 16px', fontWeight: 700, color: '#ef4444', fontSize: 13 }}>
                                {clockOut ? clockOut.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <span style={{ padding: '4px 10px', borderRadius: 8, background: duration >= 8 ? '#f0fdf4' : '#fff7ed', color: duration >= 8 ? '#16a34a' : '#d97706', fontWeight: 800, fontSize: 12 }}>
                                  {duration.toFixed(1)}h
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <span style={{
                                  padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800,
                                  background: log.status === 'present' ? '#dcfce7' : log.status === 'late' ? '#fef3c7' : '#fee2e2',
                                  color: log.status === 'present' ? '#16a34a' : log.status === 'late' ? '#d97706' : '#ef4444'
                                }}>
                                  {(log.status || 'present').toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {historyLogs.length >= 30 * historyPage && (
                    <div style={{ textAlign: 'center', marginTop: 24 }}>
                      <button onClick={() => fetchHistory(historyPage + 1)} disabled={historyLoading}
                        style={{ padding: '12px 28px', borderRadius: 14, background: '#f1f5f9', color: '#0f172a', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>
                        {historyLoading ? 'Loading...' : 'Load More'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {showScanner && (
        <FaceScanner 
          mode="verify"
          referenceDescriptor={myProfile?.faceDescriptor}
          onCapture={(success, photoUrl) => {
            setShowScanner(false);
            if (success) {
              executeClockIn(photoUrl);
            }
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default Attendance;
