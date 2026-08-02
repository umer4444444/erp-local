import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertTriangle, Calendar, DollarSign, X, Check, ArrowRight } from 'lucide-react';
import { inventoryAPI, leaveAPI, expenseAPI } from '../api';
import { useNavigate } from 'react-router-dom';

const NotificationCenter = ({ user }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const newNotifs = [];

        // 1. Check Low Stock
        if (['admin', 'inventory', 'manager'].includes(user?.role)) {
          const stockRes = await inventoryAPI.getAlerts();
          if (stockRes.data.lowStock?.length > 0) {
            newNotifs.push({
              id: 'stock-' + Date.now(),
              type: 'inventory',
              title: 'Low Stock Alert',
              message: `${stockRes.data.lowStock.length} items are below minimum stock level.`,
              icon: <AlertTriangle size={18} color="#f59e0b" />,
              link: '/inventory'
            });
          }
        }

        // 2. Check Pending Leaves
        if (['admin', 'hr', 'manager'].includes(user?.role)) {
          const leaveRes = await leaveAPI.getPending();
          if (leaveRes.data?.length > 0) {
            newNotifs.push({
              id: 'leave-' + Date.now(),
              type: 'hr',
              title: 'Pending Leave Requests',
              message: `There are ${leaveRes.data.length} leave requests awaiting approval.`,
              icon: <Calendar size={18} color="#0a84ff" />,
              link: '/leaves'
            });
          }
        }

        // 3. Check Pending Expenses
        if (['admin', 'manager'].includes(user?.role)) {
          const expenseRes = await expenseAPI.getPending();
          if (expenseRes.data?.length > 0) {
            newNotifs.push({
              id: 'expense-' + Date.now(),
              type: 'finance',
              title: 'Pending Expenses',
              message: `${expenseRes.data.length} expenses are waiting for your review.`,
              icon: <DollarSign size={18} color="#10b981" />,
              link: '/expenses'
            });
          }
        }

        // 4. Check HR Document Expiries
        if (['admin', 'hr', 'manager'].includes(user?.role)) {
          try {
            const { employeeAPI } = require('../api');
            const hrRes = await employeeAPI.getAlerts();
            if (hrRes.data?.length > 0) {
              newNotifs.push({
                id: 'hr-expiry-' + Date.now(),
                type: 'hr',
                title: 'Document Expiries',
                message: `${hrRes.data.length} employees have documents expiring within 30 days.`,
                icon: <AlertTriangle size={18} color="#e11d48" />,
                link: '/employees'
              });
            }
          } catch(e) { console.error("Error fetching hr alerts", e) }
        }

        setNotifications(newNotifs);
      } catch (err) {
        console.error('Notification fetch failed', err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Check every 10s

    // Load Google Translate script
    let script = document.getElementById('google-translate-script');
    if (!script) {
      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          { pageLanguage: 'en', includedLanguages: 'ar,en', layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE },
          'google_translate_element'
        );
      };
      script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }

    return () => clearInterval(interval);
  }, [user]);

  return (
    <div style={{ zIndex: 100, display: 'flex', gap: 12, alignItems: 'center' }}>
      
      {/* Search/User Bar Placeholder or similar if needed, but we just want the Bell */}
      <div style={{ position: 'relative' }}>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowDropdown(!showDropdown)}
          style={{ 
            width: 48, height: 48, borderRadius: 16, background: 'var(--bg-panel)', 
            border: '1px solid var(--border-color-rgb)', boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            position: 'relative'
          }}
        >
          <Bell size={20} color='var(--text-muted)' />
          {notifications.length > 0 && (
            <span style={{ 
              position: 'absolute', top: 12, right: 12, width: 10, height: 10, 
              background: '#ef4444', borderRadius: '50%', border: '2px solid white' 
            }} />
          )}
        </motion.button>

        <AnimatePresence>
          {showDropdown && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              style={{ 
                position: 'absolute', top: 60, right: 0, width: 320, background: 'var(--bg-panel)',
                borderRadius: 24, border: '1px solid var(--shadow-strong-rgb)', boxShadow: '0 20px 50px var(--shadow-strong-rgb)',
                padding: '20px 0', overflow: 'hidden'
              }}
            >
              <div style={{ padding: '0 20px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 900, fontSize: 16 }}>Notifications</span>
                <span style={{ fontSize: 11, fontWeight: 800, background: '#f1f5f9', padding: '4px 10px', borderRadius: 100, color: 'var(--text-muted)' }}>
                  {notifications.length} New
                </span>
              </div>

              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Check size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <div style={{ fontSize: 13, fontWeight: 700 }}>All caught up!</div>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => { navigate(n.link); setShowDropdown(false); }}
                      style={{ 
                        padding: '16px 20px', borderBottom: '1px solid #f8fafc', cursor: 'pointer',
                        display: 'flex', gap: 14, transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-main)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-panel)'}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--shadow-color-rgb)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {n.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)', marginBottom: 2 }}>{n.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1.4 }}>{n.message}</div>
                      </div>
                      <div style={{ alignSelf: 'center' }}>
                        <ArrowRight size={14} color="#cbd5e1" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile Summary */}
      <div style={{ 
        height: 48, padding: '0 16px', borderRadius: 16, background: 'var(--bg-panel)', 
        border: '1px solid var(--border-color-rgb)', boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', gap: 12
      }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12 }}>
          {user?.name?.[0]}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)' }}>{user?.name}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{user?.role}</div>
        </div>
      </div>

      {/* Google Translate Widget */}
      <div style={{ 
        height: 48, padding: '0 12px', borderRadius: 16, background: 'var(--bg-panel)', 
        border: '1px solid var(--border-color-rgb)', boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', overflow: 'hidden'
      }}>
        <div id="google_translate_element" style={{ transform: 'translateY(4px)' }}></div>
      </div>

    </div>
  );
};

export default NotificationCenter;
