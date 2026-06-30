const express = require('express');
const { Ride, User, Bid, sequelize } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');
const socketHelper = require('../socket');
const router = express.Router();

// ─── GET /rides/drivers — list users who can act as drivers ───────────────
router.get('/drivers', auth, async (req, res) => {
  try {
    const drivers = await User.findAll({
      where: {
        role: { [Op.in]: ['driver', 'admin', 'manager'] },
        isActive: { [Op.ne]: false }
      },
      attributes: ['id', 'name', 'email', 'role']
    });
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /rides — get active (non-completed/cancelled) rides ──────────────
router.get('/', auth, async (req, res) => {
  try {
    const rides = await Ride.findAll({
      where: {
        status: {
          [Op.notIn]: ['completed', 'cancelled', 'delivered', 'failed']
        }
      },
      include: [
        { model: User, as: 'Rider', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'Driver', attributes: ['id', 'name', 'email'] },
        { model: Bid }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(rides);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /rides/all — get all rides including completed ───────────────────
router.get('/all', auth, async (req, res) => {
  try {
    const rides = await Ride.findAll({
      include: [
        { model: User, as: 'Rider', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'Driver', attributes: ['id', 'name', 'email'] },
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(rides);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /rides — create delivery/ride ──────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const ride = await Ride.create({
      ...req.body,
      riderId: req.user.id,
      status: req.body.status || 'pending'
    });

    const io = socketHelper.getIo();
    if (io) io.emit('newRideRequest', ride);

    res.status(201).json(ride);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─── POST /rides/:id/bid — place bid ──────────────────────────────────────
router.post('/:id/bid', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const bid = await Bid.create({
      rideId: req.params.id,
      driverId: req.user.id,
      amount
    });

    const io = socketHelper.getIo();
    if (io) io.emit('newBidPlaced', bid);

    res.status(201).json(bid);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─── PUT /rides/:id/assign — assign driver (was POST, fixed to PUT) ───────
router.put('/:id/assign', auth, async (req, res) => {
  try {
    const { driverId } = req.body;
    const ride = await Ride.findByPk(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride/Delivery not found' });

    await ride.update({ driverId, status: 'assigned' });

    const io = socketHelper.getIo();
    if (io) io.emit('rideStatusUpdated', { rideId: ride.id, status: 'assigned', driverId });

    // Return with driver info
    const updated = await Ride.findByPk(ride.id, {
      include: [
        { model: User, as: 'Driver', attributes: ['id', 'name', 'email'] }
      ]
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─── PUT /rides/:id/status — update delivery status (was POST, fixed to PUT)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const ride = await Ride.findByPk(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride/Delivery not found' });

    await ride.update({ status });

    const io = socketHelper.getIo();
    if (io) io.emit('rideStatusUpdated', { rideId: ride.id, status });

    res.json(ride);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─── POST /rides/:id/complete — legacy complete endpoint ──────────────────
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const ride = await Ride.findByPk(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    await ride.update({ status: 'completed' });

    const io = socketHelper.getIo();
    if (io) io.emit('rideStatusUpdated', { rideId: ride.id, status: 'completed' });

    res.json(ride);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
