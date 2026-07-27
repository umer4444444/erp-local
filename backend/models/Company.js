const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const uuidv7 = () => require('crypto').randomUUID();

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.UUID,
    defaultValue: uuidv7,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  arabicName: {
    type: DataTypes.STRING,
  },
  taxNumber: {
    type: DataTypes.STRING,
  },
  address: {
    type: DataTypes.TEXT,
  },
  logo: {
    type: DataTypes.STRING,
  },
  defaultCurrency: {
    type: DataTypes.STRING,
    defaultValue: 'SAR',
  },
  financialYearStart: {
    type: DataTypes.DATEONLY,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'companies',
  timestamps: true,
});

module.exports = Company;
