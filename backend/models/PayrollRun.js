const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PayrollRun = sequelize.define('PayrollRun', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  month: {
    type: DataTypes.INTEGER, // 1-12
    allowNull: false,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('draft', 'finalized'),
    defaultValue: 'draft',
  },
  processedBy: {
    type: DataTypes.UUID, // User ID
  },
  processedAt: {
    type: DataTypes.DATE,
  }
}, {
  timestamps: true,
});

module.exports = PayrollRun;
