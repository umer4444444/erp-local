const express = require('express');
const { Supplier, PurchaseOrder, Product, POItem, StockLog, sequelize } = require('../models');
const { auth, roleCheck } = require('../middleware/auth');
const audit = require('../middleware/audit');
const router = express.Router();

// Get all suppliers
router.get('/', auth, async (req, res) => {
  try {
    const suppliers = await Supplier.findAll();
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add supplier
router.post('/', auth, roleCheck(['admin', 'manager', 'inventory']), audit('suppliers'), async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json(supplier);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Edit supplier
router.put('/:id', auth, roleCheck(['admin', 'manager', 'inventory']), audit('suppliers'), async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

    await supplier.update(req.body);
    res.json(supplier);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Create Purchase Order
router.post('/orders', auth, roleCheck(['admin', 'manager', 'inventory']), audit('suppliers'), async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { supplierId, totalAmount, notes, items } = req.body;
    const order = await PurchaseOrder.create({
      supplierId,
      totalAmount,
      notes,
      status: 'pending'
    }, { transaction });

    if (items && Array.isArray(items)) {
      for (const item of items) {
        await POItem.create({
          purchaseOrderId: order.id,
          productId: item.productId,
          quantity: parseInt(item.quantity || 1),
          unitCost: parseFloat(item.unitCost || 0)
        }, { transaction });
      }
    }

    await transaction.commit();
    res.status(201).json(order);
  } catch (err) {
    await transaction.rollback();
    res.status(400).json({ message: err.message });
  }
});

// Receive Purchase Order
router.put('/orders/:id/receive', auth, roleCheck(['admin', 'manager', 'inventory']), audit('suppliers'), async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const order = await PurchaseOrder.findByPk(req.params.id, {
      include: [{ model: POItem, as: 'Items' }],
      transaction
    });
    if (!order) return res.status(404).json({ message: 'Purchase Order not found' });
    if (order.status === 'received') {
      return res.status(400).json({ message: 'Purchase Order already received' });
    }

    await order.update({ status: 'received' }, { transaction });

    if (order.Items && order.Items.length > 0) {
      for (const item of order.Items) {
        const product = await Product.findByPk(item.productId, { transaction });
        if (product) {
          await product.update({ stock: product.stock + item.quantity }, { transaction });
          await StockLog.create({
            productId: product.id,
            userId: req.user.id,
            change: item.quantity,
            type: 'restock',
            notes: `Purchase Order receipt: PO-${order.id.slice(0, 8)}`
          }, { transaction });
        }
      }
    }

    await transaction.commit();
    res.json(order);
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ message: err.message });
  }
});

// Get all Purchase Orders
router.get('/orders', auth, roleCheck(['admin', 'manager', 'inventory']), async (req, res) => {
  try {
    const orders = await PurchaseOrder.findAll({
      include: [
        Supplier,
        { model: POItem, as: 'Items', include: [Product] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
