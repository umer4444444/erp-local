const express = require('express');
const { Ride, User, Bid, sequelize } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');
const router = express.Router();

// Get active rides
router.get('/', auth, async (req, res) => {
  try {
    const rides = await Ride.findAll({
      where: { status: 'active' },
      include: [{ model: User, as: 'Rider' }, { model: Bid }]
    });
    res.json(rides);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create ride
router.post('/', auth, async (req, res) => {
  try {
    const ride = await Ride.create({
      ...req.body,
      riderId: req.user.id,
      status: 'active'
    });
    res.status(201).json(ride);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Place bid
router.post('/:id/bid', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const bid = await Bid.create({
      rideId: req.params.id,
      driverId: req.user.id,
      amount
    });
    res.status(201).json(bid);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Complete ride
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const ride = await Ride.findByPk(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    await ride.update({ status: 'completed' });
    res.json(ride);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
