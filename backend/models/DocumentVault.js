const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DocumentVault = sequelize.define('DocumentVault', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fileType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  encryptedContent: {
    type: DataTypes.TEXT, // Base64 or encrypted data
    allowNull: false,
  },
  uploadedBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = DocumentVault;
