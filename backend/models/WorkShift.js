const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkShift = sequelize.define('WorkShift', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false, // e.g. "Morning Shift", "Night Shift"
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  days: {
    type: DataTypes.JSON, // e.g. ["Mon", "Tue", "Wed", "Thu", "Fri"]
    defaultValue: [],
  },
}, {
  timestamps: true,
});

module.exports = WorkShift;
