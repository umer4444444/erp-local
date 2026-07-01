const uuidv7 = () => require('crypto').randomUUID();
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: uuidv7,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
  },
  phone: {
    type: DataTypes.STRING,
  },
  address: {
    type: DataTypes.STRING,
  },
  creditBalance: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  loyaltyPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  tier: {
    type: DataTypes.ENUM('Bronze', 'Silver', 'Gold', 'VIP'),
    defaultValue: 'Bronze',
  },
}, {
  tableName: 'customers',
  freezeTableName: true,
  timestamps: true,
  underscored: false,
  timestamps: true,
});

module.exports = Customer;
