const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Designation = sequelize.define('Designation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  level: {
    type: DataTypes.ENUM('junior', 'mid', 'senior', 'lead', 'manager', 'director'),
    defaultValue: 'mid',
  },
}, {
  timestamps: true,
});

module.exports = Designation;
