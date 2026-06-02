const express = require('express');
const { Sale, SalesSession, Employee, Department, Designation, User, Attendance, Leave } = require('../models');
const { auth, roleCheck } = require('../middleware/auth');
const { Op } = require('sequelize');
const router = express.Router();

// ─── GET /api/manager/overview ────────────────────────────────────────────────
// Monthly revenue + today's transaction count + active sessions
router.get('/overview', auth, roleCheck(['admin', 'manager']), async (req, res) => {
  try {
    const startOfCycle = new Date();
    startOfCycle.setDate(1);
    startOfCycle.setHours(0, 0, 0, 0);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [salesCycle, salesToday, activeSessions, pendingLeaves] = await Promise.all([
      Sale.findAll({ where: { createdAt: { [Op.gte]: startOfCycle }, status: 'active' } }),
      Sale.count({ where: { createdAt: { [Op.gte]: startOfDay }, status: 'active' } }),
      SalesSession.count({ where: { status: 'active' } }),
      Leave.count({ where: { status: 'pending' } }),
    ]);

    const revenue = salesCycle.reduce((sum, s) => sum + parseFloat(s.grandTotal || 0), 0);

    res.json({
      revenue,
      salesCount: salesToday || 0,
      activeStaff: activeSessions || 0,
      pendingLeaves: pendingLeaves || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/manager/sales-today ────────────────────────────────────────────
// Today's sales total, count, per-cashier breakdown, last 10 transactions
router.get('/sales-today', auth, roleCheck(['admin', 'manager']), async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const sales = await Sale.findAll({
      where: { createdAt: { [Op.gte]: startOfDay }, status: 'active' },
      include: [{ model: User, attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']],
    });

    // Group by cashier
    const byCashier = {};
    sales.forEach(s => {
      const key = s.User?.name || 'Unknown';
      if (!byCashier[key]) byCashier[key] = { name: key, count: 0, revenue: 0 };
      byCashier[key].count++;
      byCashier[key].revenue += parseFloat(s.grandTotal || 0);
    });

    const totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s.grandTotal || 0), 0);

    res.json({
      totalRevenue,
      totalCount: sales.length,
      byCashier: Object.values(byCashier).sort((a, b) => b.revenue - a.revenue),
      recent: sales.slice(0, 12).map(s => ({
        id: s.id,
        grandTotal: s.grandTotal,
        paymentMethod: s.paymentMethod,
        cashier: s.User?.name || 'Unknown',
        createdAt: s.createdAt,
        status: s.status,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/manager/leaves/pending ─────────────────────────────────────────
// All pending leave requests for manager approval
router.get('/leaves/pending', auth, roleCheck(['admin', 'manager']), async (req, res) => {
  try {
    const leaves = await Leave.findAll({
      where: { status: 'pending' },
      include: [{
        model: Employee,
        attributes: ['id', 'firstName', 'lastName', 'position'],
      }],
      order: [['createdAt', 'ASC']],
    });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PUT /api/manager/leaves/:id ─────────────────────────────────────────────
// Approve or reject a leave request
router.put('/leaves/:id', auth, roleCheck(['admin', 'manager']), async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }
    const leave = await Leave.findByPk(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });
    await leave.update({ status, rejectionReason: rejectionReason || null, approvedBy: req.user.id });
    res.json(leave);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─── GET /api/manager/staff/active ───────────────────────────────────────────
// Staff currently clocked in (no clockOut yet today)
router.get('/staff/active', auth, roleCheck(['admin', 'manager']), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const active = await Attendance.findAll({
      where: {
        clockIn: { [Op.gte]: today },
        clockOut: null,
      },
      include: [{
        model: Employee,
        attributes: ['id', 'firstName', 'lastName', 'position'],
        include: [{ model: Department, attributes: ['name'] }],
      }],
      order: [['clockIn', 'ASC']],
    });

    res.json(active);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/manager/employees ──────────────────────────────────────────────
router.get('/employees', auth, roleCheck(['admin', 'manager']), async (req, res) => {
  try {
    const employees = await Employee.findAll({
      include: [
        { model: User,        attributes: ['id', 'name', 'email', 'role'] },
        { model: Department,  attributes: ['id', 'name'] },
        { model: Designation, attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
