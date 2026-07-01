const uuidv7 = () => require('crypto').randomUUID();
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payslip = sequelize.define('Payslip', {
  id: {
    type: DataTypes.UUID,
    defaultValue: uuidv7,
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
    type: DataTypes.ENUM('unpaid', 'paid', 'voided'),
    defaultValue: 'unpaid',
  }
}, {
  tableName: 'payslips',
  freezeTableName: true,
  timestamps: true,
  underscored: false,
  timestamps: true,
});

module.exports = Payslip;
