import React, { useState, useEffect } from 'react';
import { employeeAPI, leaveAPI } from '../api';
import { UserPlus, Search, Filter, Briefcase, Mail, Phone, Calendar, DollarSign, X, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const cardStyle = {
  background: 'white', borderRadius: 20, padding: 24,
  border: '1px solid rgba(0,0,0,0.06)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
};

const inputStyle = {
  width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0',
  borderRadius: 12, outline: 'none', fontFamily: "'Outfit', sans-serif",
  fontSize: 14, fontWeight: 600, color: '#0f172a', background: '#f8fafc',
};

const Employees = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showModal, setShowModal] = useState(location.state?.openAddModal || false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editingSalary, setEditingSalary] = useState(false);
  const [salaryForm, setSalaryForm] = useState({ salary: '', salaryType: 'monthly' });
  const [loading, setLoading] = useState(true);
  const [empLeaves, setEmpLeaves] = useState([]);
  const [empLeaveBalance, setEmpLeaveBalance] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [step, setStep] = useState(1);
  const [phoneCode, setPhoneCode] = useState('+92');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', cnic: '', address: '',
    departmentId: '', designationId: '', joiningDate: '',
    salaryType: 'monthly', salary: '', bankAccount: '', role: '', gender: '', password: ''
  });
  const [resetPassModal, setResetPassModal] = useState({ open: false, employee: null, newPassword: '' });

  useEffect(() => {
    fetchData();
    // Clear history state so refreshing doesn't repeatedly open the modal
    if (location.state?.openAddModal) {
      window.history.replaceState({}, document.title);
    }
  }, []);

  useEffect(() => {
    if (selectedEmployee && (user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager')) {
      fetchEmpLeaves(selectedEmployee.id);
    }
  }, [selectedEmployee, user]);

  const fetchEmpLeaves = async (id) => {
    setLoadingLeaves(true);
    try {
      const [lRes, bRes] = await Promise.all([
        leaveAPI.getByEmployee(id),
        leaveAPI.getBalanceByEmployee(id)
      ]);
      setEmpLeaves(lRes.data || []);
      setEmpLeaveBalance(bRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLeaves(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, desigRes] = await Promise.all([
        employeeAPI.getAll(),
        employeeAPI.getDepartments(),
        employeeAPI.getDesignations()
      ]);
      setEmployees(empRes.data.employees);
      setDepartments(deptRes.data);
      setDesignations(desigRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCnicChange = (e) => {
    let val = e.target.value.replace(/[^0-9-]/g, '');
    const digits = val.replace(/-/g, '');
    let formatted = '';
    if (digits.length > 0) {
      formatted += digits.substring(0, 5);
    }
    if (digits.length > 5) {
      formatted += '-' + digits.substring(5, 12);
    }
    if (digits.length > 12) {
      formatted += '-' + digits.substring(12, 13);
    }
    setForm({ ...form, cnic: formatted });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.cnic || !form.address || !form.password) {
      alert("Please fill in all required basic info including Password.");
      setStep(1); return;
    }
    
    // Validate password for special character
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (!specialCharRegex.test(form.password)) {
      alert("Password must contain at least one special character.");
      setStep(1); return;
    }
    if (!form.departmentId || !form.designationId) {
      alert("Please select Department and Designation.");
      setStep(2); return;
    }
    try {
      // Store full phone number with country code
      const fullPhone = form.phone ? `${phoneCode} ${form.phone}` : '';
      await employeeAPI.create({ ...form, phone: fullPhone });
      setShowModal(false);
      setStep(1);
      setPhoneCode('+92');
      setForm({ firstName: '', lastName: '', email: '', phone: '', cnic: '', address: '', departmentId: '', designationId: '', joiningDate: '', salaryType: 'monthly', salary: '', bankAccount: '', role: '', gender: '', password: '' });
      fetchData();
    } catch (e) {
      alert(e.response?.data?.message || 'Error saving employee. Please check all fields.');
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const term = searchTerm.toLowerCase();
    const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
    const code = (emp.empCode || '').toLowerCase();
    const dept = (emp.Department?.name || '').toLowerCase();
    const matchesSearch = fullName.includes(term) || code.includes(term) || dept.includes(term);
    const matchesStatus = statusFilter ? emp.status === statusFilter : true;
    const matchesDept = deptFilter ? emp.departmentId === deptFilter : true;
    return matchesSearch && matchesStatus && matchesDept;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return { bg: '#f0fdf4', color: '#16a34a' };
      case 'on_leave': return { bg: '#fef3c7', color: '#d97706' };
      case 'inactive': return { bg: '#f1f5f9', color: '#64748b' };
      case 'resigned': return { bg: '#fee2e2', color: '#ef4444' };
      default: return { bg: '#f1f5f9', color: '#64748b' };
    }
  };

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleTerminate = async (id) => {
    if (window.confirm("Are you sure you want to terminate this employee? This action will safely archive their record.")) {
      try {
        await employeeAPI.delete(id);
        setSelectedEmployee(null);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || err.message || 'Failed to terminate employee');
      }
    }
  };

  const handleSaveSalary = async () => {
    try {
      await employeeAPI.update(selectedEmployee.id, {
        salary: salaryForm.salary,
        salaryType: salaryForm.salaryType,
        baseSalary: salaryForm.salary,
      });
      setSelectedEmployee(e => ({ ...e, salary: salaryForm.salary, salaryType: salaryForm.salaryType }));
      setEditingSalary(false);
      fetchData();
    } catch (err) {
      alert('Failed to update salary');
    }
  };

  const handleResetPassword = async () => {
    if (!resetPassModal.newPassword) {
      alert('Please enter a new password.');
      return;
    }
    try {
      await employeeAPI.resetPassword(resetPassModal.employee.id, resetPassModal.newPassword);
      alert('Password reset successfully.');
      setResetPassModal({ open: false, employee: null, newPassword: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <div style={{ padding: '36px 40px', minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a' }}>Employee Management</h1>
          <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>Manage your global workforce</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 12, background: '#0a84ff', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
          <UserPlus size={18} /> Add Employee
        </button>
      </header>

      {/* Dept Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
        {departments.filter(d => d.employeeCount > 0).map(dept => (
          <div key={dept.id} style={{ ...cardStyle, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(10,132,255,0.1)', color: '#0a84ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{dept.name}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{dept.employeeCount} Employees</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search employees..." style={{ ...inputStyle, paddingLeft: 40 }} />
          </div>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="inactive">Inactive</option>
            <option value="resigned">Terminated</option>
          </select>
          {selectedIds.size > 0 && (
            <button style={{ marginLeft: 'auto', padding: '12px 16px', borderRadius: 12, background: '#e2e8f0', border: 'none', fontWeight: 800, cursor: 'pointer' }}>
              Bulk Actions ({selectedIds.size}) ▾
            </button>
          )}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
              <th style={{ padding: 16, width: 40 }}><input type="checkbox" onChange={e => {
                if (e.target.checked) setSelectedIds(new Set(filteredEmployees.map(emp => emp.id)));
                else setSelectedIds(new Set());
              }} checked={filteredEmployees.length > 0 && selectedIds.size === filteredEmployees.length} /></th>
              <th style={{ padding: 16, textAlign: 'left', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Employee</th>
              <th style={{ padding: 16, textAlign: 'left', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Department</th>
              <th style={{ padding: 16, textAlign: 'left', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: 16, textAlign: 'right', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map(emp => {
              const statusStyle = getStatusColor(emp.status);
              return (
              <tr key={emp.id} style={{ borderBottom: '1px solid #f8fafc', background: selectedIds.has(emp.id) ? '#eff6ff' : 'transparent' }}>
                <td style={{ padding: 16 }}><input type="checkbox" checked={selectedIds.has(emp.id)} onChange={() => toggleSelect(emp.id)} /></td>
                <td style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{(emp.firstName || '')[0]}{(emp.lastName || '')[0]}</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{emp.firstName} {emp.lastName}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{emp.empCode}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: 16, fontSize: 13, fontWeight: 600 }}>{emp.Department?.name || '—'}</td>
                <td style={{ padding: 16 }}>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 900, background: statusStyle.bg, color: statusStyle.color }}>{emp.status}</span>
                </td>
                <td style={{ padding: 16, textAlign: 'right' }}>
                  <button onClick={() => setSelectedEmployee(emp)} style={{ background: 'none', border: 'none', color: '#0a84ff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>View Profile</button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }} style={{ background: 'white', borderRadius: 24, width: '100%', maxWidth: 500, position: 'relative', padding: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 900 }}>Add New Employee</h2>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1, 2, 3].map(i => <div key={i} style={{ width: 24, height: 4, borderRadius: 2, background: step >= i ? '#0a84ff' : '#e2e8f0' }} />)}
                </div><button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#94a3b8" /></button>
              </div>

              <form onSubmit={handleSave}>
                {step === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <input placeholder="First Name" style={inputStyle} value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                      <input placeholder="Last Name" style={inputStyle} value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
                    </div>
                    <input placeholder="Email Address *" style={inputStyle} value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select
                        value={phoneCode}
                        onChange={e => setPhoneCode(e.target.value)}
                        style={{ ...inputStyle, width: 110, flexShrink: 0, paddingRight: 4 }}
                      >
                        <option value="+92">🇵🇰 +92</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+971">🇦🇪 +971</option>
                        <option value="+966">🇸🇦 +966</option>
                        <option value="+974">🇶🇦 +974</option>
                        <option value="+968">🇴🇲 +968</option>
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+880">🇧🇩 +880</option>
                        <option value="+49">🇩🇪 +49</option>
                        <option value="+33">🇫🇷 +33</option>
                        <option value="+86">🇨🇳 +86</option>
                        <option value="+81">🇯🇵 +81</option>
                        <option value="+61">🇦🇺 +61</option>
                        <option value="+55">🇧🇷 +55</option>
                        <option value="+7">🇷🇺 +7</option>
                        <option value="+27">🇿🇦 +27</option>
                        <option value="+234">🇳🇬 +234</option>
                        <option value="+20">🇪🇬 +20</option>
                        <option value="+90">🇹🇷 +90</option>
                      </select>
                      <input
                        placeholder="Phone Number"
                        style={{ ...inputStyle, flex: 1 }}
                        value={form.phone}
                        onChange={e => setForm({...form, phone: e.target.value})}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <input placeholder="CNIC (e.g: 36309-1895678-8) *" style={inputStyle} value={form.cnic} onChange={handleCnicChange} maxLength={15} />
                      <select style={inputStyle} value={form.gender || ''} onChange={e => setForm({...form, gender: e.target.value})}>
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <input placeholder="Address (Based on ID Card) *" style={inputStyle} value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                    <input type="text" placeholder="Account Password (must contain special char) *" style={inputStyle} value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                    <button type="button" onClick={() => setStep(2)} style={{ padding: 14, borderRadius: 12, background: '#0a84ff', color: 'white', fontWeight: 800, border: 'none', marginTop: 12 }}>Continue</button>
                  </div>
                )}
                {step === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Select Department (determines portal access)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxHeight: 320, overflowY: 'auto' }}>
                      {departments.map(d => {
                        // Map department name to role & portal — uses keyword matching for flexibility
                        const getDeptInfo = (name) => {
                          const n = name.toLowerCase();
                          if (n.includes('admin')) return { portal: 'Admin Dashboard', role: 'admin', color: '#6366f1', isAdmin: true };
                          if (n.includes('management')) return { portal: 'Manager Hub', role: 'manager', color: '#0a84ff', isAdmin: false };
                          if (n.includes('inventory') || n.includes('warehouse') || n.includes('stock') || n.includes('procurement')) return { portal: 'Inventory & Procurement', role: 'inventory', color: '#f59e0b', isAdmin: false };
                          if (n.includes('sales') || n.includes('pos') || n.includes('cashier')) return { portal: 'Sales Terminal', role: 'cashier', color: '#10b981', isAdmin: false };
                          if (n.includes('hr') || n.includes('human') || n.includes('payroll')) return { portal: 'HR & Payroll', role: 'hr', color: '#a855f7', isAdmin: false };

                          if (n.includes('finance') || n.includes('revenue') || n.includes('accounting')) return { portal: 'Finance & Revenue', role: 'finance', color: '#0ea5e9', isAdmin: false };
                          if (n.includes('expense')) return { portal: 'Expenses Module', role: 'expenses', color: '#ef4444', isAdmin: false };
                          if (n.includes('eod') || n.includes('operation')) return { portal: 'Operations Hub', role: 'operations', color: '#64748b', isAdmin: false };
                          if (n.includes('engineer') || n.includes('civil') || n.includes('architect') || n.includes('design') || n.includes('technical')) return { portal: 'Manager Hub', role: 'manager', color: '#0a84ff', isAdmin: false };
                          return { portal: 'Staff Portal', role: 'staff', color: '#94a3b8', isAdmin: false };
                        };
                        const info = getDeptInfo(d.name);
                        // If current user is admin creating an admin employee, only show admin departments
                        // If creating a non-admin, hide admin departments to prevent role escalation
                        const currentlySelectedInfo = form.departmentId ? getDeptInfo(departments.find(dep => dep.id === form.departmentId)?.name || '') : null;
                        // Show all departments — let admin decide. Admin departments are visually marked.
                        const isSelected = form.departmentId === d.id;
                        return (
                          <div
                            key={d.id}
                            onClick={() => setForm({...form, departmentId: d.id, role: info.role})}
                            style={{
                              padding: '12px 14px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
                              border: isSelected ? `2px solid ${info.color}` : '2px solid #e2e8f0',
                              background: isSelected ? `${info.color}10` : 'white',
                            }}
                          >
                            <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                              {d.name}
                              {info.isAdmin && <span style={{ fontSize: 9, fontWeight: 900, background: '#6366f1', color: 'white', padding: '2px 5px', borderRadius: 4 }}>ADMIN</span>}
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: info.color, marginTop: 2 }}>→ {info.portal}</div>
                            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>Role: {info.role}</div>
                          </div>
                        );
                      })}
                    </div>
                    <select style={inputStyle} value={form.designationId} onChange={e => setForm({...form, designationId: e.target.value})}>
                      <option value="">Select Designation *</option>
                      {designations.filter(d => !d.departmentId || d.departmentId === form.departmentId).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <input type="date" style={inputStyle} value={form.joiningDate} onChange={e => setForm({...form, joiningDate: e.target.value})} />
                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                      <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: 14, borderRadius: 12, background: '#f1f5f9', color: '#64748b', fontWeight: 800, border: 'none', cursor: 'pointer' }}>← Back</button>
                      <button type="button" onClick={() => setStep(3)} disabled={!form.departmentId} style={{ flex: 2, padding: 14, borderRadius: 12, background: form.departmentId ? '#0a84ff' : '#e2e8f0', color: form.departmentId ? 'white' : '#94a3b8', fontWeight: 800, border: 'none', cursor: form.departmentId ? 'pointer' : 'not-allowed' }}>Continue →</button>
                    </div>
                  </div>
                )}
                {step === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <select style={inputStyle} value={form.salaryType} onChange={e => setForm({...form, salaryType: e.target.value})}>
                      <option value="monthly">Monthly Salary</option>
                      <option value="hourly">Hourly Rate</option>
                    </select>
                    <input type="number" placeholder="Amount" style={inputStyle} value={form.salary} onChange={e => setForm({...form, salary: e.target.value})} />
                    <input placeholder="Bank Account Number" style={inputStyle} value={form.bankAccount} onChange={e => setForm({...form, bankAccount: e.target.value})} />
                    <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                      <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: 14, borderRadius: 12, background: '#f1f5f9', color: '#64748b', fontWeight: 800, border: 'none', cursor: 'pointer' }}>Edit Basic Info</button>
<button type="button" onClick={() => setStep(2)} style={{ flex: 1, padding: 14, borderRadius: 12, background: '#f1f5f9', color: '#64748b', fontWeight: 800, border: 'none', cursor: 'pointer' }}>← Back</button>
<button type="submit" style={{ flex: 2, padding: 14, borderRadius: 12, background: '#10b981', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer' }}>✓ Complete & Add Employee</button>
                      
                    </div>
                  </div>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {selectedEmployee && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedEmployee(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }} style={{ background: 'white', borderRadius: 24, width: '100%', maxWidth: 500, position: 'relative', padding: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 900 }}>Employee Profile</h2>
                <button onClick={() => setSelectedEmployee(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#94a3b8" /></button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900 }}>
                  {(selectedEmployee.firstName || '')[0]}
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 900 }}>{selectedEmployee.firstName} {selectedEmployee.lastName}</h3>
                  <div style={{ color: '#64748b', fontWeight: 600 }}>{selectedEmployee.empCode}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Department</div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedEmployee.Department?.name || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Designation</div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedEmployee.Designation?.name || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Email</div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedEmployee.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Phone</div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedEmployee.phone || '—'}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Salary</div>
                    {!editingSalary ? (
                      <button onClick={() => { setEditingSalary(true); setSalaryForm({ salary: selectedEmployee.salary || 0, salaryType: selectedEmployee.salaryType || 'monthly' }); }}
                        style={{ fontSize: 11, fontWeight: 800, color: '#0a84ff', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={handleSaveSalary} style={{ fontSize: 11, fontWeight: 800, color: 'white', background: '#10b981', border: 'none', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>Save</button>
                        <button onClick={() => setEditingSalary(false)} style={{ fontSize: 11, fontWeight: 800, color: '#64748b', background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>Cancel</button>
                      </div>
                    )}
                  </div>
                  {editingSalary ? (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <input type="number" style={{ ...inputStyle, flex: 1 }} value={salaryForm.salary}
                        onChange={e => setSalaryForm(f => ({ ...f, salary: e.target.value }))} placeholder="Amount" />
                      <select style={{ ...inputStyle, width: 'auto' }} value={salaryForm.salaryType}
                        onChange={e => setSalaryForm(f => ({ ...f, salaryType: e.target.value }))}>
                        <option value="monthly">Monthly</option>
                        <option value="hourly">Hourly</option>
                      </select>
                    </div>
                  ) : (
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 4 }}>SAR {parseFloat(selectedEmployee.salary || 0).toLocaleString()} <span style={{ fontSize: 12, color: '#64748b', textTransform: 'capitalize' }}>({selectedEmployee.salaryType})</span></div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Status</div>
                  <div style={{ fontWeight: 600 }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 900, background: selectedEmployee.status === 'active' ? '#f0fdf4' : '#fef2f2', color: selectedEmployee.status === 'active' ? '#16a34a' : '#ef4444' }}>{selectedEmployee.status}</span>
                  </div>
                </div>
                
                {(user?.role === 'admin' || user?.role === 'hr') && (
                  <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
                    <button onClick={() => setResetPassModal({ open: true, employee: selectedEmployee, newPassword: '' })} style={{ padding: '8px 12px', borderRadius: 8, background: '#eff6ff', color: '#0a84ff', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: 12 }}>
                      Reset Employee Password
                    </button>
                  </div>
                )}
              </div>
              
              {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager') && (
                <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #f1f5f9' }}>
                  <h4 style={{ fontSize: 16, fontWeight: 900, marginBottom: 16 }}>Leave Overview</h4>
                  {loadingLeaves ? (
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>Loading leaves...</div>
                  ) : (
                    <div style={{ display: 'grid', gap: 16 }}>
                      {empLeaveBalance.length > 0 && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {empLeaveBalance.map(b => (
                            <div key={b.id} style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}>
                              <span style={{ fontWeight: 800, color: '#0f172a' }}>{b.type.toUpperCase()}:</span> {b.used}/{b.total} used
                            </div>
                          ))}
                        </div>
                      )}
                      {empLeaves.length > 0 ? (
                        <table style={{ width: '100%', fontSize: 13, textAlign: 'left', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#94a3b8' }}>
                              <th style={{ padding: '8px 0', fontWeight: 800 }}>Type</th>
                              <th style={{ padding: '8px 0', fontWeight: 800 }}>Dates</th>
                              <th style={{ padding: '8px 0', fontWeight: 800 }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {empLeaves.slice(0, 5).map(l => (
                              <tr key={l.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                <td style={{ padding: '8px 0', fontWeight: 700, textTransform: 'capitalize' }}>{l.type}</td>
                                <td style={{ padding: '8px 0', color: '#64748b' }}>{new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}</td>
                                <td style={{ padding: '8px 0' }}>
                                  <span style={{ padding: '4px 8px', borderRadius: 12, fontSize: 11, fontWeight: 800, background: l.status === 'approved' ? '#dcfce7' : l.status === 'rejected' ? '#fee2e2' : '#fef3c7', color: l.status === 'approved' ? '#16a34a' : l.status === 'rejected' ? '#ef4444' : '#d97706' }}>
                                    {l.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div style={{ fontSize: 13, color: '#94a3b8' }}>No leave requests found for this employee.</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {(user?.role === 'admin' || user?.role === 'hr') && (
                <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => handleTerminate(selectedEmployee.id)} style={{ padding: '12px 20px', borderRadius: 12, background: '#fee2e2', color: '#ef4444', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                    Terminate Employee
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Reset Password Modal */}
      <AnimatePresence>
        {resetPassModal.open && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setResetPassModal({ open: false, employee: null, newPassword: '' })} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }} style={{ background: 'white', borderRadius: 24, width: '100%', maxWidth: 400, position: 'relative', padding: 32 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 16 }}>Reset Password</h2>
              <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
                Enter a new password for <strong>{resetPassModal.employee?.firstName} {resetPassModal.employee?.lastName}</strong>.
              </p>
              <input type="text" placeholder="New Password" style={{ ...inputStyle, marginBottom: 16 }} value={resetPassModal.newPassword} onChange={e => setResetPassModal({...resetPassModal, newPassword: e.target.value})} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setResetPassModal({ open: false, employee: null, newPassword: '' })} style={{ flex: 1, padding: 14, borderRadius: 12, background: '#f1f5f9', color: '#64748b', fontWeight: 800, border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleResetPassword} style={{ flex: 1, padding: 14, borderRadius: 12, background: '#0a84ff', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer' }}>Reset Password</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Employees;
