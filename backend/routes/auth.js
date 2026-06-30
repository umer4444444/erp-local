const express = require('express');
const { User } = require('../models');
const { auth } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    const supplied = (password || '').trim();

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatches = await user.comparePassword(supplied);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact administration.' });
    }

    // Transparent re-hash if cost factor < 12
    const rounds = bcrypt.getRounds(user.passwordHash);
    if (rounds < 12) {
      const newHash = await bcrypt.hash(supplied, 12);
      await user.update({ passwordHash: newHash });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'Name, email, phone and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with that email already exists' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    const newUser = await User.create({ name, email, phone, role: 'cashier', passwordHash });

    const token = jwt.sign({ id: newUser.id, role: newUser.role }, process.env.JWT_SECRET);
    const user = newUser.toJSON();
    delete user.passwordHash;

    res.status(201).json({ token, user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/logout', auth, async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
