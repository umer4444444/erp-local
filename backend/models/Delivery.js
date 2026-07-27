const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const uuidv7 = () => require('crypto').randomUUID();

const Delivery = sequelize.define('Delivery', {
  id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv7(),
    primaryKey: true,
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  saleId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  driverId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'DISPATCHED', 'DELIVERED', 'FAILED'),
    defaultValue: 'PENDING',
  },
  deliveryDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
  }
});

module.exports = Delivery;
