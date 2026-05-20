import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, 
  ArrowUpRight, ArrowDownRight, BarChart3, PieChart,
  Download, Filter, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { salesAPI } from '../api';

const Revenue = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await salesAPI.getAnalytics();
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportAnalyticsToCSV = () => {
    if (!data) {
      alert('No analytics data to export. Please wait for data to load.');
      return;
    }
    const total = data.paymentMethods.total || 1;
    const cashPct = ((data.paymentMethods.cash / total) * 100).toFixed(1);
    const cardPct = ((data.paymentMethods.card / total) * 100).toFixed(1);
    const splitPct = ((data.paymentMethods.split / total) * 100).toFixed(1);

    const rows = [
      ['Revenue Intelligence Report', ''],
      ['Generated At', new Date().toLocaleString()],
      ['Period', 'Last 30 Days'],
      ['', ''],
      ['FINANCIAL SUMMARY', ''],
      ['Total Revenue', `$${data.totalRevenue.toLocaleString()}`],
      ['Average Order Value', `$${data.averageOrder}`],
      ['Operating Costs (COGS)', `$${data.totalCost.toLocaleString()}`],
      ['Net Profit', `$${data.netProfit.toLocaleString()}`],
      ['Projected Quarterly Revenue', `$${data.projectedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`],
      ['', ''],
      ['PAYMENT METHOD BREAKDOWN', ''],
      ['Method', 'Transactions', 'Percentage'],
      ['Cash', data.paymentMethods.cash, `${cashPct}%`],
      ['Credit Card', data.paymentMethods.card, `${cardPct}%`],
      ['Split Payments', data.paymentMethods.split, `${splitPct}%`],
      ['Total Transactions', data.paymentMethods.total, '100%'],
    ];

    const csvContent = rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `revenue_intelligence_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !data) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading intelligence...</div>;
  }

  const MetricCard = ({ title, value, sub, isPositive, delay }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{ background: 'white', padding: 32, borderRadius: 32, border: '1px solid rgba(0,0,0,0.05)', flex: 1 }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', marginBottom: 16 }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: isPositive ? '#10b981' : '#ef4444', fontSize: 13, fontWeight: 800 }}>
        {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        Real-time Data
        <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: 12, marginLeft: 4 }}>{sub}</span>
      </div>
    </motion.div>
  );

  return (
    <div style={{ padding: 40, minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>Revenue Intelligence</h1>
          <p style={{ color: '#64748b', fontWeight: 600 }}>In-depth analysis of financial performance and growth.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={fetchData} style={{ padding: '12px 24px', borderRadius: 14, background: 'white', border: '1px solid #e2e8f0', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={18} /> Refresh
          </button>
          <button onClick={exportAnalyticsToCSV} style={{ padding: '12px 24px', borderRadius: 14, background: '#0f172a', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={18} /> Generate Report
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', gap: 24, marginBottom: 40 }}>
        <MetricCard title="Total Revenue" value={`$${data.totalRevenue.toLocaleString()}`} sub="Last 30 days" isPositive={true} delay={0.1} />
        <MetricCard title="Average Order" value={`$${data.averageOrder}`} sub="Per transaction" isPositive={true} delay={0.2} />
        <MetricCard title="Operating Costs" value={`$${data.totalCost.toLocaleString()}`} sub="Total COGS" isPositive={false} delay={0.3} />
        <MetricCard title="Net Profit" value={`$${data.netProfit.toLocaleString()}`} sub="Estimated margin" isPositive={data.netProfit > 0} delay={0.4} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
        <div style={{ background: 'white', borderRadius: 32, border: '1px solid rgba(0,0,0,0.05)', padding: 40, height: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <BarChart3 size={64} style={{ color: '#0a84ff', marginBottom: 24, opacity: 0.2 }} />
          <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Revenue Trend Analysis</h3>
          <p style={{ color: '#64748b', maxWidth: 400, fontWeight: 600 }}>Aggregate data for the last 30 days has been synced. Individual daily trends will populate as you process more sales.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{ background: 'white', borderRadius: 32, border: '1px solid rgba(0,0,0,0.05)', padding: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 24 }}>Payment Methods</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { name: 'Cash', count: data.paymentMethods.cash, color: '#10b981' },
                { name: 'Credit Card', count: data.paymentMethods.card, color: '#0a84ff' },
                { name: 'Split Payments', count: data.paymentMethods.split, color: '#f59e0b' }
              ].map(m => {
                const percentage = data.paymentMethods.total > 0 ? ((m.count / data.paymentMethods.total) * 100).toFixed(0) : 0;
                return (
                  <div key={m.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, fontWeight: 700 }}>
                      <span style={{ color: '#64748b' }}>{m.name}</span>
                      <span style={{ color: '#0f172a' }}>{percentage}%</span>
                    </div>
                    <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${percentage}%`, height: '100%', background: m.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #0a84ff, #0055ff)', borderRadius: 32, padding: 32, color: 'white' }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Projected Revenue</h3>
            <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 12 }}>${data.projectedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <p style={{ opacity: 0.8, fontSize: 14, fontWeight: 600 }}>Estimated quarterly earnings based on current growth velocity.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Revenue;
