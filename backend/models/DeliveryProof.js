const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const uuidv7 = () => require('crypto').randomUUID();

const DeliveryProof = sequelize.define('DeliveryProof', {
  id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv7(),
    primaryKey: true,
  },
  deliveryId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  signatureUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  photoUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
  }
});

module.exports = DeliveryProof;
