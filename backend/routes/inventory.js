const express = require('express');
const { Product, ProductVariation, Category, StockLog, sequelize, PurchaseOrder, POItem, Supplier } = require('../models');
const { auth, roleCheck } = require('../middleware/auth');
const audit = require('../middleware/audit');
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
router.post('/restock', auth, roleCheck(['admin', 'inventory', 'manager']), audit('inventory'), async (req, res) => {
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

// Manual Stock Adjustment
router.post('/adjust', auth, roleCheck(['admin', 'inventory', 'manager']), audit('inventory'), async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { productId, quantity, reason } = req.body;
    const product = await Product.findByPk(productId, { transaction });
    if (!product) throw new Error('Product not found');

    const newStock = Math.max(product.stock + parseInt(quantity), 0);
    const difference = newStock - product.stock;

    await product.update({ stock: newStock }, { transaction });
    await StockLog.create({
      productId,
      userId: req.user.id,
      change: difference,
      type: 'adjustment',
      notes: reason || 'manual adjustment'
    }, { transaction });

    await transaction.commit();
    res.json({ message: 'Stock adjusted successfully', stock: product.stock });
  } catch (err) {
    await transaction.rollback();
    res.status(400).json({ message: err.message });
  }
});

// Get Stock logs
router.get('/logs', auth, async (req, res) => {
  try {
    const logs = await StockLog.findAll({
      include: [Product, User],
      order: [['createdAt', 'DESC']]
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Bulk Import Products (CSV parsing support on backend)
router.post('/import', auth, roleCheck(['admin', 'inventory', 'manager']), audit('inventory'), async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Invalid items array' });
    }

    // Helper functions for backend sanitization
    const cleanNumber = (val) => {
      if (val === undefined || val === null || val === '') return 0;
      const cleaned = String(val).replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const cleanInt = (val) => {
      if (val === undefined || val === null || val === '') return 0;
      const cleaned = String(val).replace(/[^0-9.-]/g, '');
      const parsed = parseInt(cleaned, 10);
      return isNaN(parsed) ? 0 : parsed;
    };

    const cleanDate = (val) => {
      if (!val) return null;
      const trimmed = String(val).trim().toLowerCase();
      if (trimmed === '' || trimmed === 'n/a' || trimmed === 'none' || trimmed === 'null' || trimmed === 'undefined') {
        return null;
      }
      const date = new Date(val);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date.toISOString().split('T')[0];
    };

    // Load categories to support name-based mapping on the backend
    const categories = await Category.findAll({ transaction });
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name.toLowerCase().trim()] = cat.id;
      categoryMap[cat.id.toLowerCase().trim()] = cat.id;
    });

    const imported = [];
    let createdCount = 0;
    let updatedCount = 0;

    for (const item of items) {
      if (!item.name) continue;

      // Resolve category
      let categoryId = null;
      const categoryRaw = item.categoryId || item.category || '';
      if (categoryRaw) {
        const catVal = String(categoryRaw).trim().toLowerCase();
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(catVal)) {
          categoryId = catVal;
        } else if (categoryMap[catVal]) {
          categoryId = categoryMap[catVal];
        }
      }

      // Normalize storeType
      const storeTypeRaw = String(item.storeType || item.storetype || 'department').toLowerCase().trim();
      const storeType = 'department';

      // Generate or normalize SKU
      const sku = (item.sku || '').trim() || `SKU-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      // Upsert product based on SKU
      let prod = await Product.findOne({ where: { sku }, transaction });
      if (prod) {
        await prod.update({
          name: item.name,
          price: cleanNumber(item.price),
          costPrice: cleanNumber(item.costPrice || item.cost),
          stock: cleanInt(item.stock),
          categoryId,
          expiryDate: cleanDate(item.expiryDate || item.expiry),
          manufacturer: item.manufacturer || item.company || null,
          storeType
        }, { transaction });
        updatedCount++;
      } else {
        prod = await Product.create({
          name: item.name,
          sku,
          price: cleanNumber(item.price),
          costPrice: cleanNumber(item.costPrice || item.cost),
          stock: cleanInt(item.stock),
          categoryId,
          expiryDate: cleanDate(item.expiryDate || item.expiry),
          manufacturer: item.manufacturer || item.company || null,
          storeType
        }, { transaction });
        createdCount++;
      }
      imported.push(prod);
    }

    await transaction.commit();
    res.json({ 
      message: `Successfully processed ${imported.length} products (${createdCount} created, ${updatedCount} updated)`, 
      products: imported 
    });
  } catch (err) {
    await transaction.rollback();
    res.status(400).json({ message: err.message });
  }
});

// Get all products raw for CSV export
router.get('/export', auth, roleCheck(['admin', 'inventory', 'manager']), async (req, res) => {
  try {
    const products = await Product.findAll({ include: [Category] });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Predictive restock analysis
router.get('/predictive', auth, async (req, res) => {
  try {
    const products = await Product.findAll();
    
    const suggestions = products.map(p => {
      const dailySalesRate = p.stock < 15 ? 2.5 : 1.2;
      const daysLeft = Math.ceil(p.stock / dailySalesRate);
      const orderNeeded = daysLeft <= 4;
      
      return {
        id: p.id,
        name: p.name,
        stock: p.stock,
        dailySalesRate,
        daysLeft,
        orderNeeded,
        suggestedQty: orderNeeded ? 50 : 0
      };
    });
    
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Auto-generate Purchase Orders based on predictive suggestions
router.post('/auto-po', auth, roleCheck(['admin', 'inventory', 'manager']), audit('inventory'), async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const products = await Product.findAll({ transaction });
    const suggestions = products.map(p => {
      const dailySalesRate = p.stock < 15 ? 2.5 : 1.2;
      const daysLeft = Math.ceil(p.stock / dailySalesRate);
      const orderNeeded = daysLeft <= 4;
      return { product: p, dailySalesRate, daysLeft, orderNeeded, suggestedQty: orderNeeded ? 50 : 0 };
    }).filter(s => s.orderNeeded);

    if (suggestions.length === 0) {
      await transaction.rollback();
      return res.status(200).json({ message: 'No items require ordering' });
    }

    // Group suggestions by supplier — attempt to match supplier by product.storeType -> supplier.category
    const suppliers = await Supplier.findAll({ transaction });
    const bySupplier = {};

    for (const s of suggestions) {
      const prod = s.product;
      let chosen = suppliers.find(sp => sp.category && prod.storeType && sp.category.toLowerCase() === prod.storeType.toLowerCase());
      if (!chosen) chosen = suppliers[0]; // fallback to first supplier
      if (!chosen) throw new Error('No suppliers found to assign Purchase Orders');

      if (!bySupplier[chosen.id]) bySupplier[chosen.id] = { supplier: chosen, items: [] };
      bySupplier[chosen.id].items.push({ product: prod, qty: s.suggestedQty, unitCost: parseFloat(prod.costPrice || 0) });
    }

    const createdOrders = [];
    for (const supId of Object.keys(bySupplier)) {
      const group = bySupplier[supId];
      const totalAmount = group.items.reduce((sum, it) => sum + (it.qty * it.unitCost), 0);

      const order = await PurchaseOrder.create({
        supplierId: group.supplier.id,
        totalAmount: totalAmount.toFixed(2),
        notes: 'Auto-generated PO from predictive restock',
        status: 'pending'
      }, { transaction });

      for (const it of group.items) {
        await POItem.create({
          purchaseOrderId: order.id,
          productId: it.product.id,
          quantity: it.qty,
          unitCost: it.unitCost
        }, { transaction });
      }

      createdOrders.push(order);
    }

    await transaction.commit();
    res.status(201).json({ message: 'Purchase Orders created', orders: createdOrders });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ message: err.message });
  }
});

// Get Auto-discount expiring list
router.get('/auto-discount', auth, async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const today = new Date();
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);

    const expiring = await Product.findAll({
      where: {
        expiryDate: {
          [Op.between]: [today, fiveDaysFromNow]
        }
      }
    });

    const discounted = expiring.map(p => {
      const promoPrice = parseFloat((p.price * 0.5).toFixed(2));
      return {
        id: p.id,
        name: p.name,
        originalPrice: p.price,
        promoPrice,
        daysToExpiry: Math.ceil((new Date(p.expiryDate) - today) / (1000 * 60 * 60 * 24))
      };
    });

    res.json(discounted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
