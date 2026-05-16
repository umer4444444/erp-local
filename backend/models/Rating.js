const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Rating = sequelize.define('Rating', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
  },
  targetId: {
    type: DataTypes.UUID,
  },
  score: {
    type: DataTypes.INTEGER,
  },
  comment: {
    type: DataTypes.TEXT,
  },
}, {
  timestamps: true,
});

module.exports = Rating;
