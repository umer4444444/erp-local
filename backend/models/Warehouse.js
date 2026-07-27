const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const uuidv7 = () => require('crypto').randomUUID();

const Warehouse = sequelize.define('Warehouse', {
  id: {
    type: DataTypes.UUID,
    defaultValue: uuidv7,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  warehouseCode: {
    type: DataTypes.STRING,
  },
  branchId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  location: {
    type: DataTypes.GEOMETRY('POINT'),
  },
  type: {
    type: DataTypes.ENUM('main', 'branch', 'temporary', 'vehicle', 'damaged', 'returned'),
    defaultValue: 'main',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'warehouses',
  timestamps: true,
});

module.exports = Warehouse;
