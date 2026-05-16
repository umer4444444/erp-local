const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Drug = sequelize.define('Drug', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  genericName: {
    type: DataTypes.STRING,
  },
  brandName: {
    type: DataTypes.STRING,
  },
  schedule: {
    type: DataTypes.STRING, // e.g. "Schedule H"
  },
  batchNo: {
    type: DataTypes.STRING,
  },
  manufacturer: {
    type: DataTypes.STRING,
  },
  expiryDate: {
    type: DataTypes.DATEONLY,
  }
}, {
  timestamps: true,
});

module.exports = Drug;
