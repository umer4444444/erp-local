const { v7: uuidv7 } = require('uuid');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Rating = sequelize.define('Rating', {
  id: {
    type: DataTypes.UUID,
    defaultValue: uuidv7,
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
