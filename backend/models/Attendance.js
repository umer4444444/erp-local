const { v7: uuidv7 } = require('uuid');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: uuidv7,
    primaryKey: true,
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  workShiftId: {
    type: DataTypes.UUID,
  },
  clockIn: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  clockOut: {
    type: DataTypes.DATE,
  },
  status: {
    type: DataTypes.ENUM('present', 'late', 'absent', 'on_leave'),
    defaultValue: 'present',
  },
  lateMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  earlyMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  notes: {
    type: DataTypes.TEXT,
  }
}, {
  timestamps: true,
});

module.exports = Attendance;
