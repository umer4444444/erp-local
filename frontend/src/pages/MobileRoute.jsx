import React from 'react';
import { MapPin, Navigation, CheckCircle } from 'lucide-react';

const MobileRoute = () => {
  const routeStops = [
    { id: 1, name: 'Al-Fatah Grocery', address: 'Main Blvd, Gulberg', status: 'completed' },
    { id: 2, name: 'Madina Cash & Carry', address: 'DHA Phase 5', status: 'pending' },
    { id: 3, name: 'Bismillah General Store', address: 'Model Town', status: 'pending' },
    { id: 4, name: 'Shaheen Super Store', address: 'Johar Town', status: 'pending' },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 20px' }}>Today's Route</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {routeStops.map((stop, idx) => (
          <div key={stop.id} style={{ 
            background: 'white', borderRadius: 16, padding: 16, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: stop.status === 'completed' ? '1px solid #d1fae5' : '1px solid #e2e8f0',
            opacity: stop.status === 'completed' ? 0.7 : 1
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ 
                  width: 32, height: 32, borderRadius: '50%', 
                  background: stop.status === 'completed' ? '#10b981' : '#eff6ff', 
                  color: stop.status === 'completed' ? 'white' : '#2563eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14
                }}>
                  {stop.status === 'completed' ? <CheckCircle size={16} /> : idx + 1}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0f172a' }}>{stop.name}</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} /> {stop.address}
                  </p>
                </div>
              </div>
            </div>
            
            {stop.status !== 'completed' && (
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button style={{ 
                  background: '#f8fafc', color: '#334155', border: 'none', padding: '10px', 
                  borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 
                }}>
                  <Navigation size={16} /> Navigate
                </button>
                <button style={{ 
                  background: '#2563eb', color: 'white', border: 'none', padding: '10px', 
                  borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  Check-In
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileRoute;
