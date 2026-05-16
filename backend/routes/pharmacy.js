const express = require('express');
const { Drug, Prescription, PrescriptionItem, Product, User, Customer } = require('../models');
const { auth, roleCheck } = require('../middleware/auth');
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
          reason: 'prescription',
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

module.exports = router;
