const express = require('express');
const { Leave, LeaveBalance, Employee, User } = require('../models');
const { auth, roleCheck } = require('../middleware/auth');
const router = express.Router();

// Apply for leave
router.post('/apply', auth, async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body;
    let employee = await Employee.findOne({ where: { userId: req.user.id } });
    if (!employee) {
      const user = await User.findByPk(req.user.id);
      employee = await Employee.create({
        firstName: user.name?.split(' ')[0] || 'Staff',
        lastName: user.name?.split(' ').slice(1).join(' ') || 'User',
        email: user.email,
        userId: user.id,
        position: user.role?.toUpperCase() || 'STAFF',
        status: 'active'
      });
    }

    // Calculate days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const leave = await Leave.create({
      employeeId: employee.id,
      type,
      startDate,
      endDate,
      days: diffDays,
      reason
    });

    res.status(201).json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get my leave history
router.get('/my', auth, async (req, res) => {
  try {
    const employee = await Employee.findOne({ where: { userId: req.user.id } });
    if (!employee) return res.json([]);
    const leaves = await Leave.findAll({ 
      where: { employeeId: employee.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get pending leaves for approval
router.get('/pending', auth, roleCheck(['admin', 'manager', 'hr']), async (req, res) => {
  try {
    const leaves = await Leave.findAll({
      where: { status: 'pending' },
      include: [{ model: Employee, include: [User] }]
    });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve/Reject
router.put('/:id/status', auth, roleCheck(['admin', 'manager', 'hr']), async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const leave = await Leave.findByPk(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });

    await leave.update({ 
      status, 
      rejectionReason, 
      approvedBy: req.user.id 
    });

    // If approved, update leave balance (simplified logic)
    if (status === 'approved') {
      const balance = await LeaveBalance.findOne({ 
        where: { employeeId: leave.employeeId, type: leave.type } 
      });
      if (balance) {
        await balance.update({ used: parseFloat(balance.used) + parseFloat(leave.days) });
      }
    }

    res.json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
