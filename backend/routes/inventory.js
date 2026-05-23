const express = require('express');
const { Product, ProductVariation, Category, StockLog, sequelize } = require('../models');
const { auth, roleCheck } = require('../middleware/auth');
const router = express.Router();

// Get all products
router.get('/products', auth, async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [
        { model: Category },
        { model: ProductVariation, as: 'Variations' }
      ]
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get categories
router.get('/categories', auth, async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Helper to generate variation SKU
const generateVariationSku = (v, parentSku) => {
  if (v.sku && v.sku.trim() !== '') {
    return v.sku.trim();
  }
  const cleanName = (v.name || '').trim().replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').toUpperCase();
  const baseSku = (parentSku || 'VAR').trim().toUpperCase();
  return cleanName ? `${baseSku}-${cleanName}` : `${baseSku}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
};

// Add product
router.post('/products', auth, roleCheck(['admin', 'inventory', 'manager']), async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { variations, ...productData } = req.body;
    const product = await Product.create(productData, { transaction });
    
    if (variations && Array.isArray(variations)) {
      for (const v of variations) {
        const vSku = generateVariationSku(v, product.sku);
        await ProductVariation.create({ ...v, sku: vSku, productId: product.id }, { transaction });
      }
    }

    await transaction.commit();
    res.status(201).json(product);
  } catch (err) {
    await transaction.rollback();
    res.status(400).json({ message: err.message });
  }
});

// Update product
router.put('/products/:id', auth, roleCheck(['admin', 'inventory', 'manager']), async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { variations, ...productData } = req.body;
    const product = await Product.findByPk(req.params.id, { transaction });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    await product.update(productData, { transaction });

    if (variations && Array.isArray(variations)) {
      // Simple logic: delete existing and recreate or update
      await ProductVariation.destroy({ where: { productId: product.id }, transaction });
      for (const v of variations) {
        const vSku = generateVariationSku(v, product.sku);
        await ProductVariation.create({ ...v, sku: vSku, productId: product.id }, { transaction });
      }
    }

    await transaction.commit();
    res.json(product);
  } catch (err) {
    await transaction.rollback();
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
router.post('/restock', auth, roleCheck(['admin', 'inventory', 'manager']), async (req, res) => {
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
      type: 'restock',
      notes: reason || 'restock'
    }, { transaction });
    
    await transaction.commit();
    res.json({ message: 'Restocked successfully', stock: product.stock });
  } catch (err) {
    await transaction.rollback();
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
