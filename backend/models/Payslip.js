const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payslip = sequelize.define('Payslip', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  payrollRunId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  baseSalary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  allowances: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  deductions: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  netSalary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('unpaid', 'paid'),
    defaultValue: 'unpaid',
  }
}, {
  timestamps: true,
});

module.exports = Payslip;
