const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockLog = sequelize.define('StockLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  productId: {
    type: DataTypes.UUID,
  },
  userId: {
    type: DataTypes.UUID,
  },
  change: {
    type: DataTypes.INTEGER,
  },
  type: {
    type: DataTypes.ENUM('sale', 'restock', 'adjustment', 'return'),
  },
  notes: {
    type: DataTypes.STRING,
  },
}, {
  timestamps: true,
});

module.exports = StockLog;
