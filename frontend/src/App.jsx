import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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
import Pharmacy from './pages/Pharmacy';
import Suppliers from './pages/Suppliers';
import EODReport from './pages/EODReport';
import Expenses from './pages/Expenses';
import Login from './pages/Login';
import Landing from './pages/Landing';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import { getDefaultRoute } from './utils/routing';
import NotificationCenter from './components/NotificationCenter';

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

  if (!token) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen relative text-gray-900 font-sans overflow-hidden">
      <div className="orb-container">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>
      
      <Sidebar onLogout={logout} user={user} />
      <NotificationCenter user={user} />
      <div className="flex-1 flex flex-col relative z-0" style={{ marginLeft: 260 + 32, width: 'calc(100% - 292px)' }}>
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PrivateRoute roles={['admin']}><PageTransition><Dashboard user={user} /></PageTransition></PrivateRoute>} />
              <Route path="/manager" element={<PrivateRoute roles={['admin', 'manager']}><PageTransition><Manager /></PageTransition></PrivateRoute>} />
              <Route path="/inventory" element={<PrivateRoute roles={['admin', 'inventory', 'manager']}><PageTransition><Inventory user={user} /></PageTransition></PrivateRoute>} />
              <Route path="/sales" element={<PrivateRoute roles={['admin', 'cashier', 'manager']}><PageTransition><Sales /></PageTransition></PrivateRoute>} />
              <Route path="/sales/history" element={<PrivateRoute roles={['admin', 'cashier', 'manager']}><PageTransition><SalesHistory /></PageTransition></PrivateRoute>} />
              <Route path="/revenue" element={<PrivateRoute roles={['admin', 'manager']}><PageTransition><Revenue /></PageTransition></PrivateRoute>} />
              <Route path="/hr" element={<PrivateRoute roles={['admin', 'hr']}><PageTransition><HR /></PageTransition></PrivateRoute>} />
              <Route path="/employees" element={<PrivateRoute roles={['admin', 'hr', 'manager']}><PageTransition><Employees /></PageTransition></PrivateRoute>} />
              <Route path="/attendance" element={<PrivateRoute roles={['admin', 'manager', 'cashier', 'hr', 'inventory']}><PageTransition><Attendance /></PageTransition></PrivateRoute>} />
              <Route path="/shift-audit" element={<PrivateRoute roles={['admin', 'hr']}><PageTransition><ShiftAudit /></PageTransition></PrivateRoute>} />
              <Route path="/leaves" element={<PrivateRoute roles={['admin', 'manager', 'cashier', 'hr', 'inventory']}><PageTransition><Leaves /></PageTransition></PrivateRoute>} />
              <Route path="/payroll" element={<PrivateRoute roles={['admin', 'hr']}><PageTransition><Payroll /></PageTransition></PrivateRoute>} />
              <Route path="/pharmacy" element={<PrivateRoute roles={['admin', 'pharmacist', 'manager']}><PageTransition><Pharmacy /></PageTransition></PrivateRoute>} />
              <Route path="/suppliers" element={<PrivateRoute roles={['admin', 'inventory', 'manager']}><PageTransition><Suppliers /></PageTransition></PrivateRoute>} />
              <Route path="/customers" element={<PrivateRoute><PageTransition><Customers /></PageTransition></PrivateRoute>} />
              <Route path="/expenses" element={<PrivateRoute roles={['admin', 'manager', 'expenses']}><PageTransition><Expenses /></PageTransition></PrivateRoute>} />
              <Route path="/users" element={<PrivateRoute roles={['admin']}><PageTransition><Users /></PageTransition></PrivateRoute>} />
              <Route path="/eod" element={<PrivateRoute><PageTransition><EODReport /></PageTransition></PrivateRoute>} />
              <Route path="*" element={<Navigate to={getDefaultRoute(user?.role)} />} />
            </Routes>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
