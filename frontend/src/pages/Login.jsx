import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getDefaultRoute } from '../utils/routing';
import { Mail, Lock, Zap, AlertCircle, ArrowLeft, Eye, EyeOff, Shield, BarChart3, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const portals = [
  { role: 'Admin', icon: <Shield size={16} />, color: '#6366f1', path: 'Full system access' },
  { role: 'HR', icon: <Users size={16} />, color: '#a855f7', path: 'HR & Payroll center' },
  { role: 'Sales', icon: <BarChart3 size={16} />, color: '#10b981', path: 'Sales terminal' },
];

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [companyName, setCompanyName] = useState('GlobalAI ERP');
  const [showForgotPass, setShowForgotPass] = useState(false);

  React.useEffect(() => {
    import('../api').then(module => {
      module.settingsAPI.get().then(res => {
        if (res.data?.companyName) setCompanyName(res.data.companyName);
      }).catch(() => {});
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      const role = data.user?.role || 'cashier';
      navigate(getDefaultRoute(role), { replace: true });
    } catch (e) {
      setError(e.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', fontFamily: "'Outfit', sans-serif" }}>

      {/* Left Panel — Branding */}
      <div style={{ background: '#0a0f1e', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '60px', position: 'relative', overflow: 'hidden' }}>
        {/* ambient glow */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(10,132,255,0.18) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #0a84ff, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={22} fill="white" color="white" />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>{companyName}</div>
              <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>ERP v2.0</div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 100, background: 'rgba(10,132,255,0.12)', color: '#0a84ff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 24, border: '1px solid rgba(10,132,255,0.2)' }}>
            Secure Employee Portal
          </div>
          <h1 style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.04em', color: 'white', marginBottom: 20 }}>
            Your department.<br /><span style={{ background: 'linear-gradient(135deg, #0a84ff, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Your portal.</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: 17, lineHeight: 1.6, fontWeight: 500, maxWidth: 400 }}>
            Each employee logs in once and is automatically routed to their department's workspace — no confusion, no wrong access.
          </p>

          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {portals.map((p, i) => (
              <motion.div key={p.role} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: `${p.color}18`, color: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: 'white', fontSize: 14 }}>{p.role} Portal</div>
                  <div style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>{p.path}</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 11, color: '#10b981', fontWeight: 800, background: 'rgba(16,185,129,0.1)', padding: '3px 10px', borderRadius: 100 }}>Active</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>
          © 2026 {companyName}
        </motion.div>
      </div>

      {/* Right Panel — Form */}
      <div style={{ background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 80px', position: 'relative' }}>
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ x: -4 }}
          onClick={() => navigate('/')}
          style={{ position: 'absolute', top: 40, left: 40, display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#94a3b8', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
          <ArrowLeft size={16} /> Back
        </motion.button>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 8 }}>Welcome back</h2>
            <p style={{ color: '#94a3b8', fontSize: 15, fontWeight: 500 }}>Sign in to access your department portal</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 14, background: '#fef2f2', border: '1px solid #fecaca', marginBottom: 20 }}>
                <AlertCircle size={16} color="#ef4444" />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#dc2626' }}>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={17} style={{ position: 'absolute', left: 16, top: 16, color: '#94a3b8' }} />
                <input type="email" placeholder="your@email.com" required
                  style={{ width: '100%', padding: '14px 14px 14px 46px', borderRadius: 14, border: '1.5px solid #e2e8f0', outline: 'none', fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 600, color: '#0f172a', background: 'white', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#0a84ff'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={17} style={{ position: 'absolute', left: 16, top: 16, color: '#94a3b8' }} />
                <input type={showPass ? 'text' : 'password'} placeholder="••••••••" required
                  style={{ width: '100%', padding: '14px 46px 14px 46px', borderRadius: 14, border: '1.5px solid #e2e8f0', outline: 'none', fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 600, color: '#0f172a', background: 'white', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#0a84ff'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: 14, top: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" onClick={() => setShowForgotPass(true)} style={{ background: 'none', border: 'none', color: '#0a84ff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Forgot Password?
              </button>
            </div>

            <motion.button type="submit" disabled={loading}
              whileHover={!loading ? { scale: 1.02, boxShadow: '0 16px 40px rgba(10,132,255,0.3)' } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              style={{ padding: '16px', borderRadius: 14, background: loading ? '#93c5fd' : 'linear-gradient(135deg, #0a84ff, #6366f1)', color: 'white', fontWeight: 800, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 16, fontFamily: "'Outfit', sans-serif", marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              {loading ? (
                <><span style={{ width: 18, height: 18, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Signing in...</>
              ) : 'Sign In to Portal →'}
            </motion.button>
          </form>
        </motion.div>
      </div>

      <AnimatePresence>
        {showForgotPass && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForgotPass(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }} style={{ background: 'white', borderRadius: 24, width: '100%', maxWidth: 400, position: 'relative', padding: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', color: '#0a84ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Lock size={20} /></div>
                <h2 style={{ fontSize: 20, fontWeight: 900 }}>Reset Password</h2>
              </div>
              <p style={{ color: '#64748b', fontSize: 14, fontWeight: 500, lineHeight: 1.5, marginBottom: 24 }}>
                For security reasons, password resets must be authorized by your System Administrator. 
                Please contact them to receive a new temporary password.
              </p>
              <button onClick={() => setShowForgotPass(false)} style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#0a84ff', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                Understood
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Login;
