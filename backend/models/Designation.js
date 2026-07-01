const uuidv7 = () => require('crypto').randomUUID();
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
  tableName: 'designations',
  freezeTableName: true,
  timestamps: true,
  underscored: false,
  timestamps: true,
});

module.exports = Designation;
