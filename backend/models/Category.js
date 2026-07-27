const uuidv7 = () => require('crypto').randomUUID();
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.UUID,
    defaultValue: uuidv7,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  storeType: {
    type: DataTypes.ENUM('department'),
    defaultValue: 'department',
  },
  description: {
    type: DataTypes.STRING,
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'categories',
  freezeTableName: true,
  timestamps: true,
  underscored: false,
  timestamps: true,
});

module.exports = Category;
