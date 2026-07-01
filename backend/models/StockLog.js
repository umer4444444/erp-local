const uuidv7 = () => require('crypto').randomUUID();
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockLog = sequelize.define('StockLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: uuidv7,
    primaryKey: true,
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  change: {
    type: DataTypes.INTEGER,
  },
  type: {
    type: DataTypes.ENUM('sale', 'restock', 'adjustment', 'return', 'void', 'prescription'),
  },
  notes: {
    type: DataTypes.STRING,
  },
  reference: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'stock_logs',
  freezeTableName: true,
  timestamps: true,
  underscored: false,
  timestamps: true,
});

module.exports = StockLog;
