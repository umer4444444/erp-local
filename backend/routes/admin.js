const express = require('express');
const fs = require('fs');
const path = require('path');
const { auth, roleCheck } = require('../middleware/auth');
const audit = require('../middleware/audit');
const router = express.Router();

const settingsPath = path.join(__dirname, '../config/settings.json');

// Stats endpoint (Legacy compatibility)
router.get('/stats', auth, roleCheck(['admin']), async (req, res) => {
  res.json({ message: 'Stats endpoint' });
});

// Admin KPI Dashboard
router.get('/dashboard', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const { Sale, Product, Attendance, Leave } = require('../models');
    const { Op } = require('sequelize');

    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);

    const [todaySalesCount, todaySalesSum, lowStockCount, activeStaffCount, pendingLeavesCount] = await Promise.all([
      Sale.count({ where: { createdAt: { [Op.gte]: startOfToday }, status: 'active' } }),
      Sale.sum('grandTotal', { where: { createdAt: { [Op.gte]: startOfToday }, status: 'active' } }),
      Product.count({ where: { stock: { [Op.lte]: 10 } } }),
      Attendance.count({ where: { clockOut: null } }),
      Leave.count({ where: { status: 'pending' } })
    ]);

    res.json({
      salesCount: todaySalesCount || 0,
      salesTotal: parseFloat(todaySalesSum || 0),
      lowStockAlerts: lowStockCount || 0,
      activeStaff: activeStaffCount || 0,
      pendingLeaves: pendingLeavesCount || 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Audit Logs
router.get('/audit', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const { AuditLog, User } = require('../models');
    const logs = await AuditLog.findAll({
      include: [{ model: User, attributes: ['name', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get System Settings
router.get('/settings', auth, roleCheck(['admin']), async (req, res) => {
  try {
    if (!fs.existsSync(settingsPath)) {
      const defaults = {
        storeName: 'Enterprise ERP',
        taxRate: 5.0,
        currency: 'USD',
        allowOfflinePOS: true
      };
      fs.writeFileSync(settingsPath, JSON.stringify(defaults, null, 2));
    }
    const data = fs.readFileSync(settingsPath, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update System Settings
router.put('/settings', auth, roleCheck(['admin']), audit('admin'), async (req, res) => {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(req.body, null, 2));
    res.json(req.body);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
