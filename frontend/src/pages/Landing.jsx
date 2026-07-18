import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Shield, TrendingUp, BarChart3, ChevronRight, Globe, Lock, Cpu,
  Package, ShoppingCart, Users, DollarSign, Activity, CheckCircle,
  ArrowRight, Star, Menu, X
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('features');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenu(false);
  };

  const navLinks = [
    { label: 'Features', id: 'features' },
    { label: 'Solutions', id: 'solutions' },
    { label: 'Pricing', id: 'pricing' },
    { label: 'Docs', id: 'docs' },
  ];

  const features = [
    { icon: <BarChart3 />, title: 'Revenue Intelligence', desc: 'Predictive analytics with real-time margin tracking and profit visualization across all channels.', color: '#0a84ff' },
    { icon: <Shield />, title: 'Role-Based Access', desc: 'GlobalAI ERP-grade permission management. Every employee sees only what their department needs.', color: '#6366f1' },
    { icon: <Globe />, title: 'Omnichannel Ops', desc: 'Seamlessly sync physical stores, pharmacies, and warehouses from a single command center.', color: '#10b981' },
    { icon: <Lock />, title: 'Data Integrity', desc: 'End-to-end encrypted transactions with immutable audit logs for full regulatory compliance.', color: '#f59e0b' },
    { icon: <Package />, title: 'Smart Inventory', desc: 'Automated low-stock alerts, category filtering, and one-click CSV export for all your products.', color: '#ec4899' },
    { icon: <Users />, title: 'HR & Payroll', desc: 'Full employee lifecycle management with automated leave deductions and one-click payroll runs.', color: '#a855f7' },
  ];

  const solutions = [
    { title: 'Department Stores', icon: <ShoppingCart size={32} />, desc: 'Full POS, inventory, customer management, and revenue analytics tailored for retail operations.', color: '#0a84ff' },
    { title: 'Pharmacies', icon: <Activity size={32} />, desc: 'Drug inventory, prescription management, and expiry alerts purpose-built for healthcare retail.', color: '#10b981' },
    { title: 'HR Departments', icon: <Users size={32} />, desc: 'Onboard employees, manage shifts, process payroll, and handle leave requests in one portal.', color: '#a855f7' },
    { title: 'Finance Teams', icon: <DollarSign size={32} />, desc: 'Track expenses, run payroll, audit transactions, and generate end-of-day reconciliation reports.', color: '#f59e0b' },
  ];

  const plans = [
    { name: 'Starter', price: '$0', desc: 'Perfect for small teams', features: ['Up to 5 users', 'Core POS & Inventory', 'Basic Reports', 'Email Support'], popular: false, color: '#64748b' },
    { name: 'Professional', price: '$49', desc: 'For growing businesses', features: ['Unlimited users', 'All 9 Portals', 'HR & Payroll Engine', 'Advanced Analytics', 'Priority Support'], popular: true, color: '#0a84ff' },
    { name: 'GlobalAI ERP', price: 'Custom', desc: 'For large organizations', features: ['Custom deployment', 'Dedicated infra', 'SLA Guarantee', 'Onboarding team', 'API Access'], popular: false, color: '#6366f1' },
  ];

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } } };
  const itemVariants = { hidden: { y: 30, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', color: 'white', fontFamily: "'Outfit', sans-serif", overflowX: 'hidden' }}>
      
      {/* Ambient BG */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '5%', right: '-10%', width: 700, height: 700, background: 'radial-gradient(circle, rgba(10,132,255,0.12) 0%, transparent 70%)', filter: 'blur(100px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '-10%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', filter: 'blur(100px)' }} />
        <div style={{ position: 'absolute', top: '50%', left: '40%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      {/* Navbar */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          padding: '20px 80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: scrolled ? 'rgba(10,15,30,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
          transition: 'all 0.4s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.4 }} style={{ width: 42, height: 42, borderRadius: 13, background: 'linear-gradient(135deg, #0a84ff, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={22} fill="white" color="white" />
          </motion.div>
          <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em' }}>GlobalAI<span style={{ color: '#0a84ff' }}>ERP</span></span>
        </div>

        <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
          {navLinks.map(link => (
            <motion.span key={link.label} onClick={() => scrollTo(link.id)} whileHover={{ color: '#0a84ff' }}
              style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', cursor: 'pointer', transition: 'color 0.2s' }}>
              {link.label}
            </motion.span>
          ))}
          <motion.button whileHover={{ scale: 1.05, background: '#0070d9' }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/login')}
            style={{ padding: '11px 24px', borderRadius: 100, background: '#0a84ff', border: 'none', color: 'white', fontWeight: 800, cursor: 'pointer', fontSize: 14, fontFamily: "'Outfit', sans-serif" }}>
            Sign In →
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero */}
      <motion.section
        variants={containerVariants} initial="hidden" animate="visible"
        style={{ padding: '200px 80px 120px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', position: 'relative', zIndex: 1 }}
      >
        <div>
          <motion.div variants={itemVariants} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 100, background: 'rgba(10,132,255,0.1)', color: '#0a84ff', fontSize: 11, fontWeight: 800, marginBottom: 28, border: '1px solid rgba(10,132,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <Cpu size={13} /> GlobalAI ERP Resource Planning v2.0
          </motion.div>
          <motion.h1 variants={itemVariants} style={{ fontSize: 76, fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.04em', marginBottom: 28 }}>
            The OS for<br /><span style={{ background: 'linear-gradient(135deg, #0a84ff, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Modern Commerce.</span>
          </motion.h1>
          <motion.p variants={itemVariants} style={{ fontSize: 20, color: '#64748b', lineHeight: 1.7, maxWidth: 520, marginBottom: 48, fontWeight: 500 }}>
            An all-in-one ecosystem for department stores and pharmacies. Manage inventory, process sales, automate payroll — with millisecond precision.
          </motion.p>
          <motion.div variants={itemVariants} style={{ display: 'flex', gap: 16 }}>
            <motion.button whileHover={{ scale: 1.04, boxShadow: '0 24px 50px rgba(10,132,255,0.4)' }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/login')}
              style={{ padding: '18px 40px', borderRadius: 100, background: 'linear-gradient(135deg, #0a84ff, #6366f1)', color: 'white', fontWeight: 800, fontSize: 17, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 16px 40px rgba(10,132,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>
              Launch GlobalAI ERP <ChevronRight size={20} />
            </motion.button>
            <motion.button whileHover={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
              onClick={() => scrollTo('solutions')}
              style={{ padding: '18px 40px', borderRadius: 100, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8', fontWeight: 800, fontSize: 17, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s' }}>
              See Solutions
            </motion.button>
          </motion.div>
          <motion.div variants={itemVariants} style={{ display: 'flex', gap: 32, marginTop: 48 }}>
            {[['9', 'Portals'], ['100%', 'Role-Based'], ['Real-time', 'Analytics']].map(([val, label]) => (
              <div key={label}>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'white' }}>{val}</div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Dashboard Preview */}
        <motion.div variants={itemVariants} style={{ position: 'relative' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 32, border: '1px solid rgba(255,255,255,0.08)', padding: 32, backdropFilter: 'blur(20px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Live Dashboard</div>
              <div style={{ display: 'flex', gap: 6 }}>{['#ef4444','#f59e0b','#10b981'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {[['Total Revenue', '$124,500', '+12.4%', '#10b981'], ['Active Staff', '48', '+3', '#0a84ff'], ['Today Sales', '284', '+8.2%', '#a855f7'], ['Low Stock', '7', '-2', '#f59e0b']].map(([t, v, c, color]) => (
                <div key={t} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 18, padding: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>{t}</div>
                  <div style={{ fontSize: 24, fontWeight: 900 }}>{v}</div>
                  <div style={{ fontSize: 11, color: color, fontWeight: 700, marginTop: 4 }}>{c} this week</div>
                </div>
              ))}
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginBottom: 8 }}>
              <motion.div initial={{ width: 0 }} animate={{ width: '72%' }} transition={{ delay: 1.2, duration: 1.5, ease: 'easeOut' }}
                style={{ height: '100%', background: 'linear-gradient(90deg, #0a84ff, #6366f1)', borderRadius: 2 }} />
            </div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Monthly target: 72% achieved</div>
          </div>
        </motion.div>
      </motion.section>

      {/* Features */}
      <section id="features" style={{ padding: '120px 80px', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} style={{ textAlign: 'center', marginBottom: 80 }}>
          <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 100, background: 'rgba(10,132,255,0.1)', color: '#0a84ff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20, border: '1px solid rgba(10,132,255,0.2)' }}>Core Features</div>
          <h2 style={{ fontSize: 56, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 16 }}>Everything you need,<br /><span style={{ color: '#64748b' }}>nothing you don't.</span></h2>
          <p style={{ color: '#64748b', fontSize: 18, maxWidth: 500, margin: '0 auto', fontWeight: 500 }}>Streamlined modules that talk to each other, so your team can focus on what matters.</p>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -8, borderColor: `${f.color}40` }}
              style={{ background: 'rgba(255,255,255,0.02)', padding: 36, borderRadius: 28, border: '1px solid rgba(255,255,255,0.07)', cursor: 'default', transition: 'all 0.3s' }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: `${f.color}18`, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                {React.cloneElement(f.icon, { size: 24 })}
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>{f.title}</h3>
              <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6, fontWeight: 500 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Solutions */}
      <section id="solutions" style={{ padding: '120px 80px', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} style={{ textAlign: 'center', marginBottom: 80 }}>
          <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 100, background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20, border: '1px solid rgba(16,185,129,0.2)' }}>Solutions</div>
          <h2 style={{ fontSize: 56, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 16 }}>Built for your<br /><span style={{ color: '#64748b' }}>industry.</span></h2>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
          {solutions.map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
              style={{ background: 'rgba(255,255,255,0.02)', padding: 48, borderRadius: 32, border: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 28, alignItems: 'flex-start', transition: 'all 0.3s', cursor: 'default' }}>
              <div style={{ width: 68, height: 68, borderRadius: 20, background: `${s.color}18`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.6, fontWeight: 500 }}>{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: '120px 80px', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} style={{ textAlign: 'center', marginBottom: 80 }}>
          <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 100, background: 'rgba(168,85,247,0.1)', color: '#a855f7', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20, border: '1px solid rgba(168,85,247,0.2)' }}>Pricing</div>
          <h2 style={{ fontSize: 56, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 16 }}>Simple,<br /><span style={{ color: '#64748b' }}>transparent pricing.</span></h2>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, maxWidth: 1100, margin: '0 auto' }}>
          {plans.map((plan, i) => (
            <motion.div key={plan.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
              style={{ background: plan.popular ? `linear-gradient(135deg, rgba(10,132,255,0.15), rgba(99,102,241,0.15))` : 'rgba(255,255,255,0.02)', padding: 40, borderRadius: 32, border: plan.popular ? '2px solid rgba(10,132,255,0.4)' : '1px solid rgba(255,255,255,0.07)', position: 'relative' }}>
              {plan.popular && <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#0a84ff', padding: '4px 16px', borderRadius: 100, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Most Popular</div>}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>{plan.name}</div>
                <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.03em' }}>{plan.price}<span style={{ fontSize: 16, color: '#64748b', fontWeight: 600 }}>{plan.price !== 'Custom' ? '/mo' : ''}</span></div>
                <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>{plan.desc}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CheckCircle size={16} color="#10b981" />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#cbd5e1' }}>{f}</span>
                  </div>
                ))}
              </div>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/login')}
                style={{ width: '100%', padding: '14px', borderRadius: 16, background: plan.popular ? '#0a84ff' : 'rgba(255,255,255,0.05)', border: plan.popular ? 'none' : '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 800, cursor: 'pointer', fontSize: 15, fontFamily: "'Outfit', sans-serif" }}>
                {plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Docs */}
      <section id="docs" style={{ padding: '120px 80px', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          style={{ background: 'linear-gradient(135deg, rgba(10,132,255,0.1), rgba(99,102,241,0.1))', borderRadius: 40, padding: '80px', border: '1px solid rgba(10,132,255,0.2)', textAlign: 'center' }}>
          <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 20 }}>Ready to deploy<br /><span style={{ background: 'linear-gradient(135deg, #0a84ff, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>your GlobalAI ERP?</span></div>
          <p style={{ color: '#64748b', fontSize: 18, marginBottom: 40, fontWeight: 500 }}>One login. All portals. Every department connected.</p>
          <motion.button whileHover={{ scale: 1.05, boxShadow: '0 24px 60px rgba(10,132,255,0.4)' }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/login')}
            style={{ padding: '20px 48px', borderRadius: 100, background: 'linear-gradient(135deg, #0a84ff, #6366f1)', color: 'white', fontWeight: 800, fontSize: 18, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: "'Outfit', sans-serif" }}>
            Launch Your ERP <ArrowRight size={22} />
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 80px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #0a84ff, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={16} fill="white" color="white" />
          </div>
          <span style={{ fontWeight: 900, fontSize: 16 }}>GlobalAIERP</span>
        </div>
        <div style={{ color: '#475569', fontSize: 13, fontWeight: 600 }}>© 2026 GlobalAIERP. GlobalAI ERP Edition.</div>
        <div style={{ display: 'flex', gap: 24 }}>
          {navLinks.map(l => (
            <span key={l.label} onClick={() => scrollTo(l.id)} style={{ color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{l.label}</span>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default Landing;
