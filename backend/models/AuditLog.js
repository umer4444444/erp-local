const uuidv7 = () => require('crypto').randomUUID();
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: uuidv7,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false, // POST, PUT, DELETE, etc.
  },
  module: {
    type: DataTypes.STRING,
    allowNull: false, // sales, inventory, payroll, etc.
  },
  recordId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  oldValue: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  newValue: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ip: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'audit_logs',
  freezeTableName: true,
  timestamps: true,
  underscored: false,
  timestamps: true,
  updatedAt: false, // Audit logs are insert-only
});

module.exports = AuditLog;
