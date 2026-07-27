import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Automatically add Token to headers
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 Unauthorized errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Avoid redirect loops if login itself fails with 401
      if (!error.config.url.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

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
  delete: (id) => API.delete(`/customers/${id}`),
  getHistory: (id) => API.get(`/customers/${id}/history`),
  payOutstanding: (id, data) => API.post(`/customers/${id}/pay-outstanding`, data),
  getLoyaltyTransactions: (id) => API.get(`/customers/${id}/loyalty`),
};

export const inventoryAPI = {
  getProducts: () => API.get('/inventory/products'),
  addProduct: (data) => API.post('/inventory/products', data),
  updateProduct: (id, data) => API.put(`/inventory/products/${id}`, data),
  getAlerts: () => API.get('/inventory/alerts'),
  restock: (data) => API.post('/inventory/restock', data),
  getCategories: () => API.get('/inventory/categories'),
  adjustStock: (data) => API.post('/inventory/adjust', data),
  getMovementLogs: (params) => API.get('/inventory/logs', { params }),
  importCSV: (data) => API.post('/inventory/import', data),
  getPredictive: () => API.get('/inventory/predictive'),
  autoGeneratePO: () => API.post('/inventory/auto-po'),
  getAutoDiscount: () => API.get('/inventory/auto-discount'),
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
  getOverview:     () => API.get('/manager/overview'),
  getEmployees:    () => API.get('/manager/employees'),
  getSalesToday:   () => API.get('/manager/sales-today'),
  getPendingLeaves:() => API.get('/manager/leaves/pending'),
  updateLeave:     (id, data) => API.put(`/manager/leaves/${id}`, data),
  getActiveStaff:  () => API.get('/manager/staff/active'),
};

export const settingsAPI = {
  get: () => API.get('/settings'),
  update: (data) => API.post('/settings', data)
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
  resetPassword: (id, newPassword) => API.post(`/employees/${id}/reset-password`, { newPassword })
};

export const usersAPI = {
  getAll: () => API.get('/users'),
  create: (data) => API.post('/users', data),
  updateRole: (id, role) => API.put(`/users/${id}/role`, { role }),
  delete: (id) => API.delete(`/users/${id}`),
  toggleActive: (id) => API.put(`/users/${id}/toggle-active`),
};

export const attendanceAPI = {
  clockIn: (data) => API.post('/attendance/clockin', data),
  clockOut: () => API.post('/attendance/clockout'),
  getToday: () => API.get('/attendance/today'),
  getActive: () => API.get('/attendance/active'),
  getMyActive: () => API.get('/attendance/my-active'),
  getMyHistory: (page = 1) => API.get('/attendance/my-history', { params: { page, limit: 30 } }),
  getAudit: (params) => API.get('/attendance/audit', { params }),
};

export const leaveAPI = {
  apply: (data) => API.post('/leaves/apply', data),
  getMy: () => API.get('/leaves/my'),
  getMyBalance: () => API.get('/leaves/my-balance'),
  getPending: () => API.get('/leaves/pending'),
  updateStatus: (id, status, reason) => API.put(`/leaves/${id}/status`, { status, rejectionReason: reason }),
  getByEmployee: (id) => API.get(`/leaves/employee/${id}`),
  getBalanceByEmployee: (id) => API.get(`/leaves/balance/${id}`),
};

export const payrollAPI = {
  run: (month, year) => API.post('/payroll/run', { month, year }),
  getHistory: () => API.get('/payroll/history'),
  getPayslips: (runId) => API.get(`/payroll/runs/${runId}/payslips`),
  updatePayslip: (id, data) => API.put(`/payroll/payslips/${id}`, data),
  finalizeRun: (runId) => API.put(`/payroll/runs/${runId}/finalize`),
};

export const expenseAPI = {
  getAll: () => API.get('/expenses'),
  getPending: () => API.get('/expenses/pending'),
  add: (data) => API.post('/expenses', data),
  update: (id, data) => API.put(`/expenses/${id}`, data),
  delete: (id) => API.delete(`/expenses/${id}`),
  updateStatus: (id, status) => API.put(`/expenses/${id}/status`, { status }),
};



export const supplierAPI = {
  getAll: () => API.get('/suppliers'),
  add: (data) => API.post('/suppliers', data),
  update: (id, data) => API.put(`/suppliers/${id}`, data),
  createOrder: (data) => API.post('/suppliers/orders', data),
  getOrders: () => API.get('/suppliers/orders'),
  receiveOrder: (id, data) => API.put(`/suppliers/orders/${id}/receive`, data),
};

export const adminAPI = {
  getDashboardStats: () => API.get('/admin/dashboard'),
  getAuditLogs: (params) => API.get('/admin/audit-logs', { params }),
  getSettings: () => API.get('/admin/settings'),
  updateSettings: (data) => API.put('/admin/settings', data),
};

export const ridesAPI = {
  getAll: () => API.get('/rides'),
  create: (data) => API.post('/rides', data),
  getDrivers: () => API.get('/rides/drivers'),
  assign: (id, driverId) => API.put(`/rides/${id}/assign`, { driverId }),
  updateStatus: (id, status) => API.put(`/rides/${id}/status`, { status }),
};

export const reportsAPI = {
  getRevenue: (params) => API.get('/reports/revenue', { params }),
  getPnL: (params) => API.get('/reports/pnl', { params }),
  getTopProducts: (limit) => API.get('/reports/topproducts', { params: { limit } }),
  getSalesperson: () => API.get('/reports/salesperson'),
  getDaily: () => API.get('/reports/daily'),
  getCustomerReport: (id) => API.get(`/reports/customer/${id}`),
  getSalesByArea: () => API.get('/reports/sales-by-area'),
  getCollections: () => API.get('/reports/collections'),
};

export const advanceAPI = {
  request: (data) => API.post('/payroll/advance/request', data),
  getMy: () => API.get('/payroll/advance/my'),
  getAll: () => API.get('/payroll/advance/pending'),
  approve: (id, status) => API.put(`/payroll/advance/${id}/approve`, { status }),
};

export default API;
