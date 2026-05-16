const express = require('express');
const { Supplier, PurchaseOrder, Product } = require('../models');
const { auth, roleCheck } = require('../middleware/auth');
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
router.post('/', auth, roleCheck(['admin', 'manager', 'inventory']), async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json(supplier);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Create Purchase Order
router.post('/orders', auth, roleCheck(['admin', 'manager', 'inventory']), async (req, res) => {
  try {
    const { supplierId, totalAmount, notes } = req.body;
    const order = await PurchaseOrder.create({
      supplierId,
      totalAmount,
      notes,
      status: 'pending'
    });
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all Purchase Orders
router.get('/orders', auth, roleCheck(['admin', 'manager', 'inventory']), async (req, res) => {
  try {
    const orders = await PurchaseOrder.findAll({
      include: [Supplier],
      order: [['createdAt', 'DESC']]
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
