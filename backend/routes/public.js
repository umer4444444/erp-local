const express = require('express');
const { User, Product, Customer } = require('../models');

// Public router – no authentication middleware
const router = express.Router();

// GET /api/public/users – list all users (hide passwordHash)
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['passwordHash'] },
      include: [{ model: require('../models/Employee'), attributes: ['firstName', 'lastName', 'position'] }]
    });
    res.json(users);
  } catch (err) {
    console.error('Public users error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/public/products – list all products
router.get('/products', async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (err) {
    console.error('Public products error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/public/customers – list all customers
router.get('/customers', async (req, res) => {
  try {
    const customers = await Customer.findAll();
    res.json(customers);
  } catch (err) {
    console.error('Public customers error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
