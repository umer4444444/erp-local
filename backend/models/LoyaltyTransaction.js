const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoyaltyTransaction = sequelize.define('LoyaltyTransaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('earn', 'redeem'),
    allowNull: false,
  },
  saleId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = LoyaltyTransaction;
