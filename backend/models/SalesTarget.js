const uuidv7 = () => require('crypto').randomUUID();
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SalesTarget = sequelize.define('SalesTarget', {
  id: {
    type: DataTypes.UUID,
    defaultValue: uuidv7,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  targetAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  achievedAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  commissionRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: 'Commission percentage (e.g., 2.50)',
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: true,
  }
}, {
  tableName: 'sales_targets',
  freezeTableName: true,
  timestamps: true,
});

module.exports = SalesTarget;
