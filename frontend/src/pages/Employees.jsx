import React, { useState, useEffect } from 'react';
import { employeeAPI } from '../api';
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(location.state?.openAddModal || false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editingSalary, setEditingSalary] = useState(false);
  const [salaryForm, setSalaryForm] = useState({ salary: '', salaryType: 'monthly' });
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', cnic: '',
    departmentId: '', designationId: '', joiningDate: '',
    salaryType: 'monthly', salary: '', bankAccount: ''
  });

  useEffect(() => {
    fetchData();
    // Clear history state so refreshing doesn't repeatedly open the modal
    if (location.state?.openAddModal) {
      window.history.replaceState({}, document.title);
    }
  }, []);

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

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await employeeAPI.create(form);
      setShowModal(false);
      setStep(1);
      setForm({ firstName: '', lastName: '', email: '', phone: '', cnic: '', departmentId: '', designationId: '', joiningDate: '', salaryType: 'monthly', salary: '', bankAccount: '' });
      fetchData();
    } catch (e) {
      alert(e.response?.data?.message || 'Error saving employee. Please check all fields.');
    }
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
        {departments.map(dept => (
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
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
              <th style={{ padding: 16, textAlign: 'left', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Employee</th>
              <th style={{ padding: 16, textAlign: 'left', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Department</th>
              <th style={{ padding: 16, textAlign: 'left', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: 16, textAlign: 'right', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{(emp.firstName || '')[0]}</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{emp.firstName} {emp.lastName}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{emp.empCode}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: 16, fontSize: 13, fontWeight: 600 }}>{emp.Department?.name || '—'}</td>
                <td style={{ padding: 16 }}>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 900, background: emp.status === 'active' ? '#f0fdf4' : '#fef2f2', color: emp.status === 'active' ? '#16a34a' : '#ef4444' }}>{emp.status}</span>
                </td>
                <td style={{ padding: 16, textAlign: 'right' }}>
                  <button onClick={() => setSelectedEmployee(emp)} style={{ background: 'none', border: 'none', color: '#0a84ff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>View Profile</button>
                </td>
              </tr>
            ))}
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
                </div>
              </div>

              <form onSubmit={handleSave}>
                {step === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <input placeholder="First Name" style={inputStyle} value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                      <input placeholder="Last Name" style={inputStyle} value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
                    </div>
                    <input placeholder="Email Address" style={inputStyle} value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                    <input placeholder="Phone Number" style={inputStyle} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                    <button type="button" onClick={() => setStep(2)} style={{ padding: 14, borderRadius: 12, background: '#0a84ff', color: 'white', fontWeight: 800, border: 'none', marginTop: 12 }}>Continue</button>
                  </div>
                )}
                {step === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Select Department (determines portal access)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxHeight: 320, overflowY: 'auto' }}>
                      {departments.map(d => {
                        const portalMap = {
                          'Administration': { portal: 'Admin Dashboard', role: 'admin', color: '#6366f1' },
                          'Management': { portal: 'Manager Hub', role: 'manager', color: '#0a84ff' },
                          'Inventory': { portal: 'Inventory Ledger', role: 'inventory', color: '#f59e0b' },
                          'Sales': { portal: 'Sales Terminal', role: 'cashier', color: '#10b981' },
                          'HR': { portal: 'HR & Payroll', role: 'hr', color: '#a855f7' },
                          'HR & Payroll': { portal: 'HR & Payroll', role: 'hr', color: '#a855f7' },
                          'Pharmacy': { portal: 'Pharmacy Module', role: 'pharmacist', color: '#ec4899' },
                          'Revenue & Finance': { portal: 'Revenue Analytics', role: 'manager', color: '#0a84ff' },
                          'Expenses': { portal: 'Expenses Module', role: 'expenses', color: '#ef4444' },
                          'EOD Operations': { portal: 'EOD Report', role: 'cashier', color: '#64748b' },
                        };
                        const info = portalMap[d.name] || { portal: d.name, role: 'cashier', color: '#94a3b8' };
                        const isSelected = form.departmentId === d.id;
                        return (
                          <div
                            key={d.id}
                            onClick={() => setForm({...form, departmentId: d.id})}
                            style={{
                              padding: '12px 14px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
                              border: isSelected ? `2px solid ${info.color}` : '2px solid #e2e8f0',
                              background: isSelected ? `${info.color}10` : 'white',
                            }}
                          >
                            <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>{d.name}</div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: info.color, marginTop: 2 }}>→ {info.portal}</div>
                            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>Role: {info.role}</div>
                          </div>
                        );
                      })}
                    </div>
                    <select style={inputStyle} value={form.designationId} onChange={e => setForm({...form, designationId: e.target.value})}>
                      <option value="">Select Designation</option>
                      {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <input type="date" style={inputStyle} value={form.joiningDate} onChange={e => setForm({...form, joiningDate: e.target.value})} />
                    <button type="button" onClick={() => setStep(3)} disabled={!form.departmentId} style={{ padding: 14, borderRadius: 12, background: form.departmentId ? '#0a84ff' : '#e2e8f0', color: form.departmentId ? 'white' : '#94a3b8', fontWeight: 800, border: 'none', marginTop: 4, cursor: form.departmentId ? 'pointer' : 'not-allowed' }}>Continue</button>
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
                    <button type="submit" style={{ padding: 14, borderRadius: 12, background: '#10b981', color: 'white', fontWeight: 800, border: 'none', marginTop: 12 }}>Complete & Add Employee</button>
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
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 4 }}>${parseFloat(selectedEmployee.salary || 0).toLocaleString()} <span style={{ fontSize: 12, color: '#64748b', textTransform: 'capitalize' }}>({selectedEmployee.salaryType})</span></div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Status</div>
                  <div style={{ fontWeight: 600 }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 900, background: selectedEmployee.status === 'active' ? '#f0fdf4' : '#fef2f2', color: selectedEmployee.status === 'active' ? '#16a34a' : '#ef4444' }}>{selectedEmployee.status}</span>
                  </div>
                </div>
              </div>
              
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
    </div>
  );
};

export default Employees;
