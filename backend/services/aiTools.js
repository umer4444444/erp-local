const { Sale, Product, Customer, StockLog, PurchaseOrder, POItem, Supplier, User, SaleItem } = require('../models');
const { Op } = require('sequelize');

/**
 * These are the strictly typed tools the AI agent can call.
 * This prevents the AI from directly writing SQL queries.
 */

const get_sales_summary = async (companyId, startDate, endDate) => {
  const whereClause = { companyId };
  if (startDate && endDate) {
    whereClause.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
  }

  const sales = await Sale.findAll({ where: whereClause, attributes: ['totalAmount', 'cashAmount', 'paymentMethod'] });
  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
  const cashSales = sales.reduce((sum, sale) => sum + Number(sale.cashAmount), 0);
  const creditSales = totalRevenue - cashSales;
  
  return {
    totalSalesCount: sales.length,
    totalRevenue,
    cashSales,
    creditSales,
    currency: 'SAR'
  };
};

const get_low_stock_products = async (companyId, threshold = 10) => {
  const products = await Product.findAll({
    where: { 
      companyId,
      stock: { [Op.lt]: threshold }
    },
    attributes: ['id', 'name', 'stock', 'costPrice']
  });
  
  return products;
};

const get_zero_stock_items = async (companyId) => {
  return await get_low_stock_products(companyId, 1); // < 1 is 0 or negative
};

const get_inventory_value = async (companyId) => {
  const products = await Product.findAll({
    where: { companyId },
    attributes: ['stock', 'costPrice']
  });
  
  const totalValue = products.reduce((sum, p) => sum + (Number(p.stock) * Number(p.costPrice)), 0);
  return {
    totalValue,
    currency: 'SAR',
    totalItems: products.length
  };
};

const get_top_customers = async (companyId, limit = 5) => {
  const customers = await Customer.findAll({
    where: { companyId },
    order: [['totalPurchases', 'DESC']],
    limit
  });
  
  return customers.map(c => ({ name: c.name, totalPurchases: c.totalPurchases, currentBalance: c.currentBalance }));
};

const get_customer_balance = async (companyId, overdueOnly = false) => {
  const whereClause = { companyId };
  if (overdueOnly) {
    whereClause.currentBalance = { [Op.gt]: 0 };
  }
  
  const customers = await Customer.findAll({
    where: whereClause,
    attributes: ['name', 'currentBalance', 'creditLimit', 'phone'],
    order: [['currentBalance', 'DESC']]
  });
  
  return customers;
};

const draft_purchase_order = async (companyId, supplierId, items, notes) => {
  try {
    const po = await PurchaseOrder.create({
      companyId,
      supplierId,
      status: 'pending',
      notes: notes || 'Drafted by AI Assistant'
    });

    let totalAmount = 0;
    for (const item of items) {
      const lineTotal = item.quantity * item.unitCost;
      totalAmount += lineTotal;
      await POItem.create({
        purchaseOrderId: po.id,
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
        total: lineTotal
      });
    }

    await po.update({ totalAmount });
    return { success: true, message: `Drafted PO #${po.id} for ${totalAmount} SAR. Awaiting human approval.` };
  } catch (err) {
    return { success: false, message: `Failed to draft PO: ${err.message}` };
  }
};

const forecast_demand = async (companyId, productId, daysToForecast = 30) => {
  // Simple heuristic forecast based on past 30 days of stock logs (sales)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const logs = await StockLog.findAll({
    where: { 
      productId, 
      type: 'sale',
      createdAt: { [Op.gte]: thirtyDaysAgo }
    }
  });

  const totalSold = logs.reduce((sum, log) => sum + Math.abs(log.change), 0);
  const dailyAverage = totalSold / 30;
  const projectedDemand = dailyAverage * daysToForecast;

  return {
    productId,
    past30DaysSales: totalSold,
    dailyAverage: dailyAverage.toFixed(2),
    projectedDemandNextXDays: Math.ceil(projectedDemand),
    daysToForecast
  };
};

const get_sales_by_salesperson = async (companyId, startDate, endDate) => {
  const whereClause = { companyId };
  if (startDate && endDate) {
    whereClause.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
  }
  
  const sales = await Sale.findAll({ where: whereClause, attributes: ['userId', 'totalAmount', 'cashierName'] });
  const map = {};
  sales.forEach(sale => {
    const name = sale.cashierName || 'Unknown';
    if (!map[name]) map[name] = 0;
    map[name] += Number(sale.totalAmount);
  });
  
  return Object.entries(map).map(([name, total]) => ({ name, totalAmount: total })).sort((a,b) => b.totalAmount - a.totalAmount);
};

// Map of available tools for the LLM to call
const tools = {
  get_sales_summary,
  get_low_stock_products,
  get_zero_stock_items,
  get_inventory_value,
  get_top_customers,
  get_customer_balance,
  draft_purchase_order,
  forecast_demand,
  get_sales_by_salesperson
};

const toolDeclarations = [
  {
    name: 'get_sales_summary',
    description: 'Get total sales count and revenue (cash vs credit) for the company within an optional date range.',
    parameters: {
      type: 'object',
      properties: {
        startDate: { type: 'string', description: 'ISO Date string' },
        endDate: { type: 'string', description: 'ISO Date string' }
      }
    }
  },
  {
    name: 'get_low_stock_products',
    description: 'Get a list of products that have stock below a certain threshold.',
    parameters: {
      type: 'object',
      properties: {
        threshold: { type: 'number', description: 'The stock quantity threshold. Default is 10.' }
      }
    }
  },
  {
    name: 'get_zero_stock_items',
    description: 'Get a list of products that are completely out of stock (quantity 0 or less).',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_inventory_value',
    description: 'Get the total monetary value of all current inventory in stock.',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_top_customers',
    description: 'Get the top customers based on total purchases.',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of customers to return. Default is 5.' }
      }
    }
  },
  {
    name: 'get_customer_balance',
    description: 'Get a list of customer balances. Useful to find who owes money.',
    parameters: {
      type: 'object',
      properties: {
        overdueOnly: { type: 'boolean', description: 'If true, only returns customers with a balance > 0. Default false.' }
      }
    }
  },
  {
    name: 'draft_purchase_order',
    description: 'Draft a new Purchase Order for a supplier. The status will be pending human approval.',
    parameters: {
      type: 'object',
      properties: {
        supplierId: { type: 'string', description: 'The UUID of the supplier' },
        notes: { type: 'string', description: 'Any notes for the PO' },
        items: {
          type: 'array',
          description: 'List of items to order',
          items: {
            type: 'object',
            properties: {
              productId: { type: 'string', description: 'UUID of product' },
              quantity: { type: 'number', description: 'Quantity to order' },
              unitCost: { type: 'number', description: 'Cost per unit' }
            }
          }
        }
      },
      required: ['supplierId', 'items']
    }
  },
  {
    name: 'forecast_demand',
    description: 'Forecast the demand of a specific product based on past 30 days of sales data.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'UUID of the product to forecast' },
        daysToForecast: { type: 'number', description: 'Number of days to forecast into the future. Default 30.' }
      },
      required: ['productId']
    }
  },
  {
    name: 'get_sales_by_salesperson',
    description: 'Get sales grouped by salesperson (cashier) to see who is performing best.',
    parameters: {
      type: 'object',
      properties: {
        startDate: { type: 'string', description: 'ISO Date string' },
        endDate: { type: 'string', description: 'ISO Date string' }
      }
    }
  }
];

module.exports = {
  tools,
  toolDeclarations
};
