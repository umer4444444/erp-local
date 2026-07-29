import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Target, MapPin, DollarSign, Package } from 'lucide-react';

const MobileHome = () => {
  const { user } = useAuth();

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a' }}>Hello, {user?.name}</h1>
        <p style={{ margin: '4px 0 0', color: '#64748b' }}>Here is your field summary for today.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#eff6ff', padding: 16, borderRadius: 16 }}>
          <MapPin size={24} color="#2563eb" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1e3a8a' }}>12/15</div>
          <div style={{ fontSize: 12, color: '#3b82f6', fontWeight: 600 }}>VISITS DONE</div>
        </div>
        <div style={{ background: '#ecfdf5', padding: 16, borderRadius: 16 }}>
          <DollarSign size={24} color="#10b981" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 20, fontWeight: 700, color: '#065f46' }}>SAR 4,250</div>
          <div style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>COLLECTED</div>
        </div>
      </div>

      <div style={{ background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a', fontWeight: 600 }}>
            <Target size={20} color="#8b5cf6" /> Monthly Target
          </div>
          <div style={{ fontWeight: 700, color: '#8b5cf6' }}>82%</div>
        </div>
        <div style={{ background: '#f1f5f9', height: 8, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: '82%', height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #d946ef)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: '#64748b' }}>
          <span>SAR 41,000</span>
          <span>SAR 50,000</span>
        </div>
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#0f172a' }}>Quick Actions</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button style={{ background: 'white', border: '1px solid #e2e8f0', padding: 16, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', fontWeight: 600, color: '#334155' }}>
          <Package size={20} color="#3b82f6" /> View Vehicle Stock
        </button>
        <button style={{ background: 'white', border: '1px solid #e2e8f0', padding: 16, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', fontWeight: 600, color: '#334155' }}>
          <MapPin size={20} color="#f59e0b" /> Sync Offline Data
        </button>
      </div>
    </div>
  );
};

export default MobileHome;
