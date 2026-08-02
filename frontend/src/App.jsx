import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Desktop layout components
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import SalesHistory from './pages/SalesHistory';
import HR from './pages/HR';
import Employees from './pages/Employees';
import Customers from './pages/Customers';
import Manager from './pages/Manager';
import Revenue from './pages/Revenue';
import Users from './pages/Users';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Payroll from './pages/Payroll';
import ShiftAudit from './pages/ShiftAudit';
import SalaryAdvance from './pages/SalaryAdvance';
import Accounting from './pages/Accounting';
import Suppliers from './pages/Suppliers';
import EODReport from './pages/EODReport';
import Expenses from './pages/Expenses';
import Delivery from './pages/Delivery';

// Mobile PWA layout components
import MobileLayout from './components/MobileLayout';
import MobileHome from './pages/MobileHome';
import MobileRoute from './pages/MobileRoute';
import MobileOrder from './pages/MobileOrder';
import MobileProfile from './pages/MobileProfile';

// Auth and Public
import Login from './pages/Login';
import Landing from './pages/Landing';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import { getDefaultRoute } from './utils/routing';
import NotificationCenter from './components/NotificationCenter';
import GlobalAIAssistant from './components/GlobalAIAssistant';

import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Menu, Moon, Sun } from 'lucide-react';

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -15 }}
    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

function AppContent() {
  const { token, user, logout } = useAuth();
  const location = useLocation();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on route change on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  if (!token) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  // If the user is a field worker, give them the PWA mobile experience natively.
  const isMobileRole = user?.role === 'sales_rep' || user?.role === 'driver';

  if (isMobileRole) {
    return (
      <Routes>
        <Route path="/mobile" element={<PrivateRoute roles={['sales_rep', 'driver']}><MobileLayout /></PrivateRoute>}>
          <Route path="home" element={<MobileHome />} />
          <Route path="route" element={<MobileRoute />} />
          <Route path="order" element={<MobileOrder />} />
          <Route path="profile" element={<MobileProfile />} />
        </Route>
        <Route path="*" element={<Navigate to="/mobile/home" />} />
      </Routes>
    );
  }

  // Otherwise, Desktop ERP Experience
  return (
    <div className="flex min-h-screen relative font-sans overflow-hidden" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <div className="orb-container">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>
      
      <Sidebar onLogout={logout} user={user} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col relative z-0 transition-all duration-300 w-full lg:ml-[292px]`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 20px 0 20px', zIndex: 50 }}>
          <button 
            className="lg:hidden p-2 rounded-xl" 
            style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: 'auto' }}>
            <button 
              onClick={toggleDarkMode}
              style={{ width: 48, height: 48, borderRadius: 16, background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
            </button>
            <NotificationCenter user={user} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto relative p-4 lg:p-8">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PrivateRoute roles={['admin', 'superadmin', 'owner', 'company_admin']}><PageTransition><Dashboard user={user} /></PageTransition></PrivateRoute>} />
              <Route path="/manager" element={<PrivateRoute roles={['admin', 'manager']}><PageTransition><Manager /></PageTransition></PrivateRoute>} />
              <Route path="/inventory" element={<PrivateRoute roles={['admin', 'inventory', 'manager']}><PageTransition><Inventory user={user} /></PageTransition></PrivateRoute>} />
              <Route path="/sales" element={<PrivateRoute roles={['admin', 'cashier', 'manager']}><PageTransition><Sales /></PageTransition></PrivateRoute>} />
              <Route path="/sales/history" element={<PrivateRoute roles={['admin', 'cashier', 'manager']}><PageTransition><SalesHistory /></PageTransition></PrivateRoute>} />
              <Route path="/revenue" element={<PrivateRoute roles={['admin', 'manager', 'finance']}><PageTransition><Revenue /></PageTransition></PrivateRoute>} />
              <Route path="/hr" element={<PrivateRoute roles={['admin', 'hr']}><PageTransition><HR /></PageTransition></PrivateRoute>} />
              <Route path="/employees" element={<PrivateRoute roles={['admin', 'hr', 'manager']}><PageTransition><Employees /></PageTransition></PrivateRoute>} />
              <Route path="/attendance" element={<PrivateRoute roles={['admin', 'manager', 'cashier', 'hr', 'inventory', 'finance', 'staff', 'operations', 'pharmacist', 'expenses']}><PageTransition><Attendance /></PageTransition></PrivateRoute>} />
              <Route path="/shift-audit" element={<PrivateRoute roles={['admin', 'hr']}><PageTransition><ShiftAudit /></PageTransition></PrivateRoute>} />
              <Route path="/leaves" element={<PrivateRoute roles={['admin', 'manager', 'cashier', 'hr', 'inventory', 'finance', 'staff', 'operations', 'pharmacist', 'expenses']}><PageTransition><Leaves /></PageTransition></PrivateRoute>} />
              <Route path="/payroll" element={<PrivateRoute roles={['admin', 'hr']}><PageTransition><Payroll /></PageTransition></PrivateRoute>} />

              <Route path="/suppliers" element={<PrivateRoute roles={['admin', 'inventory', 'manager']}><PageTransition><Suppliers /></PageTransition></PrivateRoute>} />
              <Route path="/customers" element={<PrivateRoute><PageTransition><Customers /></PageTransition></PrivateRoute>} />
              <Route path="/expenses" element={<PrivateRoute roles={['admin', 'manager', 'expenses', 'finance']}><PageTransition><Expenses /></PageTransition></PrivateRoute>} />
              <Route path="/users" element={<PrivateRoute roles={['admin', 'manager']}><PageTransition><Users /></PageTransition></PrivateRoute>} />
              <Route path="/eod" element={<PrivateRoute roles={['admin', 'manager', 'cashier', 'operations']}><PageTransition><EODReport /></PageTransition></PrivateRoute>} />
              <Route path="/delivery" element={<PrivateRoute roles={['admin', 'manager', 'operations']}><PageTransition><Delivery /></PageTransition></PrivateRoute>} />
              <Route path="/accounting" element={<PrivateRoute roles={['admin', 'finance', 'manager']}><PageTransition><Accounting /></PageTransition></PrivateRoute>} />
              <Route path="/salary-advance" element={<PrivateRoute roles={['admin', 'hr', 'manager', 'cashier', 'inventory', 'finance', 'staff', 'operations', 'pharmacist', 'expenses']}><PageTransition><SalaryAdvance /></PageTransition></PrivateRoute>} />
              
              <Route path="*" element={<Navigate to={getDefaultRoute(user?.role)} />} />
            </Routes>
          </AnimatePresence>
        </div>
      </div>
      <GlobalAIAssistant />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
