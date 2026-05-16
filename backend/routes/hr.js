const express = require('express');
const { Employee, User, Leave, Attendance, sequelize } = require('../models');
const bcrypt = require('bcryptjs');
const { auth, roleCheck } = require('../middleware/auth');
const router = express.Router();

// Get all employees
router.get('/', auth, roleCheck(['admin', 'hr', 'manager']), async (req, res) => {
  try {
    const employees = await Employee.findAll();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create an employee (Hiring)
router.post('/', auth, roleCheck(['admin', 'hr', 'manager']), async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const employee = await Employee.create(req.body, { transaction });
    let user = await User.findOne({ where: { email: employee.email } });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('staff123', salt);
      let role = 'cashier';
      const pos = employee.position.toLowerCase();
      if (pos.includes('admin')) role = 'admin';
      else if (pos.includes('manager')) role = 'manager';
      else if (pos.includes('inventory') || pos.includes('stock')) role = 'inventory';
      else if (pos.includes('hr')) role = 'hr';

      await User.create({
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
        phone: `EMP-${Date.now()}`,
        passwordHash,
        role
      }, { transaction });
    }
    await transaction.commit();
    res.status(201).json(employee);
  } catch (err) {
    await transaction.rollback();
    res.status(400).json({ message: err.message });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const employees = await Employee.findAll();
    const pendingLeaves = await Leave.count({ where: { status: 'pending' } });
    const unverifiedShifts = await Attendance.count({ where: { clockOut: null } });
    
    let estPayroll = 0;
    employees.forEach(e => {
      if (e.status === 'active') {
        estPayroll += parseFloat(e.salary || 0);
      }
    });

    res.json({
      totalEmployees: employees.length,
      activeEmployees: employees.filter(e => e.status === 'active').length,
      pendingLeaves,
      unverifiedShifts,
      estPayroll,
      avgHours: 40
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
