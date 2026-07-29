import React, { useState, useEffect } from 'react';
import { 
  Package, ShoppingCart, Users, DollarSign, TrendingUp, 
  AlertTriangle, Activity, Clock, Calendar, ArrowUpRight, 
  MapPin, Building2, Truck, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Responsive, WidthProvider } from 'react-grid-layout';
const ResponsiveGridLayout = WidthProvider(Responsive);
import { inventoryAPI, salesAPI, hrAPI, attendanceAPI, reportsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const StatCard = ({ title, value, icon, rgb, delay, onClick }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    onClick={onClick}
    style={{
      background: 'white',
      padding: '24px',
      borderRadius: '24px',
      border: '1px solid rgba(0,0,0,0.05)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      cursor: onClick ? 'pointer' : 'default',
      position: 'relative',
      overflow: 'hidden',
      height: '100%',
      width: '100%',
      boxSizing: 'border-box'
    }}
  >
    <div style={{
      width: '54px', height: '54px', borderRadius: '16px',
      background: `rgba(${rgb}, 0.1)`, color: `rgb(${rgb})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'transform 0.3s'
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>{value}</div>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, activeCompany } = useAuth();
  const { t, i18n } = useTranslation();
  const role = user?.role || 'admin';
  const isRTL = i18n.dir() === 'rtl';
  
  const [stats, setStats] = useState({});
  const [alerts, setAlerts] = useState({ lowStock: [], expiringSoon: [] });
  const [activeAttendance, setActiveAttendance] = useState(null);
  const [chartData, setChartData] = useState({ brands: [], areas: [], splits: [], collections: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesRes, prodRes, hrRes, attendanceRes, analyticsRes, topRes, collectionsRes, areasRes, repsRes] = await Promise.all([
          salesAPI.getTodayStats(),
          inventoryAPI.getProducts(),
          hrAPI.getStats(),
          attendanceAPI.getMyActive().catch(() => ({ data: null })),
          salesAPI.getAnalytics().catch(() => ({ data: {} })),
          reportsAPI.getTopProducts(5).catch(() => ({ data: [] })),
          reportsAPI.getCollections().catch(() => ({ data: { collected: 0, outstanding: 0, target: 1 } })),
          reportsAPI.getSalesByArea().catch(() => ({ data: [] })),
          reportsAPI.getSalesperson().catch(() => ({ data: [] }))
        ]);
        
        setStats({
          totalSales: salesRes.data.count || 0,
          revenue: salesRes.data.revenue || 0,
          totalRevenue: salesRes.data.totalRevenue || 0,
          netProfit: salesRes.data.netProfit || 0,
          totalProducts: prodRes.data.length || 0,
          totalEmployees: hrRes.data.totalEmployees || 0,
          activeEmployees: hrRes.data.activeEmployees || 0,
          receivables: collectionsRes.data.outstanding || 0, 
          payables: 8230.00, // Static for now, no payables API
          cashPosition: collectionsRes.data.collected || 0 
        });
        setActiveAttendance(attendanceRes.data);

        const pm = analyticsRes.data?.paymentMethods || { cash: 1, card: 1 };
        setChartData({
          splits: [
            { name: 'Cash', value: pm.cash },
            { name: 'Credit / Card', value: pm.card },
            { name: 'Split / Other', value: pm.split || 0 }
          ],
          brands: topRes.data?.map(p => ({ name: p.Product?.name || 'Unknown', revenue: parseFloat(p.totalRevenue) })) || [],
          areas: areasRes.data?.length ? areasRes.data : [{ name: 'No Data', sales: 0 }],
          collections: collectionsRes.data,
          reps: repsRes.data || []
        });

      } catch (err) {
        console.error('Dashboard data fetch failed', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [activeCompany]);

  const ownerLayouts = {
    lg: [
      { i: 'rev', x: 0, y: 0, w: 3, h: 2 },
      { i: 'profit', x: 3, y: 0, w: 3, h: 2 },
      { i: 'cash', x: 6, y: 0, w: 3, h: 2 },
      { i: 'emp', x: 9, y: 0, w: 3, h: 2 },
      { i: 'chart', x: 0, y: 2, w: 8, h: 4 },
      { i: 'summary', x: 8, y: 2, w: 4, h: 4 }
    ]
  };

  const OwnerDashboard = () => (
    <ResponsiveGridLayout 
      className="layout" 
      layouts={ownerLayouts} 
      breakpoints={{lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}} 
      cols={{lg: 12, md: 12, sm: 12, xs: 1, xxs: 1}}
      rowHeight={60}
      isDraggable={true}
      isResizable={true}
    >
      <div key="rev"><StatCard title={t('groupTotalRevenue')} value={`SAR ${stats.totalRevenue?.toLocaleString() || 0}`} icon={<Building2 />} rgb="59,130,246" delay={0.1} /></div>
      <div key="profit"><StatCard title={t('groupNetProfit')} value={`SAR ${stats.netProfit?.toLocaleString() || 0}`} icon={<Activity />} rgb="16,185,129" delay={0.2} /></div>
      <div key="cash"><StatCard title={t('cashPosition')} value={`SAR ${stats.cashPosition?.toLocaleString() || 0}`} icon={<DollarSign />} rgb="245,158,11" delay={0.3} /></div>
      <div key="emp"><StatCard title={t('totalEmployees')} value={stats.activeEmployees} icon={<Users />} rgb="139,92,246" delay={0.4} onClick={() => navigate('/employees')} /></div>
      
      <div key="chart" style={{ background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '24px' }}>{t('companyPerformance')}</h3>
        <div style={{ height: 'calc(100% - 60px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', paddingBottom: '16px' }}>
            <div style={{ width: '64px', background: '#3b82f6', borderRadius: '8px 8px 0 0', height: '80%', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '-24px', fontSize: '12px', fontWeight: 800, color: '#2563eb', left: '50%', transform: 'translateX(-50%)' }}>80%</span>
              <div style={{ position: 'absolute', bottom: '-24px', fontSize: '12px', fontWeight: 700, color: '#64748b', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>Auto Parts</div>
            </div>
            <div style={{ width: '64px', background: '#6366f1', borderRadius: '8px 8px 0 0', height: '60%', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '-24px', fontSize: '12px', fontWeight: 800, color: '#4f46e5', left: '50%', transform: 'translateX(-50%)' }}>60%</span>
              <div style={{ position: 'absolute', bottom: '-24px', fontSize: '12px', fontWeight: 700, color: '#64748b', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>Distribution</div>
            </div>
            <div style={{ width: '64px', background: '#10b981', borderRadius: '8px 8px 0 0', height: '90%', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '-24px', fontSize: '12px', fontWeight: 800, color: '#059669', left: '50%', transform: 'translateX(-50%)' }}>90%</span>
              <div style={{ position: 'absolute', bottom: '-24px', fontSize: '12px', fontWeight: 700, color: '#64748b', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>Contracting</div>
            </div>
            <div style={{ width: '64px', background: '#f59e0b', borderRadius: '8px 8px 0 0', height: '40%', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '-24px', fontSize: '12px', fontWeight: 800, color: '#d97706', left: '50%', transform: 'translateX(-50%)' }}>40%</span>
              <div style={{ position: 'absolute', bottom: '-24px', fontSize: '12px', fontWeight: 700, color: '#64748b', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>Labour Hire</div>
            </div>
        </div>
      </div>
      
      <div key="summary" style={{ background: 'linear-gradient(135deg, #0f172a, #312e81)', borderRadius: '24px', padding: '24px', color: 'white', boxShadow: '0 20px 40px rgba(15,23,42,0.2)', position: 'relative', overflow: 'hidden' }}>
        <SparklesBg />
        <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={18} /> {t('financialSummary')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{t('accountsReceivable')}</span>
            <span style={{ fontWeight: 800, color: '#34d399' }}>SAR {stats.receivables?.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{t('accountsPayable')}</span>
            <span style={{ fontWeight: 800, color: '#f87171' }}>SAR {stats.payables?.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px' }}>
            <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{t('groupInventoryValue')}</span>
            <span style={{ fontWeight: 800, color: '#60a5fa' }}>SAR 2,450,000</span>
          </div>
        </div>
      </div>
    </ResponsiveGridLayout>
  );

  const distLayouts = {
    lg: [
      { i: 'sales', x: 0, y: 0, w: 3, h: 2 },
      { i: 'deliveries', x: 3, y: 0, w: 3, h: 2 },
      { i: 'stock', x: 6, y: 0, w: 3, h: 2 },
      { i: 'profit', x: 9, y: 0, w: 3, h: 2 },
      { i: 'brands', x: 0, y: 2, w: 6, h: 5 },
      { i: 'areas', x: 6, y: 2, w: 6, h: 5 },
      { i: 'split', x: 0, y: 7, w: 4, h: 5 },
      { i: 'collections', x: 4, y: 7, w: 4, h: 5 },
      { i: 'reps', x: 8, y: 7, w: 4, h: 5 }
    ]
  };

  const DistributionDashboard = () => (
    <ResponsiveGridLayout 
      className="layout" 
      layouts={distLayouts} 
      breakpoints={{lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}} 
      cols={{lg: 12, md: 12, sm: 12, xs: 1, xxs: 1}}
      rowHeight={60}
      isDraggable={true}
      isResizable={true}
    >
      <div key="sales"><StatCard title={t('todaysSales')} value={`SAR ${stats.revenue?.toLocaleString() || 0}`} icon={<ShoppingCart />} rgb="59,130,246" delay={0.1} onClick={() => navigate('/sales/history')} /></div>
      <div key="deliveries"><StatCard title={t('pendingDeliveries')} value="12" icon={<Truck />} rgb="245,158,11" delay={0.2} onClick={() => navigate('/delivery')} /></div>
      <div key="stock"><StatCard title={t('zeroStockProducts')} value="3" icon={<AlertTriangle />} rgb="239,68,68" delay={0.3} onClick={() => navigate('/inventory?filter=zero')} /></div>
      <div key="profit"><StatCard title={t('grossProfitMTD')} value="SAR 45,230" icon={<TrendingUp />} rgb="16,185,129" delay={0.4} onClick={() => navigate('/revenue')} /></div>
      
      <div key="brands" style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '20px', margin: '0 0 20px 0' }}>Sales by Brand/Product</h3>
        <div style={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.brands} margin={{ left: -20, right: 10, bottom: 0, top: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <RechartsTooltip cursor={{ fill: 'rgba(59,130,246,0.1)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div key="areas" style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '20px', margin: '0 0 20px 0' }}>Sales by Area (Route)</h3>
        <div style={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.areas} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} width={80} axisLine={false} tickLine={false} />
              <RechartsTooltip cursor={{ fill: 'rgba(16,185,129,0.1)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="sales" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div key="split" style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '10px', margin: '0 0 10px 0' }}>Cash vs Credit</h3>
        <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData.splits} innerRadius="60%" outerRadius="80%" paddingAngle={5} dataKey="value" stroke="none">
                {chartData.splits.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', pointerEvents: 'none' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748b' }}>TOTAL</span>
            <span style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>{chartData.splits.reduce((a,b)=>a+b.value, 0)}</span>
          </div>
        </div>
      </div>

      <div key="collections" style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '24px', margin: '0 0 24px 0' }}>Customer Collections</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, justifyContent: 'center' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Collected</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#10b981' }}>SAR {chartData.collections?.collected?.toLocaleString()}</span>
            </div>
            <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${(chartData.collections?.collected / chartData.collections?.target) * 100}%`, height: '100%', background: '#10b981' }} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Outstanding</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#f59e0b' }}>SAR {chartData.collections?.outstanding?.toLocaleString()}</span>
            </div>
            <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${(chartData.collections?.outstanding / chartData.collections?.target) * 100}%`, height: '100%', background: '#f59e0b' }} />
            </div>
          </div>
        </div>
      </div>

      <div key="reps" style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflowY: 'auto', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '20px', margin: '0 0 20px 0' }}>{t('topSalesReps')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          {chartData.reps && chartData.reps.slice(0,5).map((rep, i) => (
            <div key={i} onClick={() => navigate('/employees')} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{i+1}</div>
                <span style={{ fontWeight: 800, color: '#334155', fontSize: '13px' }}>{rep.User?.name || 'Unknown User'}</span>
              </div>
              <span style={{ fontWeight: 800, color: '#059669', fontSize: '13px' }}>SAR {parseFloat(rep.revenueGenerated || 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </ResponsiveGridLayout>
  );

  // 3. Inventory Dashboard
  const InventoryDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <StatCard title="Total Inventory Value" value="SAR 1,250,400" icon={<Package />} rgb="59,130,246" delay={0.1} />
        <StatCard title="Low Stock Items" value={alerts.lowStock?.length || 15} icon={<AlertTriangle />} rgb="245,158,11" delay={0.2} onClick={() => navigate('/inventory')} />
        <StatCard title="Pending Transfers" value="4" icon={<Truck />} rgb="139,92,246" delay={0.3} />
      </div>
    </div>
  );

  // 4. Sales Rep / Cashier Dashboard
  const CashierDashboard = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
      <motion.div 
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
        style={{ background: 'linear-gradient(135deg, #2563eb, #4338ca)', borderRadius: '32px', padding: '40px', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(37,99,235,0.2)' }}
      >
        <div style={{ position: 'relative', zIndex: 10 }}>
          <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '12px' }}>Ready to sell?</h2>
          <p style={{ opacity: 0.8, marginBottom: '32px', maxWidth: '300px', lineHeight: '1.5' }}>Access the POS terminal to process transactions, manage customer orders, and log field visits.</p>
          <button 
            onClick={() => navigate('/sales')}
            style={{ background: 'white', color: '#2563eb', border: 'none', padding: '16px 24px', borderRadius: '16px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Open Terminal <ArrowUpRight size={18} />
          </button>
        </div>
        <ShoppingCart size={200} style={{ position: 'absolute', right: '-40px', bottom: '-40px', opacity: 0.1, transform: 'rotate(-12deg)' }} />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
        style={{ background: 'white', borderRadius: '32px', padding: '40px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
      >
        <div style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', marginBottom: '16px', letterSpacing: '1px', textTransform: 'uppercase' }}>GPS Attendance Status</div>
        {activeAttendance ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 12px rgba(16,185,129,0.5)' }} />
              <span style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>On Duty</span>
            </div>
            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 600, marginBottom: '24px' }}>
              Clocked in at {new Date(activeAttendance.clockIn).toLocaleTimeString()}
            </div>
            <button 
              onClick={async (e) => {
                e.currentTarget.disabled = true;
                try {
                  await attendanceAPI.clockOut();
                  const res = await attendanceAPI.getMyActive();
                  setActiveAttendance(res.data);
                } catch (err) { alert(err.response?.data?.message || 'Clock out failed'); }
                finally { e.currentTarget.disabled = false; }
              }}
              style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#fef2f2', color: '#ef4444', border: 'none', fontWeight: 800, cursor: 'pointer' }}
            >
              End Shift
            </button>
          </div>
        ) : (
          <button 
            onClick={async (e) => {
              const btn = e.currentTarget;
              btn.disabled = true;
              const clockInWithCoords = async (latitude, longitude) => {
                try {
                  await attendanceAPI.clockIn({ latitude, longitude });
                  const res = await attendanceAPI.getMyActive();
                  setActiveAttendance(res.data);
                } catch (err) { alert('Clock in failed'); }
                finally { btn.disabled = false; }
              };
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  pos => clockInWithCoords(pos.coords.latitude, pos.coords.longitude),
                  err => {
                    console.warn("GPS Error:", err.message);
                    clockInWithCoords(null, null);
                  },
                  { enableHighAccuracy: true, timeout: 5000 }
                );
              } else clockInWithCoords(null, null);
            }}
            style={{ width: '100%', padding: '20px', borderRadius: '16px', background: '#f8fafc', border: '2px dashed #cbd5e1', color: '#0f172a', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
          >
            <MapPin size={20} color="#3b82f6" /> Verify GPS & Clock In
          </button>
        )}
      </motion.div>
    </div>
  );

  const SparklesBg = () => (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', opacity: 0.3 }}>
      {[...Array(10)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute', width: '4px', height: '4px', background: 'white', borderRadius: '50%',
          top: `${Math.random()*100}%`, left: `${Math.random()*100}%`,
          animation: `pulse ${Math.random()*2+1}s infinite`,
          animationDelay: `${Math.random()*2}s`,
          boxShadow: '0 0 8px 2px rgba(255,255,255,0.5)'
        }} />
      ))}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
          100% { opacity: 0.2; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );

  return (
    <div style={{ padding: '100px 40px 40px 40px', minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', sans-serif", position: 'relative', direction: isRTL ? 'rtl' : 'ltr' }}>
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0' }}>
            {t('welcome')}, <span style={{ color: '#2563eb' }}>{user?.name?.split(' ')[0] || 'User'}</span>
          </h1>
          <p style={{ color: '#64748b', fontWeight: 600, margin: 0 }}>
            {activeCompany ? `${t('viewingDataFor')} ${activeCompany.name}` : t('heresWhatHappening')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => window.location.reload()} style={{ padding: '12px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', cursor: 'pointer' }}>
            <Calendar size={18} /> {t('refreshData')}
          </button>
        </div>
      </header>

      {/* Render correct dashboard based on role */}
      {role === 'owner' && <OwnerDashboard />}
      {(role === 'manager' || role === 'admin') && <DistributionDashboard />}
      {role === 'inventory' && <InventoryDashboard />}
      {(role === 'cashier' || role === 'sales_rep') && <CashierDashboard />}
    </div>
  );
};

export default Dashboard;
