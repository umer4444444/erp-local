const { v7: uuidv7 } = require('uuid');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Designation = sequelize.define('Designation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: uuidv7,
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
  departmentId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = Designation;
