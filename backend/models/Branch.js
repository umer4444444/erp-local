const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const uuidv7 = () => require('crypto').randomUUID();

const Branch = sequelize.define('Branch', {
  id: {
    type: DataTypes.UUID,
    defaultValue: uuidv7,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  branchCode: {
    type: DataTypes.STRING,
  },
  address: {
    type: DataTypes.TEXT,
  },
  location: {
    type: DataTypes.GEOMETRY('POINT'),
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'branches',
  timestamps: true,
});

module.exports = Branch;
