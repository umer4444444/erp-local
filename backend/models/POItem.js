const uuidv7 = () => require('crypto').randomUUID();
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const POItem = sequelize.define('POItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: uuidv7,
    primaryKey: true,
  },
  purchaseOrderId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  unitCost: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'po_items',
  freezeTableName: true,
  timestamps: true,
  underscored: false,
  timestamps: true,
});

module.exports = POItem;
