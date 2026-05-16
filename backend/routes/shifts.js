const express = require('express');
const { SalesSession, Employee, User } = require('../models');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Get active session
router.get('/active', auth, async (req, res) => {
  try {
    const session = await SalesSession.findOne({ 
      where: { userId: req.user.id, status: 'active' } 
    });
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Start session
router.post('/start', auth, async (req, res) => {
  try {
    const existing = await SalesSession.findOne({ where: { userId: req.user.id, status: 'active' } });
    if (existing) return res.status(400).json({ message: 'Session already active' });
    
    const session = await SalesSession.create({
      userId: req.user.id,
      startTime: new Date(),
      status: 'active'
    });
    res.status(201).json(session);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// End session
router.post('/end', auth, async (req, res) => {
  try {
    const session = await SalesSession.findOne({ where: { userId: req.user.id, status: 'active' } });
    if (!session) return res.status(404).json({ message: 'No active session' });
    
    const endTime = new Date();
    const durationHours = (endTime - session.startTime) / (1000 * 60 * 60);
    
    // Calculate earnings
    const employee = await Employee.findOne({ where: { userId: req.user.id } });
    let earnings = 0;
    if (employee && employee.salaryType === 'hourly') {
      earnings = durationHours * parseFloat(employee.salary || 0);
    }

    await session.update({
      endTime,
      status: 'completed',
      totalHours: durationHours.toFixed(2),
      earnings: earnings.toFixed(2)
    });
    res.json(session);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const sessions = await SalesSession.findAll({ 
      where: req.user.role === 'admin' ? {} : { userId: req.user.id },
      include: [User],
      order: [['createdAt', 'DESC']] 
    });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
