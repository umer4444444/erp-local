const { v7: uuidv7 } = require('uuid');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Bid = sequelize.define('Bid', {
  id: {
    type: DataTypes.UUID,
    defaultValue: uuidv7,
    primaryKey: true,
  },
  rideId: {
    type: DataTypes.UUID,
  },
  driverId: {
    type: DataTypes.UUID,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    defaultValue: 'pending',
  },
}, {
  timestamps: true,
});

module.exports = Bid;
