const uuidv7 = () => require('crypto').randomUUID();
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Prescription = sequelize.define('Prescription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: uuidv7,
    primaryKey: true,
  },
  customerId: {
    type: DataTypes.UUID,
  },
  doctorName: {
    type: DataTypes.STRING,
  },
  imageUrl: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.ENUM('pending', 'verified', 'rejected'),
    defaultValue: 'pending',
  },
  verifiedByUserId: {
    type: DataTypes.UUID, // Pharmacist User ID
  },
  verifiedAt: {
    type: DataTypes.DATE,
  }
}, {
  tableName: 'prescriptions',
  freezeTableName: true,
  timestamps: true,
  underscored: false,
  timestamps: true,
});

module.exports = Prescription;
