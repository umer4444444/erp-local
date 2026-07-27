import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Book, FileText, Activity, AlertCircle } from 'lucide-react';

const Accounting = () => {
  const [activeTab, setActiveTab] = useState('chart');
  const [accounts, setAccounts] = useState([]);
  const [journals, setJournals] = useState([]);
  const [trialBalance, setTrialBalance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002';
      
      if (activeTab === 'chart') {
        const { data } = await axios.get(`${baseUrl}/api/accounting/accounts`, { headers });
        setAccounts(data);
      } else if (activeTab === 'journals') {
        const { data } = await axios.get(`${baseUrl}/api/accounting/journal-entries`, { headers });
        setJournals(data);
      } else if (activeTab === 'trial') {
        const { data } = await axios.get(`${baseUrl}/api/accounting/trial-balance`, { headers });
        setTrialBalance(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
    <div style={{ padding: 24, background: '#f9fafb', minHeight: '100vh', fontFamily: 'Outfit, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Accounting</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0' }}>Manage general ledger and financial statements.</p>
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
    </div>
  );
};

export default Accounting;
