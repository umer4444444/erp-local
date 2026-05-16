const express = require('express');
const { Expense, User } = require('../models');
const { auth, roleCheck } = require('../middleware/auth');
const router = express.Router();

// Get all expenses
router.get('/', auth, async (req, res) => {
  try {
    const expenses = await Expense.findAll({
      include: [{ model: User, attributes: ['name'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get pending expenses
router.get('/pending', auth, async (req, res) => {
  try {
    const expenses = await Expense.findAll({
      where: { status: 'pending' },
      include: [{ model: User, attributes: ['name'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add expense
router.post('/', auth, async (req, res) => {
  try {
    const { category, amount, description, date } = req.body;
    const expense = await Expense.create({
      category,
      amount,
      description,
      date,
      userId: req.user.id,
      status: 'pending' // default to pending
    });
    res.status(201).json(expense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update expense
router.put('/:id', auth, async (req, res) => {
  try {
    const { category, amount, description, date } = req.body;
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    
    // Allow update if pending or if user is admin
    if (expense.status !== 'pending' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Cannot edit processed expenses' });
    }

    await expense.update({ category, amount, description, date });
    res.json(expense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update expense status (approve/reject)
router.put('/:id/status', auth, async (req, res) => { // In a real app, you'd add roleCheck('admin') here
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    await expense.update({ status });
    res.json(expense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete expense
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    await expense.destroy();
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
