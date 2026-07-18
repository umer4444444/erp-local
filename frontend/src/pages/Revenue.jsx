import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, BarChart3,
  Download, RefreshCw, Award, Users, Package,
  ArrowUpRight, ArrowDownRight, Calendar, Filter
} from 'lucide-react';
import { motion } from 'framer-motion';
import { reportsAPI } from '../api';

const fmtCurrency = (n) =>
  `$${parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const MetricCard = ({ title, value, sub, trend, color = '#0a84ff', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    style={{
      background: 'white', padding: 28, borderRadius: 28,
      border: '1px solid rgba(0,0,0,0.05)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)', flex: 1
    }}
  >
    <div style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', letterSpacing: 1, marginBottom: 10 }}>{title.toUpperCase()}</div>
    <div style={{ fontSize: 30, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>{value}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
      {trend === 'up' ? <ArrowUpRight size={14} color="#10b981" /> : <ArrowDownRight size={14} color="#ef4444" />}
      <span style={{ color: trend === 'up' ? '#10b981' : '#ef4444' }}>{sub}</span>
    </div>
  </motion.div>
);

const Revenue = () => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  const [from, setFrom] = useState(firstDay);
  const [to, setTo] = useState(todayStr);
  const [pnlFrom, setPnlFrom] = useState(firstDay);
  const [pnlTo, setPnlTo] = useState(todayStr);

  const [revData, setRevData] = useState(null);
  const [pnl, setPnl] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [salesperson, setSalesperson] = useState([]);
  const [daily, setDaily] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [revRes, pnlRes, topRes, spRes, dayRes] = await Promise.all([
        reportsAPI.getRevenue({ from, to }),
        reportsAPI.getPnL({ from: pnlFrom, to: pnlTo }),
        reportsAPI.getTopProducts(8),
        reportsAPI.getSalesperson(),
        reportsAPI.getDaily(),
      ]);
      setRevData(revRes.data);
      setPnl(pnlRes.data);
      setTopProducts(topRes.data || []);
      setSalesperson(spRes.data || []);
      setDaily(dayRes.data);
    } catch (err) {
      console.error('Revenue fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [from, to, pnlFrom, pnlTo]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const exportCSV = () => {
    if (!pnl) return alert('Data not loaded yet');
    const rows = [
      ['Revenue Intelligence Report', ''],
      ['Generated At', new Date().toLocaleString()],
      ['Period', `${from} to ${to}`],
      ['', ''],
      ['P&L STATEMENT', ''],
      ['Revenue', pnl.revenue],
      ['Cost of Goods Sold (COGS)', pnl.cogs],
      ['Total Expenses', pnl.expenses],
      ['Net Profit', pnl.netProfit],
      ['', ''],
      ['TOP PRODUCTS', ''],
      ['Product', 'Units Sold', 'Revenue'],
      ...topProducts.map(p => [p.Product?.name, p.totalSold, p.totalRevenue]),
      ['', ''],
      ['SALES BY STAFF', ''],
      ['Name', 'Transactions', 'Revenue'],
      ...salesperson.map(s => [s.User?.name, s.salesCount, s.revenueGenerated]),
    ];
    const csv = rows.map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `revenue_report_${todayStr}.csv`;
    a.click();
  };

  const maxRevenue = topProducts.reduce((m, p) => Math.max(m, parseFloat(p.totalRevenue || 0)), 1);

  return (
    <div style={{ padding: 40, minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <header style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Revenue Intelligence</h1>
          <p style={{ color: '#64748b', fontWeight: 600 }}>In-depth financial analytics powered by live data.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Date range filter */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'white', padding: '8px 16px', borderRadius: 14, border: '1px solid #e2e8f0' }}>
            <Calendar size={16} color="#94a3b8" />
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              style={{ border: 'none', outline: 'none', fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: '#0f172a', background: 'transparent' }} />
            <span style={{ color: '#94a3b8' }}>→</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              style={{ border: 'none', outline: 'none', fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: '#0f172a', background: 'transparent' }} />
          </div>
          <button onClick={fetchAll}
            style={{ padding: '10px 20px', borderRadius: 14, background: 'white', border: '1px solid #e2e8f0', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button onClick={exportCSV}
            style={{ padding: '10px 20px', borderRadius: 14, background: '#0f172a', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 120, color: '#94a3b8', fontSize: 18, fontWeight: 700 }}>
          Loading intelligence...
        </div>
      ) : (
        <>
          {/* Daily Summary Banner */}
          {daily && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', borderRadius: 28, padding: '24px 40px', marginBottom: 32, display: 'flex', gap: 48, alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>TODAY'S REVENUE</div>
                <div style={{ color: 'white', fontSize: 36, fontWeight: 900 }}>{fmtCurrency(daily.revenue)}</div>
              </div>
              <div style={{ width: 1, height: 50, background: 'rgba(255,255,255,0.1)' }} />
              <div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>TRANSACTIONS TODAY</div>
                <div style={{ color: 'white', fontSize: 36, fontWeight: 900 }}>{daily.count}</div>
              </div>
              <div style={{ width: 1, height: 50, background: 'rgba(255,255,255,0.1)' }} />
              <div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>AVG BASKET SIZE</div>
                <div style={{ color: 'white', fontSize: 36, fontWeight: 900 }}>{fmtCurrency(daily.averageBasket)}</div>
              </div>
            </motion.div>
          )}

          {/* Revenue Range Metric Cards */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 32, flexWrap: 'wrap' }}>
            <MetricCard title="Period Revenue" value={fmtCurrency(revData?.totalRevenue)} sub={`${revData?.salesCount || 0} transactions`} trend="up" delay={0.1} />
            <MetricCard title="Net Profit" value={fmtCurrency(pnl?.netProfit)} sub={pnl?.netProfit >= 0 ? 'Profitable period' : 'Operating at loss'} trend={pnl?.netProfit >= 0 ? 'up' : 'down'} color="#10b981" delay={0.2} />
            <MetricCard title="COGS" value={fmtCurrency(pnl?.cogs)} sub="Cost of goods sold" trend="down" color="#f59e0b" delay={0.3} />
            <MetricCard title="Expenses" value={fmtCurrency(pnl?.expenses)} sub="Operating expenses" trend="down" color="#ef4444" delay={0.4} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginBottom: 28 }}>
            {/* P&L Statement */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              style={{ background: 'white', borderRadius: 28, padding: 36, border: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>P&amp;L Statement</h2>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="date" value={pnlFrom} onChange={e => setPnlFrom(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontFamily: "'Outfit', sans-serif", fontWeight: 700, outline: 'none' }} />
                  <span style={{ color: '#94a3b8', fontWeight: 800 }}>to</span>
                  <input type="date" value={pnlTo} onChange={e => setPnlTo(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontFamily: "'Outfit', sans-serif", fontWeight: 700, outline: 'none' }} />
                </div>
              </div>
              {pnl && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { label: 'Revenue', value: pnl.revenue, color: '#10b981', sign: '+' },
                    { label: 'Cost of Goods (COGS)', value: pnl.cogs, color: '#f59e0b', sign: '-' },
                    { label: 'Operating Expenses', value: pnl.expenses, color: '#ef4444', sign: '-' },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #f8fafc' }}>
                      <span style={{ color: '#64748b', fontWeight: 700 }}>{row.label}</span>
                      <span style={{ fontWeight: 900, color: row.color, fontSize: 18 }}>{row.sign}{fmtCurrency(row.value)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 0 0', marginTop: 8 }}>
                    <span style={{ fontWeight: 900, color: '#0f172a', fontSize: 18 }}>Net Profit</span>
                    <span style={{ fontWeight: 900, fontSize: 28, color: pnl.netProfit >= 0 ? '#10b981' : '#ef4444' }}>
                      {pnl.netProfit >= 0 ? '+' : ''}{fmtCurrency(pnl.netProfit)}
                    </span>
                  </div>
                  <div style={{ marginTop: 16, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, (pnl.netProfit / pnl.revenue) * 100))}%`, background: pnl.netProfit >= 0 ? '#10b981' : '#ef4444', borderRadius: 4, transition: 'width 0.6s ease' }} />
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, marginTop: 6 }}>
                    Margin: {pnl.revenue > 0 ? ((pnl.netProfit / pnl.revenue) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              )}
            </motion.div>

            {/* Sales by Salesperson */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              style={{ background: 'white', borderRadius: 28, padding: 36, border: '1px solid rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Award size={22} color="#f59e0b" /> Staff Leaderboard
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {salesperson.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontWeight: 700 }}>No sales data available.</div>
                )}
                {salesperson.map((s, i) => {
                  const maxRev = parseFloat(salesperson[0]?.revenueGenerated || 1);
                  const pct = (parseFloat(s.revenueGenerated) / maxRev) * 100;
                  return (
                    <div key={s.userId}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? '#fef3c7' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: i === 0 ? '#d97706' : '#64748b' }}>
                            {i + 1}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>{s.User?.name || 'Unknown'}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{s.salesCount} transactions</div>
                          </div>
                        </div>
                        <div style={{ fontWeight: 900, color: '#0a84ff', fontSize: 15 }}>{fmtCurrency(s.revenueGenerated)}</div>
                      </div>
                      <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: i === 0 ? '#f59e0b' : '#0a84ff', borderRadius: 3, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Top Products */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            style={{ background: 'white', borderRadius: 28, padding: 36, border: '1px solid rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Package size={22} color="#0a84ff" /> Top Selling Products
            </h2>
            {topProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontWeight: 700 }}>No product sales data available.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {topProducts.map((p, i) => {
                  const barPct = (parseFloat(p.totalRevenue || 0) / maxRevenue) * 100;
                  return (
                    <div key={p.productId} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 100px 120px', alignItems: 'center', gap: 16 }}>
                      <div style={{ fontWeight: 900, color: '#94a3b8', fontSize: 14, textAlign: 'center' }}>{i + 1}</div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14, marginBottom: 6 }}>
                          {p.Product?.name || p.Product?.sku || 'Unknown'}
                        </div>
                        <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${barPct}%`, background: `hsl(${220 - i * 18}, 80%, 55%)`, borderRadius: 4, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontWeight: 700, color: '#64748b', fontSize: 13 }}>
                        {parseInt(p.totalSold).toLocaleString()} units
                      </div>
                      <div style={{ textAlign: 'right', fontWeight: 900, color: '#10b981', fontSize: 15 }}>
                        {fmtCurrency(p.totalRevenue)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
};

export default Revenue;
