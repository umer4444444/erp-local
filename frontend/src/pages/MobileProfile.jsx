import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Settings, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MobileProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 20px' }}>Profile</h2>
      
      <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <UserIcon size={40} />
        </div>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{user?.name}</h3>
        <p style={{ margin: '4px 0 0', color: '#64748b', textTransform: 'capitalize' }}>{user?.role?.replace('_', ' ')}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button style={{ background: 'white', border: '1px solid #e2e8f0', padding: 16, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', fontWeight: 600, color: '#334155' }}>
          <Bell size={20} color="#64748b" /> Notifications
        </button>
        <button style={{ background: 'white', border: '1px solid #e2e8f0', padding: 16, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', fontWeight: 600, color: '#334155' }}>
          <Settings size={20} color="#64748b" /> Settings
        </button>
        <button onClick={handleLogout} style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: 16, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', fontWeight: 600, color: '#ef4444' }}>
          <LogOut size={20} /> Logout
        </button>
      </div>
    </div>
  );
};

export default MobileProfile;
