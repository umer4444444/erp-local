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
    type: DataTypes.ENUM('sale', 'restock', 'adjustment', 'return', 'void', 'prescription', 'transfer_out', 'transfer_in'),
  },
  warehouseId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  targetWarehouseId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  notes: {
    type: DataTypes.STRING,
  },
  reference: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  companyId: {
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
