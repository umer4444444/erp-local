const express = require('express');
const { Sale, SaleItem, Product, Customer, StockLog, SalesSession, User, sequelize } = require('../models');
const { auth, roleCheck } = require('../middleware/auth');
const { Op } = require('sequelize');
const router = express.Router();

// Get sales history (paginated)
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (search) {
      where[Op.or] = [
        { id: { [Op.like]: `%${search}%` } },
        { status: { [Op.like]: `%${search}%` } }
      ];
    }
    const sales = await Sale.findAndCountAll({
      where,
      include: [{ model: SaleItem, as: 'Items', include: [Product] }, Customer, User],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/held', auth, async (req, res) => {
  try {
    const heldSales = await Sale.findAll({
      where: { status: 'held' },
      include: [{ model: SaleItem, as: 'Items', include: [Product] }, Customer],
      order: [['createdAt', 'DESC']]
    });
    res.json(heldSales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/discount', auth, async (req, res) => {
  try {
    const { code } = req.body;
    const normalized = (code || '').toString().trim().toUpperCase();
    const promoCodes = {
      SAVE10: 10,
      SAVE15: 15,
      SUMMER20: 20
    };

    if (!normalized || !Object.prototype.hasOwnProperty.call(promoCodes, normalized)) {
      return res.status(404).json({ message: 'Invalid promo code' });
    }

    res.json({ code: normalized, percent: promoCodes[normalized], message: `Promo code ${normalized} applied.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create Sale (Advanced)
router.post('/', auth, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { items, customerId, totalAmount, discount, tax, grandTotal, paymentMethod, cashAmount, cardAmount, discountType, extraCharges, extraChargeReason, creditReason, customerName, customerPhone, cashierName, notes } = req.body;
    
    const sale = await Sale.create({
      customerId,
      userId: req.user.id,
      totalAmount,
      discount,
      tax,
      grandTotal,
      paymentMethod,
      cashAmount: paymentMethod === 'split' ? cashAmount : (paymentMethod === 'cash' ? grandTotal : 0),
      cardAmount: paymentMethod === 'split' ? cardAmount : (paymentMethod === 'card' ? grandTotal : 0),
      discountType,
      extraCharges,
      extraChargeReason,
      creditReason,
      customerName,
      customerPhone,
      cashierName,
      notes,
      status: 'active'
    }, { transaction });

    for (const item of items) {
      await SaleItem.create({
        saleId: sale.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        discountAmount: item.discountAmount || 0,
        total: (item.price * item.quantity) - (item.discountAmount || 0)
      }, { transaction });

      const product = await Product.findByPk(item.productId, { transaction });
      if (!product || product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product?.name || 'unknown product'}`);
      }
      
      await product.update({ stock: product.stock - item.quantity }, { transaction });
      
      await StockLog.create({
        productId: item.productId,
        userId: req.user.id,
        change: -item.quantity,
        type: 'sale',
        notes: 'sale',
        reference: sale.id
      }, { transaction });
    }

    await transaction.commit();
    res.status(201).json(sale);
  } catch (err) {
    await transaction.rollback();
    res.status(400).json({ message: err.message });
  }
});

// Get Today & Total Stats
router.get('/stats', auth, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    
    // Recalculate lifetime and today totals from scratch
    const allSales = await Sale.findAll({
      where: { status: 'active' },
      include: [{ model: SaleItem, as: 'Items', include: [Product] }]
    });

    let totalRevenue = 0;
    let lifetimeCost = 0;
    let todayRevenue = 0;
    let todayCount = 0;

    allSales.forEach(sale => {
      const gTotal = parseFloat(sale.grandTotal || 0);
      totalRevenue += gTotal;
      
      if (new Date(sale.createdAt) >= startOfDay) {
        todayRevenue += gTotal;
        todayCount++;
      }

      sale.Items?.forEach(item => {
        lifetimeCost += parseFloat(item.Product?.costPrice || 0) * item.quantity;
      });
    });

    res.json({ 
      count: todayCount, 
      revenue: todayRevenue, 
      totalRevenue: totalRevenue,
      netProfit: totalRevenue - lifetimeCost 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Void Sale
router.post('/:id/void', auth, roleCheck(['admin', 'manager', 'hr']), async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { reason } = req.body;
    const sale = await Sale.findByPk(req.params.id, {
      include: [{ model: SaleItem, as: 'Items' }],
      transaction
    });

    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    if (sale.status === 'voided') return res.status(400).json({ message: 'Sale already voided' });

    // Restore stock
    for (const item of sale.Items) {
      const product = await Product.findByPk(item.productId, { transaction });
      if (product) {
        await product.update({ stock: product.stock + item.quantity }, { transaction });
        await StockLog.create({
          productId: product.id,
          userId: req.user.id,
          change: item.quantity,
          type: 'void',
          notes: reason,
          reference: sale.id
        }, { transaction });
      }
    }

    await sale.update({ status: 'voided', voidReason: reason }, { transaction });

    await transaction.commit();
    res.json({ message: 'Sale voided and stock restored' });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ message: err.message });
  }
});

