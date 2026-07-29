const express = require('express');
const { Sale, SaleItem, Product, User, Expense, Customer, sequelize } = require('../models');
const { auth, roleCheck } = require('../middleware/auth');
const { Op } = require('sequelize');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const router = express.Router();

// GET /api/reports/revenue?from=&to=
router.get('/revenue', auth, roleCheck(['admin', 'manager', 'finance']), async (req, res) => {
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
router.get('/pnl', auth, roleCheck(['admin', 'manager', 'finance']), async (req, res) => {
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

    const reportData = {
      month: currentMonth,
      year: currentYear,
      revenue,
      cogs,
      grossProfit: revenue - cogs,
      expenses: totalExpenses,
      netProfit
    };

    if (req.query.export === 'csv') {
      const fields = ['month', 'year', 'revenue', 'cogs', 'grossProfit', 'expenses', 'netProfit'];
      const parser = new Parser({ fields });
      const csv = parser.parse(reportData);
      res.header('Content-Type', 'text/csv');
      res.attachment(`PNL_${currentYear}_${currentMonth}.csv`);
      return res.send(csv);
    }
    
    if (req.query.export === 'pdf') {
      const doc = new PDFDocument();
      res.header('Content-Type', 'application/pdf');
      res.attachment(`PNL_${currentYear}_${currentMonth}.pdf`);
      doc.pipe(res);
      doc.fontSize(20).text('Profit and Loss Statement', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Period: ${currentMonth}/${currentYear}`);
      doc.moveDown();
      doc.text(`Revenue: SAR ${revenue.toFixed(2)}`);
      doc.text(`Cost of Goods Sold (COGS): SAR ${cogs.toFixed(2)}`);
      doc.text(`Gross Profit: SAR ${reportData.grossProfit.toFixed(2)}`);
      doc.text(`Operating Expenses: SAR ${totalExpenses.toFixed(2)}`);
      doc.moveDown();
      doc.fontSize(14).text(`Net Profit: SAR ${netProfit.toFixed(2)}`, { underline: true });
      doc.end();
      return;
    }

    res.json(reportData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reports/trialbalance
router.get('/trialbalance', auth, roleCheck(['admin', 'manager', 'finance']), async (req, res) => {
  try {
    // A simplified Trial Balance based on current tables:
    // Debits: Cash/Bank (Mocked or from SalesSession), Receivables (mocked), Inventory Value, Expenses
    // Credits: Payables (mocked), Revenue, Equity (mocked)
    const [sales, products, expenses] = await Promise.all([
      Sale.findAll({ where: { status: 'active' } }),
      Product.findAll(),
      Expense.findAll()
    ]);

    const revenue = sales.reduce((sum, s) => sum + parseFloat(s.grandTotal || 0), 0);
    const cashCollected = sales.reduce((sum, s) => sum + parseFloat(s.cashAmount || 0), 0);
    const bankCollected = sales.reduce((sum, s) => sum + parseFloat(s.cardAmount || 0), 0);
    const inventoryValue = products.reduce((sum, p) => sum + (parseFloat(p.costPrice || 0) * (p.stock || 0)), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    
    // Simplified Mock Accounts for balancing
    const data = [
      { account: 'Cash on Hand', debit: cashCollected, credit: 0 },
      { account: 'Bank (Card Sales)', debit: bankCollected, credit: 0 },
      { account: 'Inventory Asset', debit: inventoryValue, credit: 0 },
      { account: 'Operating Expenses', debit: totalExpenses, credit: 0 },
      { account: 'Sales Revenue', debit: 0, credit: revenue },
      { account: 'Owner Equity (Balancing)', debit: 0, credit: (cashCollected + bankCollected + inventoryValue + totalExpenses) - revenue }
    ];

    if (req.query.export === 'csv') {
      const parser = new Parser({ fields: ['account', 'debit', 'credit'] });
      const csv = parser.parse(data);
      res.header('Content-Type', 'text/csv');
      res.attachment('Trial_Balance.csv');
      return res.send(csv);
    }
    
    if (req.query.export === 'pdf') {
      const doc = new PDFDocument();
      res.header('Content-Type', 'application/pdf');
      res.attachment('Trial_Balance.pdf');
      doc.pipe(res);
      doc.fontSize(20).text('Trial Balance', { align: 'center' });
      doc.moveDown();
      
      let totalDebit = 0;
      let totalCredit = 0;

      data.forEach(row => {
        doc.fontSize(12).text(`${row.account}: Debit(SAR ${row.debit.toFixed(2)}) Credit(SAR ${row.credit.toFixed(2)})`);
        totalDebit += row.debit;
        totalCredit += row.credit;
      });

      doc.moveDown();
      doc.fontSize(14).text(`Total Debit: SAR ${totalDebit.toFixed(2)}`);
      doc.text(`Total Credit: SAR ${totalCredit.toFixed(2)}`);
      doc.end();
      return;
    }

    res.json(data);
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
router.get('/salesperson', auth, roleCheck(['admin', 'manager', 'finance']), async (req, res) => {
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

// GET /api/reports/sales-by-area
router.get('/sales-by-area', auth, async (req, res) => {
  try {
    const sales = await Sale.findAll({
      where: { status: 'active' },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('grandTotal')), 'sales']
      ],
      include: [{
        model: Customer,
        attributes: ['address']
      }],
      group: ['Customer.address'],
      order: [[sequelize.literal('sales'), 'DESC']],
      limit: 5
    });

    const mapped = sales.map(s => ({
      name: s.Customer?.address || 'Unknown Region',
      sales: parseFloat(s.dataValues.sales || 0)
    }));

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reports/collections
router.get('/collections', auth, async (req, res) => {
  try {
    // Total collected (cash + card) from active sales
    const sales = await Sale.findAll({
      where: { status: 'active' },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('cashAmount')), 'totalCash'],
        [sequelize.fn('SUM', sequelize.col('cardAmount')), 'totalCard']
      ]
    });
    
    let collected = 0;
    if (sales.length > 0) {
      collected = parseFloat(sales[0].dataValues.totalCash || 0) + parseFloat(sales[0].dataValues.totalCard || 0);
    }

    // Total outstanding from customer credit balances
    const customers = await Customer.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('creditBalance')), 'totalOutstanding']
      ]
    });
    
    let outstanding = 0;
    if (customers.length > 0) {
      outstanding = parseFloat(customers[0].dataValues.totalOutstanding || 0);
    }

    const target = collected + outstanding || 1; // avoid div 0

    res.json({ collected, outstanding, target });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
