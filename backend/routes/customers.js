const express = require('express');
const { Op } = require('sequelize');
const { Customer, Sale, SaleItem, Product, User, LoyaltyTransaction } = require('../models');
const { auth } = require('../middleware/auth');
const audit = require('../middleware/audit');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const customers = await Customer.findAll();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/outstanding', auth, async (req, res) => {
  try {
    const customers = await Customer.findAll({
      where: {
        creditBalance: {
          [Op.gt]: 0
        }
      }
    });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/search', auth, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);

    const customers = await Customer.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${q}%` } },
          { email: { [Op.like]: `%${q}%` } },
          { phone: { [Op.like]: `%${q}%` } }
        ]
      }
    });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, audit('customers'), async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/loyalty/redeem', auth, audit('customers'), async (req, res) => {
  try {
    const { customerId, points, saleId } = req.body;
    const customer = await Customer.findByPk(customerId);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    
    const pts = parseInt(points);
    if (customer.loyaltyPoints < pts) {
      return res.status(400).json({ message: 'Insufficient loyalty points' });
    }
    
    await customer.update({ loyaltyPoints: customer.loyaltyPoints - pts });
    const transaction = await LoyaltyTransaction.create({
      customerId,
      points: -pts,
      type: 'redeem',
      saleId
    });
    res.json({ message: 'Points redeemed successfully', remainingPoints: customer.loyaltyPoints, transaction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/credit/pay', auth, audit('customers'), async (req, res) => {
  try {
    const { customerId, amount } = req.body;
    const customer = await Customer.findByPk(customerId);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    
    const payAmt = parseFloat(amount);
    const newBalance = Math.max(parseFloat(customer.creditBalance) - payAmt, 0);
    await customer.update({ creditBalance: newBalance });
    res.json({ message: 'Credit payment recorded', remainingBalance: customer.creditBalance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/transactions', auth, async (req, res) => {
  try {
    const transactions = await LoyaltyTransaction.findAll({
      where: { customerId: req.params.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/history', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const history = await Sale.findAll({
      where: { customerId: id },
      include: [
        { model: SaleItem, as: 'Items', include: [Product] },
        { model: User, attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, audit('customers'), async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Customer.update(req.body, { where: { id } });
    if (updated[0] === 0) return res.status(404).json({ message: 'Customer not found' });
    
    // Automatically recalculate Tier based on loyalty points if updated
    const customer = await Customer.findByPk(id);
    let tier = 'Bronze';
    if (customer.loyaltyPoints >= 1000) tier = 'VIP';
    else if (customer.loyaltyPoints >= 500) tier = 'Gold';
    else if (customer.loyaltyPoints >= 200) tier = 'Silver';
    await customer.update({ tier });

    res.json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', auth, audit('customers'), async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Customer.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ message: 'Customer not found' });
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
