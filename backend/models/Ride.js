const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ride = sequelize.define('Ride', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
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
  status: {
    type: DataTypes.ENUM('requested', 'bidding', 'accepted', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'requested',
  },
  fare: {
    type: DataTypes.DECIMAL(10, 2),
  },
}, {
  timestamps: true,
});

module.exports = Ride;
