const { v7: uuidv7 } = require('uuid');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PrescriptionItem = sequelize.define('PrescriptionItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: uuidv7,
    primaryKey: true,
  },
  prescriptionId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  drugId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
}, {
  timestamps: true,
});

module.exports = PrescriptionItem;
