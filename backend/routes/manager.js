const express = require('express');
const { Sale, SalesSession } = require('../models');
const { auth, roleCheck } = require('../middleware/auth');
const { Op } = require('sequelize');
const router = express.Router();

router.get('/overview', auth, roleCheck(['admin', 'manager']), async (req, res) => {
  try {
    const startOfCycle = new Date();
    startOfCycle.setDate(1); // Assuming current month as billing cycle
    startOfCycle.setHours(0,0,0,0);

    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);

    const [salesCycle, salesToday, activeSessions] = await Promise.all([
      Sale.findAll({ where: { createdAt: { [Op.gte]: startOfCycle }, status: 'active' } }),
      Sale.count({ where: { createdAt: { [Op.gte]: startOfDay }, status: 'active' } }),
      SalesSession.count({ where: { status: 'active' } })
    ]);

    const revenue = salesCycle.reduce((sum, s) => sum + parseFloat(s.grandTotal || 0), 0);

    res.json({
      revenue,
      salesCount: salesToday || 0,
      activeStaff: activeSessions || 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
