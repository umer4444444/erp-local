export const getDefaultRoute = (role) => {
  switch (role) {
    case 'admin': return '/';
    case 'manager': return '/manager';
    case 'cashier': return '/sales';
    case 'hr': return '/hr';
    case 'inventory': return '/inventory';

    case 'expenses': return '/expenses';
    case 'finance': return '/revenue';
    case 'operations': return '/eod';
    case 'staff': return '/attendance';
    default: return '/attendance';
  }
};
