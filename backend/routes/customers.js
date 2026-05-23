const express = require('express');
const { Op } = require('sequelize');
const { Customer, Sale, SaleItem, Product, User } = require('../models');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const customers = await Customer.findAll();
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

router.post('/', auth, async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
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

router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Customer.update(req.body, { where: { id } });
    if (updated[0] === 0) return res.status(404).json({ message: 'Customer not found' });
    const customer = await Customer.findByPk(id);
    res.json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
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
