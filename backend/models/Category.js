const { v7: uuidv7 } = require('uuid');
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
    type: DataTypes.ENUM('department', 'pharmacy'),
    defaultValue: 'department',
  },
  description: {
    type: DataTypes.STRING,
  },
}, {
  timestamps: true,
});

module.exports = Category;
