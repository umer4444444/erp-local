const { v7: uuidv7 } = require('uuid');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PurchaseOrder = sequelize.define('PurchaseOrder', {
  id: {
    type: DataTypes.UUID,
    defaultValue: uuidv7,
    primaryKey: true,
  },
  supplierId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  orderDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  totalAmount: {
    type: DataTypes.DECIMAL(12, 2),
  },
  status: {
    type: DataTypes.ENUM('pending', 'ordered', 'received', 'cancelled'),
    defaultValue: 'pending',
  },
  receivedDate: {
    type: DataTypes.DATE,
  },
  receivedByUserId: {
    type: DataTypes.UUID,
  },
  stockUpdated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  notes: {
    type: DataTypes.TEXT,
  }
}, {
  timestamps: true,
});

module.exports = PurchaseOrder;
