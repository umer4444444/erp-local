import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Automatically add Token to headers
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
  getMe: () => API.get('/auth/me'),
};

export const salesAPI = {
  getAnalytics: () => API.get('/sales/analytics'),
  getHistory: (params) => API.get('/sales/history', { params }),
  getHeldSales: () => API.get('/sales/held'),
  getTodayStats: () => API.get('/sales/stats'),
  createSale: (data) => API.post('/sales', data),
  voidSale: (id, reason) => API.post(`/sales/${id}/void`, { reason }),
  applyPromo: (code) => API.post('/sales/discount', { code }),
  getEOD: () => API.get('/sales/eod'),
  closeEOD: (data) => API.post('/sales/eod/close', data),
};

export const customerAPI = {
  getCustomers: () => API.get('/customers'),
  search: (q) => API.get('/customers/search', { params: { q } }),
  create: (data) => API.post('/customers', data),
  getHistory: (id) => API.get(`/customers/${id}/history`),
};

export const inventoryAPI = {
  getProducts: () => API.get('/inventory/products'),
  addProduct: (data) => API.post('/inventory/products', data),
  updateProduct: (id, data) => API.put(`/inventory/products/${id}`, data),
  getAlerts: () => API.get('/inventory/alerts'),
  restock: (data) => API.post('/inventory/restock', data),
  getCategories: () => API.get('/inventory/categories'),
};

export const hrAPI = {
  getEmployees: () => API.get('/hr'),
  addEmployee: (data) => API.post('/hr', data),
  getStats: () => API.get('/hr/stats'),
};

export const shiftAPI = {
  getActiveShift: () => API.get('/shifts/active'),
  startShift: () => API.post('/shifts/start'),
  endShift: () => API.post('/shifts/end'),
  getHistory: () => API.get('/shifts/history'),
};

export const managerAPI = {
  getOverview: () => API.get('/manager/overview'),
  getEmployees: () => API.get('/manager/employees'),
};

// New Day 6 API
export const employeeAPI = {
  getAll: (params) => API.get('/employees', { params }),
  getById: (id) => API.get(`/employees/${id}`),
  create: (data) => API.post('/employees', data),
  update: (id, data) => API.put(`/employees/${id}`, data),
  delete: (id) => API.delete(`/employees/${id}`),
  getDepartments: () => API.get('/employees/departments'),
  getDesignations: () => API.get('/employees/designations'),
};

export const usersAPI = {
  getAll: () => API.get('/users'),
  create: (data) => API.post('/users', data),
  updateRole: (id, role) => API.put(`/users/${id}/role`, { role }),
  delete: (id) => API.delete(`/users/${id}`),
};

export const attendanceAPI = {
  clockIn: () => API.post('/attendance/clockin'),
  clockOut: () => API.post('/attendance/clockout'),
  getToday: () => API.get('/attendance/today'),
  getActive: () => API.get('/attendance/active'),
  getMyActive: () => API.get('/attendance/my-active'),
  getAudit: (params) => API.get('/attendance/audit', { params }),
};

export const leaveAPI = {
  apply: (data) => API.post('/leaves/apply', data),
  getMy: () => API.get('/leaves/my'),
  getPending: () => API.get('/leaves/pending'),
  updateStatus: (id, status, reason) => API.put(`/leaves/${id}/status`, { status, rejectionReason: reason }),
};

export const payrollAPI = {
  run: (month, year) => API.post('/payroll/run', { month, year }),
  getHistory: () => API.get('/payroll/history'),
  getPayslips: (runId) => API.get(`/payroll/runs/${runId}/payslips`),
  updatePayslip: (id, data) => API.put(`/payroll/payslips/${id}`, data),
};

export const expenseAPI = {
  getAll: () => API.get('/expenses'),
  getPending: () => API.get('/expenses/pending'),
  add: (data) => API.post('/expenses', data),
  update: (id, data) => API.put(`/expenses/${id}`, data),
  delete: (id) => API.delete(`/expenses/${id}`),
  updateStatus: (id, status) => API.put(`/expenses/${id}/status`, { status }),
};

export const pharmacyAPI = {
  getDrugs: () => API.get('/pharmacy/drugs'),
  uploadPrescription: (data) => API.post('/pharmacy/prescriptions', data),
  getPendingPrescriptions: () => API.get('/pharmacy/prescriptions/pending'),
  verifyPrescription: (id, status) => API.put(`/pharmacy/prescriptions/${id}/verify`, { status }),
};

export const supplierAPI = {
  getAll: () => API.get('/suppliers'),
  add: (data) => API.post('/suppliers', data),
  createOrder: (data) => API.post('/suppliers/orders', data),
  getOrders: () => API.get('/suppliers/orders'),
};

export default API;
