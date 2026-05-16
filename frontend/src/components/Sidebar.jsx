import React from 'react';
import { LayoutDashboard, Package, ShoppingCart, Users, Briefcase, LogOut, User, Zap, DollarSign, Shield, Clock, Calendar, Pill, Truck, TrendingDown } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const role = user?.role || 'admin';

  const menuItems = [
    { name: 'Dashboard',     icon: <LayoutDashboard size={18} />, path: '/',         roles: ['admin'] },
    { name: 'Manager Hub',   icon: <Shield size={18} />,          path: '/manager',   roles: ['admin', 'manager'] },
    { name: 'Inventory',     icon: <Package size={18} />,          path: '/inventory', roles: ['admin', 'inventory', 'manager'] },
    { name: 'Sales POS',     icon: <ShoppingCart size={18} />,     path: '/sales',     roles: ['admin', 'cashier', 'manager'] },
    { name: 'Sales History', icon: <DollarSign size={18} />,       path: '/sales/history', roles: ['admin', 'cashier', 'manager'] },
    { name: 'Revenue',       icon: <DollarSign size={18} />,       path: '/revenue',   roles: ['admin', 'manager'] },
    { name: 'Expenses',      icon: <TrendingDown size={18} />,     path: '/expenses',  roles: ['admin', 'manager', 'expenses'] },
    { name: 'Customers',     icon: <Users size={18} />,            path: '/customers', roles: ['admin', 'cashier', 'manager'] },
    { name: 'Employees',     icon: <Briefcase size={18} />,        path: '/employees', roles: ['admin', 'hr', 'manager'] },
    { name: 'Attendance',    icon: <Clock size={18} />,            path: '/attendance', roles: ['admin', 'manager', 'cashier', 'hr', 'inventory'] },
    { name: 'Shift Audit',   icon: <Briefcase size={18} />,        path: '/shift-audit', roles: ['admin', 'hr'] },
    { name: 'Leave Requests',icon: <Calendar size={18} />,         path: '/leaves',    roles: ['admin', 'manager', 'cashier', 'hr', 'inventory'] },
    { name: 'Payroll',       icon: <DollarSign size={18} />,       path: '/payroll',   roles: ['admin', 'hr'] },
    { name: 'Pharmacy',      icon: <Pill size={18} />,             path: '/pharmacy',  roles: ['admin', 'pharmacist', 'manager'] },
    { name: 'Suppliers',     icon: <Truck size={18} />,            path: '/suppliers', roles: ['admin', 'inventory', 'manager'] },
    { name: 'Users',         icon: <User size={18} />,             path: '/users',     roles: ['admin'] },
    { name: 'HR Portal',     icon: <Shield size={18} />,           path: '/hr',        roles: ['admin', 'hr'] },
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
          <div style={{ fontSize: 17, fontWeight: 900, color: '#0f172a' }}>SAP <span style={{ color: '#0a84ff' }}>ERP</span></div>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Enterprise v2.0</div>
        </div>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', paddingRight: 4, scrollbarWidth: 'none' }}>
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

      <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontWeight: 700, marginTop: 16 }}>
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  );
};

export default Sidebar;
