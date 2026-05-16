const express = require('express');
const { Product, Category, StockLog, sequelize } = require('../models');
const { auth, roleCheck } = require('../middleware/auth');
const router = express.Router();

// Get all products
router.get('/products', auth, async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [Category]
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add product
router.post('/products', auth, roleCheck(['admin', 'inventory']), async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update product
router.put('/products/:id', auth, roleCheck(['admin', 'inventory']), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await product.update(req.body);
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get Alerts (Low stock & Expiry)
router.get('/alerts', auth, async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const lowStock = await Product.findAll({ where: { stock: { [Op.lte]: 10 } } });
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringSoon = await Product.findAll({ 
      where: { 
        expiryDate: { [Op.and]: [{ [Op.ne]: null }, { [Op.lte]: thirtyDaysFromNow }] } 
      } 
    });
    
    res.json({ lowStock, expiringSoon });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Restock
router.post('/restock', auth, roleCheck(['admin', 'inventory']), async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { productId, quantity, reason } = req.body;
    const product = await Product.findByPk(productId, { transaction });
    if (!product) throw new Error('Product not found');
    
    await product.update({ stock: product.stock + parseInt(quantity) }, { transaction });
    await StockLog.create({
      productId,
      userId: req.user.id,
      change: quantity,
      reason: reason || 'restock'
    }, { transaction });
    
    await transaction.commit();
    res.json({ message: 'Restocked successfully', stock: product.stock });
  } catch (err) {
    await transaction.rollback();
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
