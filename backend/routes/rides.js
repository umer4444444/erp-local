const express = require('express');
const { Ride, User, Bid, sequelize } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');
const socketHelper = require('../socket');
const router = express.Router();

// Get active rides
router.get('/', auth, async (req, res) => {
  try {
    const rides = await Ride.findAll({
      where: { status: { [Op.ne]: 'completed' } },
      include: [{ model: User, as: 'Rider' }, { model: User, as: 'Driver' }, { model: Bid }]
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
      status: 'requested'
    });
    
    // Broadcast new ride request in real-time
    const io = socketHelper.getIo();
    if (io) {
      io.emit('newRideRequest', ride);
    }
    
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
    
    // Notify about new bid
    const io = socketHelper.getIo();
    if (io) {
      io.emit('newBidPlaced', bid);
    }
    
    res.status(201).json(bid);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Assign driver to ride
router.post('/:id/assign', auth, async (req, res) => {
  try {
    const { driverId } = req.body;
    const ride = await Ride.findByPk(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride/Delivery not found' });

    await ride.update({
      driverId,
      status: 'accepted'
    });

    const io = socketHelper.getIo();
    if (io) {
      io.emit('rideStatusUpdated', { rideId: ride.id, status: 'accepted', driverId });
    }

    res.json(ride);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update delivery status
router.post('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body; // accepted, in_progress, completed, cancelled
    const ride = await Ride.findByPk(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride/Delivery not found' });

    await ride.update({ status });

    const io = socketHelper.getIo();
    if (io) {
      io.emit('rideStatusUpdated', { rideId: ride.id, status });
    }

    res.json(ride);
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

    const io = socketHelper.getIo();
    if (io) {
      io.emit('rideStatusUpdated', { rideId: ride.id, status: 'completed' });
    }

    res.json(ride);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
