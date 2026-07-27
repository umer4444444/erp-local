import React, { useState, useEffect } from 'react';
import API from '../api';
import { Book, FileText, Activity, Plus, X, Trash2 } from 'lucide-react';

const Accounting = () => {
  const [activeTab, setActiveTab] = useState('chart');
  const [accounts, setAccounts] = useState([]);
  const [journals, setJournals] = useState([]);
  const [trialBalance, setTrialBalance] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);

  // Form states
  const [newAccount, setNewAccount] = useState({ code: '', name: '', type: 'asset' });
  const [newJournal, setNewJournal] = useState({
    date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    lines: [
      { id: Date.now(), accountId: '', debit: '', credit: '', description: '' },
      { id: Date.now() + 1, accountId: '', debit: '', credit: '', description: '' }
    ]
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'chart') {
        const { data } = await API.get('/accounting/accounts');
        setAccounts(data);
      } else if (activeTab === 'journals') {
        const { data } = await API.get('/accounting/journal-entries');
        setJournals(data);
      } else if (activeTab === 'trial') {
        const { data } = await API.get('/accounting/trial-balance');
        setTrialBalance(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      await API.post('/accounting/accounts', newAccount);
      setShowAccountModal(false);
      setNewAccount({ code: '', name: '', type: 'asset' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create account');
    }
  };

  const addJournalLine = () => {
    setNewJournal({
      ...newJournal,
      lines: [...newJournal.lines, { id: Date.now(), accountId: '', debit: '', credit: '', description: '' }]
    });
  };

  const removeJournalLine = (id) => {
    setNewJournal({
      ...newJournal,
      lines: newJournal.lines.filter(l => l.id !== id)
    });
  };

  const updateJournalLine = (id, field, value) => {
    setNewJournal({
      ...newJournal,
      lines: newJournal.lines.map(l => l.id === id ? { ...l, [field]: value } : l)
    });
  };

  const handleCreateJournal = async (e) => {
    e.preventDefault();
    // Validate balance
    const totalDebit = newJournal.lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
    const totalCredit = newJournal.lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      alert(`Journal entry must balance! Debits: ${totalDebit}, Credits: ${totalCredit}`);
      return;
    }

    try {
      await API.post('/accounting/journal-entries', newJournal);
      setShowJournalModal(false);
      setNewJournal({
        date: new Date().toISOString().split('T')[0],
        reference: '',
        description: '',
        lines: [
          { id: Date.now(), accountId: '', debit: '', credit: '', description: '' },
          { id: Date.now() + 1, accountId: '', debit: '', credit: '', description: '' }
        ]
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create journal entry');
    }
  };

  // Pre-fetch accounts for journal modal if needed
  useEffect(() => {
    if (showJournalModal && accounts.length === 0) {
      const fetchAccounts = async () => {
        try {
          const { data } = await API.get('/accounting/accounts');
          setAccounts(data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchAccounts();
    }
  }, [showJournalModal]);

  const renderTabs = () => (
    <div style={{ display: 'flex', gap: 16, marginBottom: 24, borderBottom: '1px solid #e5e7eb', paddingBottom: 16 }}>
      <button 
        onClick={() => setActiveTab('chart')}
        style={{
          background: activeTab === 'chart' ? '#e0e7ff' : 'transparent',
          color: activeTab === 'chart' ? '#4f46e5' : '#6b7280',
          border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8
        }}
      >
        <Book size={18} /> Chart of Accounts
      </button>
      <button 
        onClick={() => setActiveTab('journals')}
        style={{
          background: activeTab === 'journals' ? '#e0e7ff' : 'transparent',
          color: activeTab === 'journals' ? '#4f46e5' : '#6b7280',
          border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8
        }}
      >
        <FileText size={18} /> Journal Entries
      </button>
      <button 
        onClick={() => setActiveTab('trial')}
        style={{
          background: activeTab === 'trial' ? '#e0e7ff' : 'transparent',
          color: activeTab === 'trial' ? '#4f46e5' : '#6b7280',
          border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8
        }}
      >
        <Activity size={18} /> Trial Balance
      </button>
    </div>
  );

  return (
    <div style={{ padding: '80px 24px 24px 24px', background: '#f9fafb', minHeight: '100vh', fontFamily: 'Outfit, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Accounting</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0' }}>Manage general ledger and financial statements.</p>
        </div>
        <div>
          {activeTab === 'chart' && (
            <button 
              onClick={() => setShowAccountModal(true)}
              style={{ background: '#4f46e5', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Plus size={18} /> Add Account
            </button>
          )}
          {activeTab === 'journals' && (
            <button 
              onClick={() => setShowJournalModal(true)}
              style={{ background: '#4f46e5', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Plus size={18} /> New Journal Entry
            </button>
          )}
        </div>
      </div>

      {renderTabs()}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading data...</div>
      ) : (
        <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          
          {activeTab === 'chart' && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                <tr>
                  <th style={{ padding: 16, textAlign: 'left', fontWeight: 600, color: '#475569' }}>Code</th>
                  <th style={{ padding: 16, textAlign: 'left', fontWeight: 600, color: '#475569' }}>Account Name</th>
                  <th style={{ padding: 16, textAlign: 'left', fontWeight: 600, color: '#475569' }}>Type</th>
                  <th style={{ padding: 16, textAlign: 'left', fontWeight: 600, color: '#475569' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No accounts found.</td></tr>
                ) : accounts.map(acc => (
                  <tr key={acc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: 16, color: '#0f172a', fontWeight: 500 }}>{acc.code}</td>
                    <td style={{ padding: 16, color: '#0f172a' }}>{acc.name}</td>
                    <td style={{ padding: 16 }}>
                      <span style={{ 
                        background: '#e0e7ff', color: '#4f46e5', padding: '4px 8px', borderRadius: 9999, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' 
                      }}>
                        {acc.type}
                      </span>
                    </td>
                    <td style={{ padding: 16, color: acc.isActive ? '#10b981' : '#ef4444' }}>{acc.isActive ? 'Active' : 'Inactive'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'journals' && (
            <div style={{ padding: 24 }}>
              {journals.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>No journal entries recorded.</div>
              ) : journals.map(entry => (
                <div key={entry.id} style={{ marginBottom: 24, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ background: '#f8fafc', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb' }}>
                    <div>
                      <strong>{new Date(entry.date).toLocaleDateString()}</strong> - {entry.description}
                    </div>
                    <div style={{ color: '#64748b' }}>Ref: {entry.reference || 'N/A'}</div>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {entry.Lines?.map(line => (
                        <tr key={line.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 16px', width: '50%' }}>{line.ChartOfAccount?.name || 'Unknown Account'}</td>
                          <td style={{ padding: '8px 16px', textAlign: 'right', color: '#10b981', width: '25%' }}>{Number(line.debit) > 0 ? Number(line.debit).toFixed(2) : '-'}</td>
                          <td style={{ padding: '8px 16px', textAlign: 'right', color: '#ef4444', width: '25%' }}>{Number(line.credit) > 0 ? Number(line.credit).toFixed(2) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'trial' && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                <tr>
                  <th style={{ padding: 16, textAlign: 'left', fontWeight: 600, color: '#475569' }}>Account</th>
                  <th style={{ padding: 16, textAlign: 'right', fontWeight: 600, color: '#475569' }}>Debit</th>
                  <th style={{ padding: 16, textAlign: 'right', fontWeight: 600, color: '#475569' }}>Credit</th>
                  <th style={{ padding: 16, textAlign: 'right', fontWeight: 600, color: '#475569' }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {trialBalance.length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No data.</td></tr>
                ) : trialBalance.map(acc => (
                  <tr key={acc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: 16, color: '#0f172a', fontWeight: 500 }}>{acc.code} - {acc.name}</td>
                    <td style={{ padding: 16, textAlign: 'right', color: '#10b981' }}>{acc.totalDebit > 0 ? acc.totalDebit.toFixed(2) : '-'}</td>
                    <td style={{ padding: 16, textAlign: 'right', color: '#ef4444' }}>{acc.totalCredit > 0 ? acc.totalCredit.toFixed(2) : '-'}</td>
                    <td style={{ padding: 16, textAlign: 'right', fontWeight: 700 }}>{acc.balance.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </div>
      )}

      {/* Add Account Modal */}
      {showAccountModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, width: '100%', maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Add Account</h2>
              <button onClick={() => setShowAccountModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateAccount}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Account Code</label>
                <input 
                  type="text" 
                  value={newAccount.code} 
                  onChange={e => setNewAccount({...newAccount, code: e.target.value})} 
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #d1d5db' }}
                  required
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Account Name</label>
                <input 
                  type="text" 
                  value={newAccount.name} 
                  onChange={e => setNewAccount({...newAccount, name: e.target.value})} 
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #d1d5db' }}
                  required
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Account Type</label>
                <select 
                  value={newAccount.type} 
                  onChange={e => setNewAccount({...newAccount, type: e.target.value})} 
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #d1d5db', background: 'white' }}
                >
                  <option value="asset">Asset</option>
                  <option value="liability">Liability</option>
                  <option value="equity">Equity</option>
                  <option value="revenue">Revenue</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <button type="submit" style={{ width: '100%', background: '#4f46e5', color: 'white', border: 'none', padding: 12, borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                Save Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Journal Modal */}
      {showJournalModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, width: '100%', maxWidth: 800 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>New Journal Entry</h2>
              <button onClick={() => setShowJournalModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateJournal}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Date</label>
                  <input type="date" value={newJournal.date} onChange={e => setNewJournal({...newJournal, date: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #d1d5db' }} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Reference (Optional)</label>
                  <input type="text" value={newJournal.reference} onChange={e => setNewJournal({...newJournal, reference: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #d1d5db' }} />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Description</label>
                <input type="text" value={newJournal.description} onChange={e => setNewJournal({...newJournal, description: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #d1d5db' }} required />
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, marginBottom: 12 }}>Journal Lines</h3>
                <div style={{ display: 'flex', background: '#f8fafc', padding: 12, borderRadius: '8px 8px 0 0', borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ flex: 3, fontWeight: 600 }}>Account</div>
                  <div style={{ flex: 2, fontWeight: 600 }}>Description</div>
                  <div style={{ flex: 1, fontWeight: 600, textAlign: 'right' }}>Debit</div>
                  <div style={{ flex: 1, fontWeight: 600, textAlign: 'right' }}>Credit</div>
                  <div style={{ width: 40 }}></div>
                </div>
                {newJournal.lines.map((line, index) => (
                  <div key={line.id} style={{ display: 'flex', gap: 8, padding: '12px 0', borderBottom: '1px solid #e5e7eb', alignItems: 'center' }}>
                    <div style={{ flex: 3 }}>
                      <select value={line.accountId} onChange={e => updateJournalLine(line.id, 'accountId', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db' }} required>
                        <option value="">Select Account...</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 2 }}>
                      <input type="text" value={line.description} onChange={e => updateJournalLine(line.id, 'description', e.target.value)} placeholder="Line desc..." style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <input type="number" step="0.01" value={line.debit} onChange={e => { updateJournalLine(line.id, 'debit', e.target.value); updateJournalLine(line.id, 'credit', ''); }} placeholder="0.00" style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db', textAlign: 'right' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <input type="number" step="0.01" value={line.credit} onChange={e => { updateJournalLine(line.id, 'credit', e.target.value); updateJournalLine(line.id, 'debit', ''); }} placeholder="0.00" style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db', textAlign: 'right' }} />
                    </div>
                    <div style={{ width: 40, textAlign: 'center' }}>
                      {newJournal.lines.length > 2 && (
                        <button type="button" onClick={() => removeJournalLine(line.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                      )}
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addJournalLine} style={{ background: 'transparent', border: 'none', color: '#4f46e5', fontWeight: 600, marginTop: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Plus size={16} /> Add Line
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: 16, borderRadius: 8, marginBottom: 24 }}>
                <div style={{ fontWeight: 600 }}>Total</div>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div style={{ color: '#10b981', fontWeight: 700 }}>Dr: {newJournal.lines.reduce((s, l) => s + Number(l.debit || 0), 0).toFixed(2)}</div>
                  <div style={{ color: '#ef4444', fontWeight: 700 }}>Cr: {newJournal.lines.reduce((s, l) => s + Number(l.credit || 0), 0).toFixed(2)}</div>
                </div>
              </div>

              <button type="submit" style={{ width: '100%', background: '#4f46e5', color: 'white', border: 'none', padding: 12, borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                Post Journal Entry
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Accounting;
