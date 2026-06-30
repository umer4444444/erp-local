import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingDown, Calendar, Filter, 
  Plus, Search, ArrowUpRight, ArrowDownRight, 
  FileText, PieChart, CreditCard, ShoppingBag, Zap,
  Edit, Trash2, CheckCircle, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { expenseAPI, salesAPI, supplierAPI } from '../api';

// Parse DATEONLY strings ("YYYY-MM-DD") in local time to avoid UTC midnight shift
const parseExpenseDate = (dateStr) => {
  if (!dateStr) return null;
  const parts = String(dateStr).split('T')[0].split('-');
  if (parts.length === 3) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }
  return new Date(dateStr);
};

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ category: 'Utilities', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
  const [editId, setEditId] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, daily, monthly
  const [stats, setStats] = useState({ activeVendors: 0, revenueRatio: 0, monthOverMonthChange: 0 });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const [expRes, salesRes, supRes] = await Promise.all([
        expenseAPI.getAll(),
        salesAPI.getAnalytics().catch(() => ({ data: { totalRevenue: 0 } })),
        supplierAPI.getAll().catch(() => ({ data: [] }))
      ]);
      
      const expensesData = expRes.data;
      setExpenses(expensesData);

      const now = new Date();
      const currentMonthExpenses = expensesData.filter(e => {
        const d = parseExpenseDate(e.date || e.createdAt);
        return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthExpenses = expensesData.filter(e => {
        const d = parseExpenseDate(e.date || e.createdAt);
        return d && d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
      }).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

      let change = 0;
      if (lastMonthExpenses > 0) {
        change = ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
      } else if (currentMonthExpenses > 0) {
        change = 100;
      }

      const totalExpenseSum = expensesData.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      const totalRevenue = salesRes.data?.totalRevenue || 0;
      let ratio = 0;
      if (totalRevenue > 0) {
        ratio = (totalExpenseSum / totalRevenue) * 100;
      }

      const vendorsCount = supRes.data?.length || new Set(expensesData.map(e => e.category)).size;

      setStats({
        activeVendors: vendorsCount,
        revenueRatio: ratio,
        monthOverMonthChange: change
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await expenseAPI.update(editId, form);
      } else {
        await expenseAPI.add(form);
      }
      setShowModal(false);
      setEditId(null);
      setForm({ category: 'Utilities', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
      fetchExpenses();
    } catch (err) {
      alert('Failed to save expense');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await expenseAPI.delete(id);
        fetchExpenses();
      } catch (err) {
        alert('Failed to delete expense');
      }
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await expenseAPI.updateStatus(id, status);
      fetchExpenses();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const openEditModal = (expense) => {
    setEditId(expense.id);
    setForm({
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const getFilteredExpenses = () => {
    const today = new Date();
    return expenses.filter(e => {
      if (filterType === 'all') return true;
      const expenseDate = parseExpenseDate(e.date || e.createdAt);
      if (!expenseDate) return false;
      if (filterType === 'daily') {
        return (
          expenseDate.getFullYear() === today.getFullYear() &&
          expenseDate.getMonth() === today.getMonth() &&
          expenseDate.getDate() === today.getDate()
        );
      }
      if (filterType === 'monthly') {
        return expenseDate.getMonth() === today.getMonth() && expenseDate.getFullYear() === today.getFullYear();
      }
      return true;
    });
  };

  const filteredExpenses = getFilteredExpenses();
  const totalExpense = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const categories = [
    { name: 'Utilities', icon: <Zap size={18} />, color: '#0a84ff' },
    { name: 'Inventory', icon: <ShoppingBag size={18} />, color: '#f59e0b' },
    { name: 'Payroll', icon: <DollarSign size={18} />, color: '#10b981' },
    { name: 'Logistics', icon: <ArrowUpRight size={18} />, color: '#a855f7' },
    { name: 'Other', icon: <FileText size={18} />, color: '#64748b' }
  ];

  return (
    <div style={{ padding: 40, minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>Expense Management</h1>
          <p style={{ color: '#64748b', fontWeight: 600 }}>Track operational costs and business overheads.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          style={{ padding: '14px 28px', borderRadius: 16, background: '#0f172a', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <Plus size={20} /> Log Expense
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40 }}>
        <div style={{ background: 'white', padding: 32, borderRadius: 32, border: '1px solid rgba(0,0,0,0.05)', gridColumn: 'span 2' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>TOTAL ACCUMULATED BURN</div>
          <div style={{ fontSize: 48, fontWeight: 900, color: '#0f172a' }}>${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: stats.monthOverMonthChange > 0 ? '#ef4444' : '#10b981', fontSize: 14, fontWeight: 800, marginTop: 12 }}>
            <TrendingDown size={18} style={{ transform: stats.monthOverMonthChange > 0 ? 'scaleY(-1)' : 'none' }} /> 
            {stats.monthOverMonthChange > 0 ? '+' : ''}{stats.monthOverMonthChange.toFixed(1)}% from last month
          </div>
        </div>
        <div style={{ background: '#0a84ff', padding: 32, borderRadius: 32, color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ opacity: 0.8, fontSize: 13, fontWeight: 700 }}>ACTIVE VENDORS</div>
          <div style={{ fontSize: 32, fontWeight: 900 }}>{stats.activeVendors}</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: 32, borderRadius: 32, color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ opacity: 0.8, fontSize: 13, fontWeight: 700 }}>REVENUE RATIO</div>
          <div style={{ fontSize: 32, fontWeight: 900 }}>{stats.revenueRatio.toFixed(1)}%</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
        {/* Expense List */}
        <div style={{ background: 'white', borderRadius: 32, border: '1px solid rgba(0,0,0,0.05)', padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>Transaction Audit</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setFilterType('all')} style={{ padding: '8px 16px', borderRadius: 10, background: filterType === 'all' ? '#0f172a' : '#f1f5f9', border: 'none', color: filterType === 'all' ? 'white' : '#64748b', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>All</button>
              <button onClick={() => setFilterType('daily')} style={{ padding: '8px 16px', borderRadius: 10, background: filterType === 'daily' ? '#0f172a' : '#f1f5f9', border: 'none', color: filterType === 'daily' ? 'white' : '#64748b', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>Daily</button>
              <button onClick={() => setFilterType('monthly')} style={{ padding: '8px 16px', borderRadius: 10, background: filterType === 'monthly' ? '#0f172a' : '#f1f5f9', border: 'none', color: filterType === 'monthly' ? 'white' : '#64748b', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>Monthly</button>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredExpenses.map(expense => (
              <div key={expense.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderRadius: 20, background: '#f8fafc', border: '1px solid transparent' }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a84ff' }}>
                  {categories.find(c => c.name === expense.category)?.icon || <FileText size={20} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{expense.description}</div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{expense.category} • {expense.date ? parseExpenseDate(expense.date).toLocaleDateString() : 'N/A'}</div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div style={{ fontWeight: 900, color: '#ef4444' }}>-${parseFloat(expense.amount).toFixed(2)}</div>
                  <div style={{ fontSize: 11, color: expense.status === 'approved' ? '#10b981' : expense.status === 'rejected' ? '#ef4444' : '#f59e0b', fontWeight: 800, textTransform: 'uppercase' }}>{expense.status || 'pending'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
                  {(!expense.status || expense.status === 'pending') && (
                    <>
                      <button onClick={() => handleUpdateStatus(expense.id, 'approved')} style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer' }} title="Approve"><CheckCircle size={18} /></button>
                      <button onClick={() => handleUpdateStatus(expense.id, 'rejected')} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Reject"><XCircle size={18} /></button>
                    </>
                  )}
                  <button onClick={() => openEditModal(expense)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }} title="Edit"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(expense.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Delete"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
            {filteredExpenses.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>No expenses found.</div>}
          </div>
        </div>

        {/* Category Breakdown */}
        <div style={{ background: 'white', borderRadius: 32, border: '1px solid rgba(0,0,0,0.05)', padding: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 24 }}>Budget Breakdown</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {categories.map(cat => {
              const catTotal = filteredExpenses.filter(e => e.category === cat.name).reduce((sum, e) => sum + parseFloat(e.amount), 0);
              const percentage = totalExpense > 0 ? ((catTotal / totalExpense) * 100).toFixed(0) : 0;
              return (
                <div key={cat.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color }} />
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{cat.name}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#64748b' }}>{percentage}%</span>
                  </div>
                  <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${percentage}%`, height: '100%', background: cat.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => { setShowModal(false); setEditId(null); setForm({ category: 'Utilities', amount: '', description: '', date: new Date().toISOString().split('T')[0] }); }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} style={{ background: 'white', borderRadius: 32, width: '100%', maxWidth: 450, position: 'relative', padding: 40 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 32 }}>{editId ? 'Edit Business Expense' : 'Log Business Expense'}</h2>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>CATEGORY</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600 }}>
                  {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>AMOUNT ($)</label>
                <input required type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0.00" style={{ width: '100%', padding: '14px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>DESCRIPTION</label>
                <input required value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="e.g. Monthly Electricity Bill" style={{ width: '100%', padding: '14px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>DATE</label>
                <input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600 }} />
              </div>
              <button type="submit" style={{ marginTop: 16, padding: 18, borderRadius: 20, background: '#0f172a', color: 'white', border: 'none', fontWeight: 900, cursor: 'pointer' }}>{editId ? 'Save Changes' : 'Add to Audit Ledger'}</button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
