const uuidv7 = () => require('crypto').randomUUID();
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: uuidv7,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sku: {
    type: DataTypes.STRING,
    unique: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  costPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  minStock: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
  },
  wholesalePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  barcode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  unit: {
    type: DataTypes.ENUM('piece', 'box', 'carton', 'outer', 'pack', 'case', 'hour', 'day', 'month', 'kg', 'ton'),
    defaultValue: 'piece',
  },
  categoryId: {
    type: DataTypes.UUID,
  },
  storeType: {
    type: DataTypes.ENUM('department'),
    defaultValue: 'department',
  },
  expiryDate: {
    type: DataTypes.DATEONLY,
  },
  manufacturer: {
    type: DataTypes.STRING,
  },
  // --- New Sprint 5 Business Unit Fields ---
  oemNumber: {
    type: DataTypes.STRING,
    comment: 'Original Equipment Manufacturer number for Auto Parts',
  },
  vehicleCompatibility: {
    type: DataTypes.JSON,
    comment: 'List of compatible vehicles for Auto Parts',
  },
  equipmentType: {
    type: DataTypes.STRING,
    comment: 'Type of equipment for Construction Contracting',
  },
  hourlyRate: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Hourly rate for Labour Hire or Equipment rental',
  },
  metadata: {
    type: DataTypes.JSON,
    comment: 'Flexible JSON for unstructured data across different business units',
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'products',
  freezeTableName: true,
  timestamps: true,
  underscored: false,
  timestamps: true,
});

module.exports = Product;
