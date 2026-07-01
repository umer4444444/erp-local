const uuidv7 = () => require('crypto').randomUUID();
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Supplier = sequelize.define('Supplier', {
  id: {
    type: DataTypes.UUID,
    defaultValue: uuidv7,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  contactPerson: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
  },
  phone: {
    type: DataTypes.STRING,
  },
  address: {
    type: DataTypes.TEXT,
  },
  category: {
    type: DataTypes.STRING, // e.g. "Pharmacy", "Groceries"
  }
}, {
  tableName: 'suppliers',
  freezeTableName: true,
  timestamps: true,
  underscored: false,
  timestamps: true,
});

module.exports = Supplier;
