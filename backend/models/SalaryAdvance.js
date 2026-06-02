const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SalaryAdvance = sequelize.define('SalaryAdvance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  deductionMonths: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  remainingAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
  approvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = SalaryAdvance;
