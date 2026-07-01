const uuidv7 = () => require('crypto').randomUUID();
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
  tableName: 'ratings',
  freezeTableName: true,
  timestamps: true,
  underscored: false,
  timestamps: true,
});

module.exports = Rating;
