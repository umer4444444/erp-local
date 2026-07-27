import React from 'react';
import { LayoutDashboard, Package, ShoppingCart, Users, Briefcase, LogOut, User, Zap, DollarSign, Shield, Clock, Calendar, Pill, Truck, TrendingDown, Navigation } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { settingsAPI } from '../api';

const Sidebar = () => {
  const { user, logout, activeCompany } = useAuth();
  const role = user?.role || 'admin';
  const [companyName, setCompanyName] = React.useState('GlobalAI ERP');

  React.useEffect(() => {
    if (activeCompany) {
      setCompanyName(activeCompany.name);
    } else {
      settingsAPI.get().then(res => {
        if (res.data?.companyName) setCompanyName(res.data.companyName);
      }).catch(e => console.error(e));
    }
  }, [activeCompany]);

  const menuItems = [
    { name: 'Dashboard',     icon: <LayoutDashboard size={18} />, path: '/',         roles: ['admin'] },
    { name: 'Manager Hub',   icon: <Shield size={18} />,          path: '/manager',   roles: ['admin', 'manager'] },
    { name: 'Inventory',     icon: <Package size={18} />,          path: '/inventory', roles: ['admin', 'inventory', 'manager'] },
    { name: 'Accounting',    icon: <DollarSign size={18} />,       path: '/accounting', roles: ['admin', 'manager', 'finance'] },
    { name: 'Sales POS',     icon: <ShoppingCart size={18} />,     path: '/sales',     roles: ['admin', 'cashier', 'manager'] },
    { name: 'Sales History', icon: <DollarSign size={18} />,       path: '/sales/history', roles: ['admin', 'cashier', 'manager'] },
    { name: 'Revenue',       icon: <DollarSign size={18} />,       path: '/revenue',   roles: ['admin', 'manager', 'finance'] },
    { name: 'Expenses',      icon: <TrendingDown size={18} />,     path: '/expenses',  roles: ['admin', 'manager', 'expenses', 'finance'] },
    { name: 'Customers',     icon: <Users size={18} />,            path: '/customers', roles: ['admin', 'cashier', 'manager'] },
    { name: 'Employees',     icon: <Briefcase size={18} />,        path: '/employees', roles: ['admin', 'hr', 'manager'] },
    { name: 'Attendance',    icon: <Clock size={18} />,            path: '/attendance', roles: ['admin', 'manager', 'cashier', 'hr', 'inventory', 'finance', 'staff', 'operations', 'pharmacist', 'expenses'] },
    { name: 'Shift Audit',   icon: <Briefcase size={18} />,        path: '/shift-audit', roles: ['admin', 'hr'] },
    { name: 'Leave Requests',icon: <Calendar size={18} />,         path: '/leaves',    roles: ['admin', 'manager', 'cashier', 'hr', 'inventory', 'finance', 'staff', 'operations', 'pharmacist', 'expenses'] },
    { name: 'Payroll',       icon: <DollarSign size={18} />,       path: '/payroll',   roles: ['admin', 'hr'] },

    { name: 'Suppliers',     icon: <Truck size={18} />,            path: '/suppliers', roles: ['admin', 'inventory', 'manager'] },
    { name: 'Delivery',      icon: <Navigation size={18} />,       path: '/delivery',  roles: ['admin', 'manager', 'operations'] },
    { name: 'Users',         icon: <User size={18} />,             path: '/users',     roles: ['admin'] },
    { name: 'HR Portal',     icon: <Shield size={18} />,           path: '/hr',        roles: ['admin', 'hr'] },
    { name: 'EOD Report',    icon: <Briefcase size={18} />,        path: '/eod',       roles: ['admin', 'manager', 'cashier', 'operations'] },
  ];

  const filtered = menuItems.filter(i => i.roles.includes(role));

  return (
    <div style={{
      width: 260, height: 'calc(100vh - 32px)',
      position: 'fixed', left: 16, top: 16,
      zIndex: 50, borderRadius: 24,
      background: 'white',
      border: '1px solid rgba(0,0,0,0.07)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
      display: 'flex', flexDirection: 'column',
      padding: '24px 16px',
      fontFamily: "'Outfit', sans-serif"
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, padding: '0 8px' }}>
        <motion.div whileHover={{ rotate: 360 }} style={{ width: 38, height: 38, borderRadius: 11, background: '#0a84ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <Zap size={18} fill="currentColor" />
        </motion.div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#0f172a' }}>{companyName}</div>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>ERP v2.0</div>
        </div>
      </div>

      <nav style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4, scrollbarWidth: 'none' }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map(item => (
            <li key={item.name}>
              <NavLink to={item.path} style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, textDecoration: 'none',
                fontWeight: 700, fontSize: 14, background: isActive ? 'rgba(10,132,255,0.08)' : 'transparent',
                color: isActive ? '#0a84ff' : '#64748b',
              })}>
                {item.icon} {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <button 
        onClick={() => window.dispatchEvent(new Event('open-ai'))}
        style={{ 
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', 
          borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #0a84ff, #4f46e5)', 
          color: 'white', cursor: 'pointer', fontWeight: 800, marginTop: 16, fontSize: 14,
          boxShadow: '0 4px 14px rgba(10,132,255,0.3)'
        }}
      >
        <Zap size={16} fill="white" /> Ask AI Assistant
      </button>

      <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontWeight: 700, marginTop: 16 }}>
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  );
};

export default Sidebar;
