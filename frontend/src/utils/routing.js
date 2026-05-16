export const getDefaultRoute = (role) => {
  switch (role) {
    case 'admin': return '/';
    case 'manager': return '/manager';
    case 'cashier': return '/sales';
    case 'hr': return '/hr';
    case 'inventory': return '/inventory';
    case 'pharmacist': return '/pharmacy';
    case 'expenses': return '/expenses';
    default: return '/login';
  }
};
