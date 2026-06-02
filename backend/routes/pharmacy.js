const express = require('express');
const { Drug, Prescription, PrescriptionItem, Product, User, Customer, StockLog, sequelize } = require('../models');
const { auth, roleCheck } = require('../middleware/auth');
const audit = require('../middleware/audit');
const router = express.Router();

// Get all drugs (searchable)
router.get('/drugs', auth, async (req, res) => {
  try {
    const drugs = await Drug.findAll({
      include: [Product]
    });
    res.json(drugs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload Prescription
router.post('/prescriptions', auth, async (req, res) => {
  try {
    const { customerId, doctorName, imageUrl, items } = req.body;
    const prescription = await Prescription.create({
      customerId,
      doctorName,
      imageUrl,
      status: 'pending'
    });

    if (items && items.length > 0) {
      for (const item of items) {
        await PrescriptionItem.create({
          prescriptionId: prescription.id,
          drugId: item.drugId,
          quantity: item.quantity
        });
      }
    }

    res.status(201).json(prescription);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get pending prescriptions for pharmacist
router.get('/prescriptions/pending', auth, roleCheck(['admin', 'pharmacist', 'manager']), async (req, res) => {
  try {
    const prescriptions = await Prescription.findAll({
      where: { status: 'pending' },
      include: [Customer, { model: PrescriptionItem, as: 'Items', include: [Drug] }]
    });
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Verify Prescription
router.put('/prescriptions/:id/verify', auth, roleCheck(['admin', 'pharmacist']), async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { status } = req.body;
    const prescription = await Prescription.findByPk(req.params.id, {
      include: [{ model: PrescriptionItem, as: 'Items', include: [Drug] }],
      transaction
    });

    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

    if (status === 'verified') {
      // Deduct stock for each item
      for (const item of prescription.Items) {
        const product = await Product.findByPk(item.Drug.productId, { transaction });
        if (!product || product.stock < item.quantity) {
          throw new Error(`Insufficient stock for drug: ${item.Drug.brandName}`);
        }
        await product.update({ stock: product.stock - item.quantity }, { transaction });
        
        // Log stock change
        await StockLog.create({
          productId: product.id,
          userId: req.user.id,
          change: -item.quantity,
          type: 'prescription',
          notes: 'prescription fulfillment',
          reference: prescription.id
        }, { transaction });
      }
    }

    await prescription.update({ 
      status, 
      verifiedBy: req.user.id 
    }, { transaction });

    await transaction.commit();
    res.json(prescription);
  } catch (err) {
    await transaction.rollback();
    res.status(err.message.includes('Insufficient') ? 400 : 500).json({ message: err.message });
  }
});

// Expiry warning: drugs expiring within 90 days (legacy route)
router.get('/expiry', auth, async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const today = new Date();
    const ninetyDays = new Date();
    ninetyDays.setDate(ninetyDays.getDate() + 90);

    const expiringDrugs = await Drug.findAll({
      include: [{ model: Product }]
    });
    res.json(expiringDrugs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Expiring drugs within 30 days (used by Pharmacy.jsx)
router.get('/expiring', auth, async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const today = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    // Check expiryDate on Drug itself
    const expiringDrugs = await Drug.findAll({
      where: {
        expiryDate: { [Op.between]: [today.toISOString().slice(0,10), thirtyDays.toISOString().slice(0,10)] }
      },
      include: [Product]
    });
    res.json(expiringDrugs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET recalls list from AuditLog (module='pharmacy', newValue contains batchNo)
router.get('/recalls', auth, roleCheck(['admin', 'pharmacist', 'manager']), async (req, res) => {
  try {
    const { AuditLog } = require('../models');
    const { Op } = require('sequelize');
    const recalls = await AuditLog.findAll({
      where: {
        module: 'pharmacy',
        newValue: { [Op.like]: '%batchNo%' }
      },
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    const shaped = recalls.map(r => {
      let batchNo = 'N/A'; let reason = '';
      try {
        const d = JSON.parse(r.newValue || '{}');
        batchNo = d.batchNo || batchNo;
        reason  = d.reason  || reason;
      } catch {}
      return { id: r.id, batchNo, reason, createdAt: r.createdAt };
    });
    res.json(shaped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Batch Recalls: Zero stock for a batch
router.post('/recalls', auth, roleCheck(['admin', 'pharmacist']), audit('pharmacy'), async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { batchNo, reason } = req.body;
    if (!batchNo) return res.status(400).json({ message: 'batchNo is required' });
    const drugs = await Drug.findAll({ where: { batchNo }, transaction });

    for (const drug of drugs) {
      const product = await Product.findByPk(drug.productId, { transaction });
      if (product && product.stock > 0) {
        const originalStock = product.stock;
        await product.update({ stock: 0 }, { transaction });
        await StockLog.create({
          productId: product.id,
          userId: req.user.id,
          change: -originalStock,
          type: 'adjustment',
          notes: `Batch recall: ${batchNo}. Reason: ${reason || 'unspecified'}`
        }, { transaction });
      }
    }
    await transaction.commit();
    res.json({ message: `Batch ${batchNo} recalled. Stock zeroed for ${drugs.length} drug(s).`, batchNo, reason });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ message: err.message });
  }
});

// Controlled Substances
router.get('/controlled', auth, roleCheck(['admin', 'pharmacist', 'manager']), async (req, res) => {
  try {
    // Try isControlled boolean first, fallback to schedule field
    let drugs = [];
    try {
      drugs = await Drug.findAll({ where: { isControlled: true }, include: [Product] });
    } catch {
      const { Op } = require('sequelize');
      drugs = await Drug.findAll({
        where: {
          schedule: { [Op.in]: ['Schedule II', 'Schedule III', 'Schedule IV', 'Narcotic', 'Controlled'] }
        },
        include: [Product]
      });
    }
    res.json(drugs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Patient prescription history
router.get('/patient/:id/history', auth, async (req, res) => {
  try {
    const history = await Prescription.findAll({
      where: { customerId: req.params.id },
      include: [{ model: PrescriptionItem, as: 'Items', include: [Drug] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
