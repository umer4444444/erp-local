import React, { useState, useEffect } from 'react';
import { 
  User, Shield, Mail, Phone, Plus, Search, MoreVertical, 
  ShieldCheck, UserPlus, Trash2, X, ToggleLeft, ToggleRight,
  Activity, Settings, ChevronRight, Clock, AlertCircle, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usersAPI, adminAPI } from '../api';

const TABS = ['Users', 'Audit Log', 'System Settings'];

const Users = () => {
  const [activeTab, setActiveTab] = useState('Users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'cashier', password: '' });

  // Audit log state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditSearch, setAuditSearch] = useState('');

  // Settings state
  const [settings, setSettings] = useState({ storeName: '', currency: 'USD', taxRate: '', geofenceRadius: '', shiftStart: '', shiftEnd: '' });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    if (activeTab === 'Audit Log' && auditLogs.length === 0) fetchAuditLogs();
    if (activeTab === 'System Settings' && !settingsLoaded) fetchSettings();
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      const res = await usersAPI.getAll();
      setUsers(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res = await adminAPI.getAuditLogs({ page: auditPage, limit: 50 });
      setAuditLogs(res.data?.logs || res.data || []);
    } catch (err) { console.error(err); }
    finally { setAuditLoading(false); }
  };

  const fetchSettings = async () => {
    try {
      const res = await adminAPI.getSettings();
      if (res.data) setSettings(s => ({ ...s, ...res.data }));
      setSettingsLoaded(true);
    } catch (err) { console.error(err); }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.create(form);
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', role: 'cashier', password: '' });
      fetchUsers();
    } catch (err) { alert(err.response?.data?.message || 'Error creating user'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try { await usersAPI.delete(id); fetchUsers(); }
    catch (err) { alert(err.response?.data?.message || 'Error deleting user'); }
  };

  const handleChangeRole = async (id, newRole) => {
    try { await usersAPI.updateRole(id, newRole); fetchUsers(); }
    catch (err) { alert(err.response?.data?.message || 'Error updating role'); }
  };

  const handleToggleActive = async (id) => {
    try { await usersAPI.toggleActive(id); fetchUsers(); }
    catch (err) { alert(err.response?.data?.message || 'Error toggling user status'); }
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      await adminAPI.updateSettings(settings);
      alert('Settings saved successfully!');
    } catch (err) { alert(err.response?.data?.message || 'Failed to save settings'); }
    finally { setSettingsSaving(false); }
  };

  const getRoleColor = (role) => {
    const map = {
      admin:     { bg: '#fee2e2', color: '#ef4444' },
      manager:   { bg: '#e0e7ff', color: '#4338ca' },
      inventory: { bg: '#fef3c7', color: '#d97706' },
      cashier:   { bg: '#f0fdf4', color: '#16a34a' },
      hr:        { bg: '#f3e8ff', color: '#9333ea' },
      expenses:  { bg: '#ffedd5', color: '#ea580c' },
    };
    return map[role] || { bg: '#f1f5f9', color: '#64748b' };
  };

  const ACTION_COLOR = {
    POST:   { bg: '#dcfce7', color: '#16a34a' },
    PUT:    { bg: '#dbeafe', color: '#2563eb' },
    DELETE: { bg: '#fee2e2', color: '#ef4444' },
    GET:    { bg: '#f1f5f9', color: '#64748b' },
  };

  const filteredLogs = auditLogs.filter(l =>
    l.endpoint?.toLowerCase().includes(auditSearch.toLowerCase()) ||
    l.User?.name?.toLowerCase().includes(auditSearch.toLowerCase()) ||
    l.action?.toLowerCase().includes(auditSearch.toLowerCase())
  );

  return (
    <div style={{ padding: 40, minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
      <header style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>System Access Control</h1>
            <p style={{ color: '#64748b', fontWeight: 600 }}>Manage user accounts, roles, audit logs, and system settings.</p>
          </div>
          {activeTab === 'Users' && (
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
                  style={{ padding: '12px 12px 12px 44px', borderRadius: 14, border: '1px solid #e2e8f0', width: 260, fontWeight: 600 }} />
              </div>
              <button onClick={() => setShowModal(true)} style={{ padding: '12px 24px', borderRadius: 14, background: '#0f172a', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserPlus size={20} /> Authorize Staff
              </button>
            </div>
          )}
          {activeTab === 'Audit Log' && (
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input value={auditSearch} onChange={e => setAuditSearch(e.target.value)} placeholder="Filter logs..."
                style={{ padding: '12px 12px 12px 44px', borderRadius: 14, border: '1px solid #e2e8f0', width: 300, fontWeight: 600 }} />
            </div>
          )}
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: 4, background: 'white', borderRadius: 16, padding: 6, width: 'fit-content', border: '1px solid #e2e8f0' }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 14, transition: 'all 0.2s',
                background: activeTab === tab ? '#0f172a' : 'transparent',
                color: activeTab === tab ? 'white' : '#64748b' }}>
              {tab === 'Users' && <User size={14} style={{ display: 'inline', marginRight: 8 }} />}
              {tab === 'Audit Log' && <Activity size={14} style={{ display: 'inline', marginRight: 8 }} />}
              {tab === 'System Settings' && <Settings size={14} style={{ display: 'inline', marginRight: 8 }} />}
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* USERS TAB */}
      {activeTab === 'Users' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
          {users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase())).map(user => {
            const style = getRoleColor(user.role);
            const isActive = user.isActive !== false;
            return (
              <motion.div whileHover={{ y: -5 }} key={user.id}
                style={{ background: 'white', borderRadius: 28, padding: 32, border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', opacity: isActive ? 1 : 0.65 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 24 }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 20, background: isActive ? '#f1f5f9' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a84ff', fontSize: 24, fontWeight: 900 }}>
                      {user.name.charAt(0)}
                    </div>
                    <div style={{ position: 'absolute', bottom: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: isActive ? '#10b981' : '#94a3b8', border: '2px solid white' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <select value={user.role} onChange={(e) => handleChangeRole(user.id, e.target.value)}
                      style={{ padding: '6px 12px', borderRadius: 8, background: style.bg, color: style.color, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', border: 'none', cursor: 'pointer' }}>
                      {['admin','manager','inventory','hr','cashier','expenses','pharmacist','operations','finance'].map(r => (
                        <option key={r} value={r}>{r.toUpperCase()}</option>
                      ))}
                    </select>
                    <div style={{ fontSize: 11, fontWeight: 700, color: isActive ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {isActive ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
                      {isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
                
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{user.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 14, fontWeight: 600 }}>
                    <Mail size={14} /> {user.email}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 14, fontWeight: 600, marginTop: 4 }}>
                    <Phone size={14} /> {user.phone || 'No phone provided'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
                  <button onClick={() => handleToggleActive(user.id)}
                    style={{ flex: 1, padding: '10px', borderRadius: 12, background: isActive ? '#fff1f2' : '#f0fdf4', color: isActive ? '#ef4444' : '#10b981', border: `1px solid ${isActive ? '#fee2e2' : '#dcfce7'}`, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    {isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    {isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => handleDelete(user.id)}
                    style={{ width: 44, height: 44, borderRadius: 12, background: 'transparent', border: '1px solid #fee2e2', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* AUDIT LOG TAB */}
      {activeTab === 'Audit Log' && (
        <div style={{ background: 'white', borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
          {auditLoading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>Loading audit trail...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                  {['Time', 'User', 'Action', 'Endpoint', 'Status', 'IP'].map(h => (
                    <th key={h} style={{ padding: '18px 20px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>No audit records found</td></tr>
                )}
                {filteredLogs.map((log, idx) => {
                  const ac = ACTION_COLOR[log.method] || ACTION_COLOR.GET;
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '12px 20px', fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                        <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                        <div style={{ color: '#94a3b8' }}>{new Date(log.createdAt).toLocaleTimeString()}</div>
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{log.User?.name || 'System'}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{log.User?.role}</div>
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 8, background: ac.bg, color: ac.color, fontSize: 11, fontWeight: 800 }}>
                          {log.method || log.action}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px', fontSize: 12, color: '#0f172a', fontWeight: 600, fontFamily: 'monospace' }}>
                        {log.endpoint || log.resource}
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                          background: log.statusCode >= 400 ? '#fee2e2' : '#dcfce7',
                          color: log.statusCode >= 400 ? '#ef4444' : '#16a34a' }}>
                          {log.statusCode || 200}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px', fontSize: 12, color: '#94a3b8', fontWeight: 600, fontFamily: 'monospace' }}>
                        {log.ipAddress || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* SYSTEM SETTINGS TAB */}
      {activeTab === 'System Settings' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {[
            { section: 'Store Identity', fields: [
              { label: 'STORE NAME', key: 'storeName', placeholder: 'GlobalAI ERP Store' },
              { label: 'CURRENCY CODE', key: 'currency', placeholder: 'USD' },
              { label: 'TAX RATE (%)', key: 'taxRate', placeholder: '8', type: 'number' },
            ]},
            { section: 'Attendance & HR', fields: [
              { label: 'SHIFT START TIME', key: 'shiftStart', placeholder: '09:00', type: 'time' },
              { label: 'SHIFT END TIME', key: 'shiftEnd', placeholder: '18:00', type: 'time' },
              { label: 'GEOFENCE RADIUS (metres)', key: 'geofenceRadius', placeholder: '500', type: 'number' },
            ]},
          ].map(({ section, fields }) => (
            <div key={section} style={{ background: 'white', borderRadius: 24, padding: 32, border: '1px solid rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 24 }}>{section}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {fields.map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>{f.label}</label>
                    <input type={f.type || 'text'} value={settings[f.key] || ''} onChange={e => setSettings({...settings, [f.key]: e.target.value})}
                      placeholder={f.placeholder}
                      style={{ width: '100%', padding: '13px 16px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 600, fontSize: 14 }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div style={{ gridColumn: '1/-1' }}>
            <button onClick={handleSaveSettings} disabled={settingsSaving}
              style={{ padding: '18px 48px', borderRadius: 16, background: '#0f172a', color: 'white', border: 'none', fontWeight: 900, fontSize: 16, cursor: 'pointer' }}>
              {settingsSaving ? 'Saving...' : '💾 Save All Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      <AnimatePresence>
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }} style={{ background: 'white', borderRadius: 32, width: '100%', maxWidth: 450, position: 'relative', padding: 40 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h2 style={{ fontSize: 24, fontWeight: 900 }}>Authorize Staff</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={24} color="#64748b" /></button>
              </div>
              <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <input required placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600 }} />
                <input required type="email" placeholder="Email Address" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600 }} />
                <input required placeholder="Phone Number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600 }} />
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600, background: 'white' }}>
                  {[['admin','System Admin'],['manager','Store Manager'],['inventory','Inventory Lead'],['hr','HR Head'],['cashier','Cashier'],['expenses','Expenses Officer'],['pharmacist','Pharmacist'],['operations','Operations'],['finance','Finance']].map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <input type="password" placeholder="Temporary Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600 }} />
                <button type="submit" style={{ marginTop: 16, width: '100%', padding: 16, borderRadius: 16, background: '#0f172a', color: 'white', border: 'none', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>
                  Create Account
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Users;
