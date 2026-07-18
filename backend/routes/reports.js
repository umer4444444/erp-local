const express = require('express');
const { Sale, SaleItem, Product, User, Expense, Customer, sequelize } = require('../models');
const { auth, roleCheck } = require('../middleware/auth');
const { Op } = require('sequelize');
const router = express.Router();

// GET /api/reports/revenue?from=&to=
router.get('/revenue', auth, roleCheck(['admin', 'manager']), async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = { status: 'active' };
    if (from && to) {
      where.createdAt = { [Op.between]: [new Date(from), new Date(to + 'T23:59:59')] };
    }

    const sales = await Sale.findAll({ where });
    const totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s.grandTotal || 0), 0);
    res.json({ totalRevenue, salesCount: sales.length, sales });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reports/pnl?month=&year=
router.get('/pnl', auth, roleCheck(['admin', 'manager']), async (req, res) => {
  try {
    const { from, to, month, year } = req.query;
    let startDate, endDate;
    let currentMonth = parseInt(month || new Date().getMonth() + 1);
    let currentYear = parseInt(year || new Date().getFullYear());

    if (from && to) {
      startDate = new Date(from);
      endDate = new Date(to + 'T23:59:59');
      currentMonth = startDate.getMonth() + 1;
      currentYear = startDate.getFullYear();
    } else {
      startDate = new Date(currentYear, currentMonth - 1, 1);
      endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    }

    const [sales, expenses] = await Promise.all([
      Sale.findAll({
        where: {
          createdAt: { [Op.between]: [startDate, endDate] },
          status: 'active'
        },
        include: [{ model: SaleItem, as: 'Items', include: [Product] }]
      }),
      Expense.findAll({
        where: {
          date: { [Op.between]: [startDate, endDate] }
        }
      })
    ]);

    let revenue = 0;
    let cogs = 0;
    sales.forEach(s => {
      revenue += parseFloat(s.grandTotal || 0);
      s.Items?.forEach(item => {
        cogs += parseFloat(item.Product?.costPrice || 0) * item.quantity;
      });
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const netProfit = revenue - cogs - totalExpenses;

    res.json({
      month: currentMonth,
      year: currentYear,
      revenue,
      cogs,
      expenses: totalExpenses,
      netProfit
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reports/topproducts?limit=
router.get('/topproducts', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || 10);
    const topProducts = await SaleItem.findAll({
      attributes: [
        'productId',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalSold'],
        [sequelize.fn('SUM', sequelize.col('SaleItem.total')), 'totalRevenue']
      ],
      include: [{ model: Product, attributes: ['name', 'sku', 'price'] }],
      group: ['productId', 'Product.id'],
      order: [[sequelize.literal('totalSold'), 'DESC']],
      limit
    });
    res.json(topProducts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reports/salesperson
router.get('/salesperson', auth, roleCheck(['admin', 'manager']), async (req, res) => {
  try {
    const sales = await Sale.findAll({
      where: { status: 'active' },
      attributes: [
        'userId',
        [sequelize.fn('COUNT', sequelize.col('Sale.id')), 'salesCount'],
        [sequelize.fn('SUM', sequelize.col('grandTotal')), 'revenueGenerated']
      ],
      include: [{ model: User, attributes: ['name', 'email'] }],
      group: ['userId', 'User.id'],
      order: [[sequelize.literal('revenueGenerated'), 'DESC']]
    });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reports/daily
router.get('/daily', auth, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);

    const sales = await Sale.findAll({
      where: {
        createdAt: { [Op.gte]: startOfDay },
        status: 'active'
      }
    });

    const summary = sales.reduce((acc, s) => {
      acc.revenue += parseFloat(s.grandTotal || 0);
      acc.count++;
      return acc;
    }, { revenue: 0, count: 0 });

    summary.averageBasket = summary.count > 0 ? summary.revenue / summary.count : 0;
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reports/customer/:id
router.get('/customer/:id', auth, async (req, res) => {
  try {
    const sales = await Sale.findAll({
      where: { customerId: req.params.id, status: 'active' },
      include: [{ model: SaleItem, as: 'Items', include: [Product] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
