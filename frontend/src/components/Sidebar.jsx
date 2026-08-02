import React from 'react';
import { LayoutDashboard, Package, ShoppingCart, Users, Briefcase, LogOut, User, Zap, DollarSign, Shield, Clock, Calendar, Pill, Truck, TrendingDown, Navigation, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { settingsAPI } from '../api';

const Sidebar = ({ isOpen, setIsOpen }) => {
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
    { name: 'Dashboard',     icon: <LayoutDashboard size={18} />, path: '/',         roles: ['admin', 'superadmin', 'owner', 'company_admin'] },
    { name: 'Manager Hub',   icon: <Shield size={18} />,          path: '/manager',   roles: ['admin', 'manager'] },
    { name: 'Inventory',     icon: <Package size={18} />,          path: '/inventory', roles: ['admin', 'inventory', 'manager', 'company_admin', 'pharmacist', 'superadmin', 'owner'] },
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
    { name: 'Salary Advance', icon: <DollarSign size={18} />,      path: '/salary-advance', roles: ['admin', 'hr', 'manager', 'cashier', 'inventory', 'finance', 'staff', 'operations', 'pharmacist', 'expenses'] },

    { name: 'Suppliers',     icon: <Truck size={18} />,            path: '/suppliers', roles: ['admin', 'inventory', 'manager'] },
    { name: 'Delivery',      icon: <Navigation size={18} />,       path: '/delivery',  roles: ['admin', 'manager', 'operations'] },
    { name: 'Users',         icon: <User size={18} />,             path: '/users',     roles: ['admin'] },
    { name: 'HR Portal',     icon: <Shield size={18} />,           path: '/hr',        roles: ['admin', 'hr'] },
    { name: 'EOD Report',    icon: <Briefcase size={18} />,        path: '/eod',       roles: ['admin', 'manager', 'cashier', 'operations'] },
  ];

  const filtered = menuItems.filter(i => i.roles.includes(role));

  const sidebarContent = (
    <div style={{
      width: 260, height: 'calc(100vh - 32px)',
      background: 'var(--bg-panel)',
      border: '1px solid var(--border-color)',
      boxShadow: '0 8px 32px var(--shadow-color-rgb)',
      display: 'flex', flexDirection: 'column',
      padding: '24px 16px',
      fontFamily: "'Outfit', sans-serif",
      borderRadius: '24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, padding: '0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.div whileHover={{ rotate: 360 }} style={{ width: 38, height: 38, borderRadius: 11, background: '#0a84ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-panel)' }}>
            <Zap size={18} fill="currentColor" />
          </motion.div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-main)' }}>{companyName}</div>
            <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>ERP v2.0</div>
          </div>
        </div>
        <button className="lg:hidden" onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>

      <nav style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4, scrollbarWidth: 'none' }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map(item => (
            <li key={item.name}>
              <NavLink to={item.path} style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, textDecoration: 'none',
                fontWeight: 700, fontSize: 14, background: isActive ? 'rgba(10,132,255,0.08)' : 'transparent',
                color: isActive ? '#0a84ff' : 'var(--text-muted)',
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
          color: 'var(--bg-panel)', cursor: 'pointer', fontWeight: 800, marginTop: 16, fontSize: 14,
          boxShadow: '0 4px 14px rgba(10,132,255,0.3)'
        }}
      >
        <Zap size={16} fill="white" /> Ask AI Assistant
      </button>

      <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 700, marginTop: 16 }}>
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile/Tablet Overlay Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="lg:hidden"
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
            />
            <motion.div 
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden"
              style={{ position: 'fixed', top: 16, left: 16, zIndex: 100 }}
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block" style={{ position: 'fixed', top: 16, left: 16, zIndex: 50 }}>
        {sidebarContent}
      </div>
    </>
  );
};

export default Sidebar;
