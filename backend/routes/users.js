const express = require('express');
const { User, Employee } = require('../models');
const { auth, roleCheck } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const audit = require('../middleware/audit');
const router = express.Router();

// Get all users (Admin only)
router.get('/', auth, roleCheck(['admin', 'manager']), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['passwordHash'] },
      include: [{ model: Employee, attributes: ['firstName', 'lastName', 'position'] }]
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new user (Admin only)
router.post('/', auth, roleCheck(['admin', 'manager']), async (req, res) => {
  try {
    const { name, email, phone, role, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password || 'password123', salt);

    const newUser = await User.create({
      name, email, phone, role, passwordHash
    });

    // Return without passwordHash
    const userRes = newUser.toJSON();
    delete userRes.passwordHash;

    res.status(201).json(userRes);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update user role/permissions (Admin only)
router.put('/:id/role', auth, roleCheck(['admin', 'manager']), async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Protect super admin
    if (user.role === 'admin' && role !== 'admin') {
      return res.status(403).json({ message: 'Cannot demote super admin' });
    }

    await user.update({ role });
    res.json({ message: 'Role updated successfully', user: { id: user.id, role: user.role } });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Toggle User status (Active / Inactive)
router.put('/:id/status', auth, roleCheck(['admin', 'manager']), audit('users'), async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'admin' && !isActive) {
      return res.status(403).json({ message: 'Cannot deactivate super admin' });
    }

    await user.update({ isActive });
    res.json({ message: 'User status updated successfully', user: { id: user.id, isActive: user.isActive } });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete user (Admin only)
router.delete('/:id', auth, roleCheck(['admin', 'manager']), audit('users'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete super admin' });
    }

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
