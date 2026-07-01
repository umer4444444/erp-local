const uuidv7 = () => require('crypto').randomUUID();
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SalesSession = sequelize.define('SalesSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: uuidv7,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endTime: {
    type: DataTypes.DATE,
  },
  totalHours: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
  },
  earnings: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  cashCount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('active', 'completed'),
    defaultValue: 'active',
  },
}, {
  tableName: 'sales_sessions',
  freezeTableName: true,
  timestamps: true,
  underscored: false,
  timestamps: true,
});

module.exports = SalesSession;
