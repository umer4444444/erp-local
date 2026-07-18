const uuidv7 = () => require('crypto').randomUUID();
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sale = sequelize.define('Sale', {
  id: {
    type: DataTypes.UUID,
    defaultValue: uuidv7,
    primaryKey: true,
  },
  customerId: {
    type: DataTypes.UUID,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  totalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  discount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  tax: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  grandTotal: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'card', 'credit', 'split'),
    defaultValue: 'cash',
  },
  cashAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  cardAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('active', 'voided', 'refunded', 'held'),
    defaultValue: 'active',
  },
  voidReason: {
    type: DataTypes.STRING,
  },
  discountType: {
    type: DataTypes.ENUM('flat', 'percent'),
    defaultValue: 'flat',
  },
  extraCharges: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  extraChargeReason: {
    type: DataTypes.STRING,
  },
  creditReason: {
    type: DataTypes.STRING,
  },
  customerName: {
    type: DataTypes.STRING,
  },
  customerPhone: {
    type: DataTypes.STRING,
  },
  cashierName: {
    type: DataTypes.STRING,
  },
  notes: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'sales',
  freezeTableName: true,
  timestamps: true,
  underscored: false,
  timestamps: true,
});

module.exports = Sale;
