const express = require('express');
const { Attendance, Employee, WorkShift, User } = require('../models');
const { auth, roleCheck } = require('../middleware/auth');
const { Op } = require('sequelize');
const router = express.Router();

// Clock In
router.post('/clockin', auth, async (req, res) => {
  try {
    let employee = await Employee.findOne({ where: { userId: req.user.id } });
    
    if (!employee) {
      // Fallback: Create a basic employee profile if it's missing for some reason
      const user = await User.findByPk(req.user.id);
      employee = await Employee.create({
        firstName: user.name?.split(' ')[0] || 'Staff',
        lastName: user.name?.split(' ').slice(1).join(' ') || 'User',
        email: user.email,
        userId: user.id,
        position: user.role?.toUpperCase() || 'STAFF',
        status: 'active'
      });
      console.log(`Auto-created missing employee profile for ${user.email}`);
    }

    // Check if already clocked in today (Strict: No clockOut for this employee)
    const existing = await Attendance.findOne({
      where: { 
        employeeId: employee.id, 
        clockOut: null 
      }
    });

    if (existing) {
      return res.status(400).json({ message: 'Already clocked in' });
    }

    const attendance = await Attendance.create({
      employeeId: employee.id,
      clockIn: new Date(),
      status: 'present'
    });

    res.status(201).json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Clock Out
router.post('/clockout', auth, async (req, res) => {
  try {
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

    const attendance = await Attendance.findOne({
      where: { employeeId: employee.id, clockOut: null },
      order: [['clockIn', 'DESC']]
    });
    if (!attendance) return res.status(404).json({ message: 'No active clock-in found' });

    await attendance.update({ clockOut: new Date() });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get today's attendance for manager
router.get('/today', auth, async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    
    const attendance = await Attendance.findAll({
      where: { clockIn: { [Op.gte]: startOfToday } },
      include: [{ model: Employee, include: [User] }]
    });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all currently clocked-in employees (Manager View)
router.get('/active', auth, async (req, res) => {
  try {
    const active = await Attendance.findAll({
      where: { clockOut: null },
      include: [{ model: Employee, include: [User] }]
    });
    res.json(active);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get my active clock-in
router.get('/my-active', auth, async (req, res) => {
  try {
    let employee = await Employee.findOne({ where: { userId: req.user.id } });
    if (!employee) return res.json(null);

    const active = await Attendance.findOne({
      where: { employeeId: employee.id, clockOut: null },
      order: [['clockIn', 'DESC']]
    });
    res.json(active);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Shift Audit: Calculate hours and earnings for a period
router.get('/audit', auth, roleCheck(['admin', 'hr']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};
    if (startDate && endDate) {
      where.clockIn = { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] };
    }

    const attendance = await Attendance.findAll({
      where,
      include: [{ 
        model: Employee, 
        include: [User] 
      }],
      order: [['clockIn', 'DESC']]
    });

    const audit = attendance.map(a => {
      let hours = 0;
      let earned = 0;
      if (a.clockIn && a.clockOut) {
        hours = (new Date(a.clockOut) - new Date(a.clockIn)) / (1000 * 60 * 60);
      }
      
      // Calculate earnings if employee is hourly
      if (a.Employee?.salaryType === 'hourly') {
        earned = hours * parseFloat(a.Employee.salary || 0);
      } else if (a.Employee?.salaryType === 'monthly') {
        // For monthly, we can show a theoretical "daily" earnings based on 30 days
        const dailyRate = parseFloat(a.Employee.salary || 0) / 30;
        const hourlyRate = dailyRate / 8; // Assuming 8h workday
        earned = hours * hourlyRate;
      }

      return {
        id: a.id,
        employeeName: a.Employee?.User?.name || 'Unknown',
        empCode: a.Employee?.empCode,
        clockIn: a.clockIn,
        clockOut: a.clockOut,
        hours: parseFloat(hours.toFixed(2)),
        rate: parseFloat(a.Employee?.salary || 0),
        salaryType: a.Employee?.salaryType,
        earned: parseFloat(earned.toFixed(2)),
        status: a.status
      };
    });

    res.json(audit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
