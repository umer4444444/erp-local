const express = require('express');
const { Attendance, Employee, WorkShift, User } = require('../models');
const { auth, roleCheck } = require('../middleware/auth');
const { Op } = require('sequelize');
const router = express.Router();
const socket = require('../socket');

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const phi1 = lat1 * Math.PI/180;
  const phi2 = lat2 * Math.PI/180;
  const deltaPhi = (lat2-lat1) * Math.PI/180;
  const deltaLambda = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
}

// Clock In
router.post('/clockin', auth, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    // Strict GPS Fence: 100 meters from office/store location
    const OFFICE_LAT = 31.571398336628878;
    const OFFICE_LNG = 74.41214762086345;
    const MAX_DISTANCE_M = 100;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'GPS coordinates are required to clock in.' });
    }

    const distance = getDistance(parseFloat(latitude), parseFloat(longitude), OFFICE_LAT, OFFICE_LNG);
    if (distance > MAX_DISTANCE_M) {
      return res.status(400).json({ message: `You are not within the 100-meter office geofence. Distance: ${distance.toFixed(0)}m` });
    }

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

    // Calculate late minutes
    let lateMinutes = 0;
    let status = 'present';
    const now = new Date();
    
    // Find employee's shift
    let shift = null;
    if (employee.workShiftId) {
      shift = await WorkShift.findByPk(employee.workShiftId);
    } else {
      shift = await WorkShift.findOne(); // Fallback to first shift
    }
    
    if (shift) {
      const [sh, sm, ss] = shift.startTime.split(':').map(Number);
      const shiftStartTimeToday = new Date();
      shiftStartTimeToday.setHours(sh, sm, ss || 0, 0);
      
      if (now > shiftStartTimeToday) {
        const diffMs = now - shiftStartTimeToday;
        lateMinutes = Math.floor(diffMs / (1000 * 60));
        if (lateMinutes > 0) {
          status = 'late';
        }
      }
    } else {
      // Default to 9:00 AM start
      const shiftStartTimeToday = new Date();
      shiftStartTimeToday.setHours(9, 0, 0, 0);
      if (now > shiftStartTimeToday) {
        const diffMs = now - shiftStartTimeToday;
        lateMinutes = Math.floor(diffMs / (1000 * 60));
        if (lateMinutes > 0) {
          status = 'late';
        }
      }
    }

    const attendance = await Attendance.create({
      employeeId: employee.id,
      clockIn: now,
      status,
      lateMinutes,
      latitude,
      longitude,
      workShiftId: shift ? shift.id : null
    });

    // Emit real‑time staff engagement update
    const activeCount = await Attendance.count({ where: { clockOut: null } });
    const io = socket.getIo();
    if (io) io.emit('staffEngagementUpdated', { activeStaff: activeCount });

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

    const now = new Date();
    let earlyMinutes = 0;

    let shift = null;
    if (attendance.workShiftId) {
      shift = await WorkShift.findByPk(attendance.workShiftId);
    }
    if (shift) {
      const [eh, em, es] = shift.endTime.split(':').map(Number);
      const shiftEnd = new Date();
      shiftEnd.setHours(eh, em, es || 0, 0);
      if (now < shiftEnd) {
        earlyMinutes = Math.floor((shiftEnd - now) / (1000 * 60));
      }
    }

    await attendance.update({ clockOut: now, earlyMinutes });

    // Emit real‑time staff engagement update after clock‑out
    const activeCount = await Attendance.count({ where: { clockOut: null } });
    const io = socket.getIo();
    if (io) io.emit('staffEngagementUpdated', { activeStaff: activeCount });

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

    // Emit update for manager dashboards (optional – keeps client in sync)
    const io = socket.getIo();
    if (io) io.emit('staffEngagementUpdated', { activeStaff: active.length });
    res.json(active);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get my attendance history (past records)
router.get('/my-history', auth, async (req, res) => {
  try {
    let employee = await Employee.findOne({ where: { userId: req.user.id } });
    if (!employee) return res.json([]);

    const { page = 1, limit = 30 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const records = await Attendance.findAll({
      where: { employeeId: employee.id, clockOut: { [Op.ne]: null } },
      order: [['clockIn', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    res.json(records);
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
