import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, MapPin, ShoppingCart, User } from 'lucide-react';

const MobileLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/mobile/home', icon: <Home size={24} /> },
    { name: 'Route', path: '/mobile/route', icon: <MapPin size={24} /> },
    { name: 'Order', path: '/mobile/order', icon: <ShoppingCart size={24} /> },
    { name: 'Profile', path: '/mobile/profile', icon: <User size={24} /> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-main)', fontFamily: 'Outfit, sans-serif' }}>
      
      {/* Top Header */}
      <div style={{ 
        background: '#2563eb', color: 'var(--bg-panel)', padding: '16px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 2px 4px var(--shadow-strong-rgb)', zIndex: 10
      }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Field Sales</h2>
        <div style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%' }} />
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 80 }}>
        <Outlet />
      </div>

      {/* Bottom Navigation */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--bg-panel)', borderTop: '1px solid #e2e8f0',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        padding: '12px 0', zIndex: 10
      }}>
        {navItems.map(item => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                background: 'transparent', border: 'none',
                color: isActive ? '#2563eb' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              {item.icon}
              <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 500 }}>{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileLayout;
