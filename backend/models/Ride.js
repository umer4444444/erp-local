const { v7: uuidv7 } = require('uuid');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ride = sequelize.define('Ride', {
  id: {
    type: DataTypes.UUID,
    defaultValue: uuidv7,
    primaryKey: true,
  },
  riderId: {
    type: DataTypes.UUID,
  },
  driverId: {
    type: DataTypes.UUID,
  },
  pickupLocation: {
    type: DataTypes.STRING,
  },
  dropoffLocation: {
    type: DataTypes.STRING,
  },
  // Delivery-specific fields
  customerName: {
    type: DataTypes.STRING,
  },
  customerPhone: {
    type: DataTypes.STRING,
  },
  deliveryAddress: {
    type: DataTypes.STRING,
  },
  notes: {
    type: DataTypes.TEXT,
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    defaultValue: 'normal',
  },
  status: {
    type: DataTypes.ENUM(
      'requested', 'bidding', 'accepted', 'in_progress', 'completed', 'cancelled',
      // Delivery workflow statuses
      'pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed'
    ),
    defaultValue: 'pending',
  },
  fare: {
    type: DataTypes.DECIMAL(10, 2),
  },
}, {
  timestamps: true,
});

module.exports = Ride;
