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
    const { firstName, lastName, email, phone, cnic, address, departmentId, designationId, joiningDate, salaryType, salary, bankAccount, role, gender, password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const employee = await Employee.create(req.body, { transaction });
    let user = await User.findOne({ where: { email: employee.email } });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      let userRole = role || 'cashier';

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
      maleEmployees: employees.filter(e => e.status === 'active' && e.gender === 'male').length,
      femaleEmployees: employees.filter(e => e.status === 'active' && e.gender === 'female').length,
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
