import React, { useState, useEffect } from 'react';
import { User, Shield, Mail, Phone, Plus, Search, MoreVertical, ShieldCheck, UserPlus, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usersAPI } from '../api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'cashier', password: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await usersAPI.getAll();
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.create(form);
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', role: 'cashier', password: '' });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating user');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await usersAPI.delete(id);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting user');
    }
  };

  const handleChangeRole = async (id, newRole) => {
    try {
      await usersAPI.updateRole(id, newRole);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating role');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return { bg: '#fee2e2', color: '#ef4444' };
      case 'manager': return { bg: '#e0e7ff', color: '#4338ca' };
      case 'inventory': return { bg: '#fef3c7', color: '#d97706' };
      case 'cashier': return { bg: '#f0fdf4', color: '#16a34a' };
      case 'hr': return { bg: '#f3e8ff', color: '#9333ea' };
      default: return { bg: '#f1f5f9', color: '#64748b' };
    }
  };

  return (
    <div style={{ padding: 40, minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>System Access Control</h1>
          <p style={{ color: '#64748b', fontWeight: 600 }}>Manage user accounts, roles, and security permissions.</p>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search users..." 
              style={{ padding: '12px 12px 12px 44px', borderRadius: 14, border: '1px solid #e2e8f0', width: 260, fontWeight: 600 }}
            />
          </div>
          <button onClick={() => setShowModal(true)} style={{ padding: '12px 24px', borderRadius: 14, background: '#0f172a', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserPlus size={20} /> Authorize Staff
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
        {users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase())).map(user => {
          const style = getRoleColor(user.role);
          return (
            <motion.div 
              whileHover={{ y: -5 }}
              key={user.id} 
              style={{ background: 'white', borderRadius: 28, padding: 32, border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 24 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a84ff', fontSize: 24, fontWeight: 900 }}>
                  {user.name.charAt(0)}
                </div>
                <select 
                  value={user.role}
                  onChange={(e) => handleChangeRole(user.id, e.target.value)}
                  style={{ padding: '6px 12px', borderRadius: 8, background: style.bg, color: style.color, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', border: 'none', cursor: 'pointer', outline: 'none' }}
                >
                  <option value="admin">ADMIN</option>
                  <option value="manager">MANAGER</option>
                  <option value="inventory">INVENTORY</option>
                  <option value="hr">HR</option>
                  <option value="cashier">CASHIER</option>
                </select>
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

              <div style={{ display: 'flex', gap: 12, borderTop: '1px solid #f1f5f9', paddingTop: 24 }}>
                <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: '#f8fafc', color: '#64748b', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <ShieldCheck size={14} /> {user.role === 'admin' ? 'Full Access' : 'Limited Access'}
                </div>
                <button onClick={() => handleDelete(user.id)} style={{ width: 44, height: 44, borderRadius: 12, background: 'transparent', border: '1px solid #fee2e2', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

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
                <input required placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600, outline: 'none' }} />
                <input required type="email" placeholder="Email Address" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600, outline: 'none' }} />
                <input required placeholder="Phone Number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600, outline: 'none' }} />
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600, outline: 'none', background: 'white' }}>
                  <option value="admin">System Admin</option>
                  <option value="manager">Store Manager</option>
                  <option value="inventory">Inventory Lead</option>
                  <option value="hr">HR Head</option>
                  <option value="cashier">Cashier</option>
                </select>
                <input type="password" placeholder="Temporary Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600, outline: 'none' }} />
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