// Refund Sale
router.post('/:id/refund', auth, roleCheck(['admin', 'manager', 'hr']), async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { reason } = req.body;
    const sale = await Sale.findByPk(req.params.id, {
      include: [{ model: SaleItem, as: 'Items' }],
      transaction
    });

    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    if (sale.status === 'refunded') return res.status(400).json({ message: 'Sale already refunded' });

    // Restore stock
    for (const item of sale.Items) {
      const product = await Product.findByPk(item.productId, { transaction });
      if (product) {
        await product.update({ stock: product.stock + item.quantity }, { transaction });
        await StockLog.create({
          productId: product.id,
          userId: req.user.id,
          change: item.quantity,
          type: 'refund',
          notes: reason || 'refund',
          reference: sale.id
        }, { transaction });
      }
    }

    await sale.update({ status: 'refunded', voidReason: reason }, { transaction });

    await transaction.commit();
    res.json({ message: 'Sale refunded and stock restored' });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ message: err.message });
  }
});

// EOD Logic
router.get('/eod', auth, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    const sales = await Sale.findAll({
      where: { createdAt: { [Op.gte]: startOfDay }, status: 'active' }
    });
    const summary = sales.reduce((acc, s) => {
      acc.total += parseFloat(s.grandTotal);
      acc.cash += parseFloat(s.cashAmount);
      acc.card += parseFloat(s.cardAmount);
      return acc;
    }, { total: 0, cash: 0, card: 0 });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/eod/close', auth, async (req, res) => {
  try {
    const { cashCount, notes } = req.body;
    const session = await SalesSession.findOne({ where: { userId: req.user.id, status: 'active' } });
    if (!session) return res.status(404).json({ message: 'No active session' });
    
    await session.update({
      endTime: new Date(),
      status: 'completed',
      cashCount,
      notes
    });
    res.json({ message: 'EOD Closed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Revenue Analytics
router.get('/analytics', auth, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sales = await Sale.findAll({
      where: { createdAt: { [Op.gte]: thirtyDaysAgo }, status: 'active' },
      include: [{ model: SaleItem, as: 'Items', include: [Product] }]
    });

    let totalRevenue = 0;
    let totalCost = 0;
    let cashSales = 0;
    let cardSales = 0;
    let splitSales = 0;

    sales.forEach(sale => {
      totalRevenue += parseFloat(sale.grandTotal || 0);
      
      // Calculate costs from items
      sale.Items.forEach(item => {
        totalCost += parseFloat(item.Product?.costPrice || 0) * item.quantity;
      });

      // Payment methods count (or total amount depending on preference, here we use count for pie chart)
      if (sale.paymentMethod === 'cash') cashSales++;
      else if (sale.paymentMethod === 'card') cardSales++;
      else if (sale.paymentMethod === 'split') splitSales++;
    });

    const netProfit = totalRevenue - totalCost;

    // Projected revenue = (Revenue / 30) * 90 (quarterly projection based on last 30 days)
    const projectedRevenue = sales.length > 0 ? (totalRevenue / 30) * 90 : 0;

    res.json({
      totalRevenue,
      averageOrder: sales.length > 0 ? (totalRevenue / sales.length).toFixed(2) : 0,
      totalCost,
      netProfit,
      projectedRevenue,
      paymentMethods: {
        cash: cashSales,
        card: cardSales,
        split: splitSales,
        total: sales.length
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
