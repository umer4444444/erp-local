const { v7: uuidv7 } = require('uuid');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PayrollRun = sequelize.define('PayrollRun', {
  id: {
    type: DataTypes.UUID,
    defaultValue: uuidv7,
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
    type: DataTypes.ENUM('draft', 'processed', 'finalized'),
    defaultValue: 'draft',
  },
  totalAmount: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0,
  },
  processedBy: {
    type: DataTypes.UUID, // User ID
  },
  processedAt: {
    type: DataTypes.DATE,
  }
}, {
  timestamps: true,
  indexes: [
    { unique: true, fields: ['month', 'year'], name: 'unique_payroll_month_year' }
  ]
});

module.exports = PayrollRun;
