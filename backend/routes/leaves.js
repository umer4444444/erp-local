const express = require('express');
const { Leave, LeaveBalance, Employee, User } = require('../models');
const { auth, roleCheck } = require('../middleware/auth');
const socket = require('../socket');
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

// Approve/Reject/Withdraw - employees can withdraw their own pending leaves
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const leave = await Leave.findByPk(req.params.id, {
      include: [{ model: Employee, include: [User] }]
    });
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });

    const isOwner = leave.Employee?.userId === req.user.id;
    const isApprover = ['admin', 'manager', 'hr'].includes(req.user.role);

    // Only allow withdrawal by the owner, or approve/reject by an approver
    if (status === 'withdrawn') {
      if (!isOwner) return res.status(403).json({ message: 'You can only withdraw your own leave.' });
      if (leave.status !== 'pending') return res.status(400).json({ message: 'Only pending leaves can be withdrawn.' });
    } else {
      if (!isApprover) return res.status(403).json({ message: 'Insufficient permissions.' });
      // Block self-approval
      if (isOwner && ['approved', 'rejected'].includes(status)) {
        return res.status(403).json({ message: 'Self-approval is not permitted.' });
      }
    }

    await leave.update({ 
      status, 
      rejectionReason: rejectionReason || null,
      approvedBy: isApprover ? req.user.id : null
    });

    // If approved, update leave balance
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

// Get employee's leave history (HR/Admin/Manager only)
router.get('/employee/:id', auth, roleCheck(['admin', 'manager', 'hr']), async (req, res) => {
  try {
    const leaves = await Leave.findAll({
      where: { employeeId: req.params.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get employee's leave balance
router.get('/balance/:id', auth, async (req, res) => {
  try {
    const balance = await LeaveBalance.findAll({
      where: { employeeId: req.params.id }
    });
    res.json(balance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get my own leave balance
router.get('/my-balance', auth, async (req, res) => {
  try {
    const employee = await Employee.findOne({ where: { userId: req.user.id } });
    if (!employee) return res.json([]);
    const balance = await LeaveBalance.findAll({ where: { employeeId: employee.id } });
    res.json(balance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
